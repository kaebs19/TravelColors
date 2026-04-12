const { Appointment, Customer, User, Department, Invoice, Transaction, Task } = require('../models');

// دالة مساعدة لبناء فلتر التاريخ مع نهاية اليوم
const buildDateQuery = (startDate, endDate, field = 'createdAt') => {
  if (!startDate && !endDate) return {};
  const query = { [field]: {} };
  if (startDate) {
    query[field].$gte = new Date(startDate);
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query[field].$lte = end;
  }
  return query;
};

// تحويل قيمة query إلى مصفوفة (تقبل string مفصولة بفواصل أو array)
const toArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  return String(val).split(',').map(s => s.trim()).filter(Boolean);
};

// مراحل aggregation للمواعيد:
// - تستثني المسودات (type: 'draft')
// - تحسب تاريخ فعلي (effectiveDate) = appointmentDate للمؤكدة أو dateFrom لغير المؤكدة أو createdAt كاحتياط
// - تفلتر حسب الفترة على التاريخ الفعلي بدلاً من createdAt
// - تدعم استثناء أنواع المواعيد وأقسام معينة
const buildAppointmentMatchStages = (startDate, endDate, extraMatch = {}, options = {}) => {
  const mongoose = require('mongoose');
  const excludeTypes = toArray(options.excludeTypes);
  const excludeDepartments = toArray(options.excludeDepartments);

  const excludedTypes = ['draft', ...excludeTypes];
  const baseMatch = { type: { $nin: excludedTypes }, ...extraMatch };

  if (excludeDepartments.length > 0) {
    const validIds = excludeDepartments
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));
    if (validIds.length > 0) {
      baseMatch.department = { $nin: validIds };
    }
  }

  const stages = [
    { $match: baseMatch },
    {
      $addFields: {
        effectiveDate: {
          $ifNull: ['$appointmentDate', { $ifNull: ['$dateFrom', '$createdAt'] }]
        }
      }
    }
  ];

  if (startDate || endDate) {
    const range = {};
    if (startDate) {
      range.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      range.$lte = end;
    }
    stages.push({ $match: { effectiveDate: range } });
  }

  return stages;
};

// @desc    تقرير إحصائيات عامة
// @route   GET /api/reports/overview
// @access  Private/Admin
exports.getOverviewReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const customerDateQuery = buildDateQuery(startDate, endDate);
    const apptMatchStages = buildAppointmentMatchStages(startDate, endDate);

    // حساب عدد المواعيد (non-draft) ضمن الفترة
    const apptCountAgg = await Appointment.aggregate([
      ...apptMatchStages,
      { $count: 'count' }
    ]);
    const totalAppointments = apptCountAgg[0]?.count || 0;

    // إحصائيات عامة
    const [
      totalCustomers,
      totalEmployees,
      appointmentStats
    ] = await Promise.all([
      Customer.countDocuments(customerDateQuery),
      User.countDocuments({ role: { $in: ['employee', 'admin'] } }),
      Appointment.aggregate([
        ...apptMatchStages,
        {
          $group: {
            _id: null,
            totalPersons: { $sum: { $ifNull: ['$personsCount', 1] } },
            totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } },
            totalPaid: { $sum: { $ifNull: ['$paidAmount', 0] } },
            confirmedCount: {
              $sum: { $cond: [{ $eq: ['$type', 'confirmed'] }, 1, 0] }
            },
            unconfirmedCount: {
              $sum: { $cond: [{ $eq: ['$type', 'unconfirmed'] }, 1, 0] }
            },
            completedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            cancelledCount: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    const stats = appointmentStats[0] || {
      totalPersons: 0,
      totalAmount: 0,
      totalPaid: 0,
      confirmedCount: 0,
      unconfirmedCount: 0,
      completedCount: 0,
      cancelledCount: 0
    };

    // إحصائيات التقديمات الإلكترونية
    const electronicDepts = await Department.find({ submissionType: 'إلكتروني' }).select('_id processingDays');
    const electronicDeptIds = electronicDepts.map(d => d._id);

    let electronic = { processing: 0, overdue: 0, acceptedMonth: 0, total: 0 };

    if (electronicDeptIds.length > 0) {
      const electronicQuery = {
        isSubmission: true,
        department: { $in: electronicDeptIds }
      };

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [processing, acceptedMonth, totalElectronic] = await Promise.all([
        Appointment.countDocuments({
          ...electronicQuery,
          status: { $in: ['new', 'active', 'confirmed'] },
          type: 'confirmed'
        }),
        Appointment.countDocuments({
          ...electronicQuery,
          status: 'completed',
          updatedAt: { $gte: monthStart }
        }),
        Appointment.countDocuments(electronicQuery)
      ]);

      // حساب المتأخرة
      const activeElectronic = await Appointment.find({
        ...electronicQuery,
        status: { $in: ['new', 'active', 'confirmed'] },
        type: 'confirmed'
      }).populate('department', 'processingDays');

      let overdueCount = 0;
      activeElectronic.forEach(apt => {
        const days = apt.department?.processingDays || 7;
        const created = new Date(apt.createdAt);
        const deadline = new Date(created.getTime() + days * 24 * 60 * 60 * 1000);
        if (now > deadline) overdueCount++;
      });

      electronic = {
        processing,
        overdue: overdueCount,
        acceptedMonth,
        total: totalElectronic
      };
    }

    res.json({
      success: true,
      data: {
        totalAppointments,
        totalCustomers,
        totalEmployees,
        ...stats,
        remainingAmount: stats.totalAmount - stats.totalPaid,
        electronic
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تقرير المواعيد حسب الفترة
// @route   GET /api/reports/appointments
// @access  Private/Admin
exports.getAppointmentsReport = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day', excludeTypes, excludeDepartments, includeDetails } = req.query;

    const apptMatchStages = buildAppointmentMatchStages(
      startDate,
      endDate,
      {},
      { excludeTypes, excludeDepartments }
    );

    let groupByFormat;
    switch (groupBy) {
      case 'week':
        groupByFormat = { $isoWeek: '$effectiveDate' };
        break;
      case 'month':
        groupByFormat = { $dateToString: { format: '%Y-%m', date: '$effectiveDate' } };
        break;
      default:
        groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$effectiveDate' } };
    }

    const report = await Appointment.aggregate([
      ...apptMatchStages,
      {
        $group: {
          _id: groupByFormat,
          count: { $sum: 1 },
          persons: { $sum: { $ifNull: ['$personsCount', 1] } },
          amount: { $sum: { $ifNull: ['$totalAmount', 0] } },
          paid: { $sum: { $ifNull: ['$paidAmount', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // تفاصيل العملاء (قائمة المواعيد) - اختيارية عبر ?includeDetails=true
    let details = [];
    if (includeDetails === 'true' || includeDetails === '1') {
      details = await Appointment.aggregate([
        ...apptMatchStages,
        {
          $lookup: {
            from: 'departments',
            localField: 'department',
            foreignField: '_id',
            as: 'deptInfo'
          }
        },
        { $unwind: { path: '$deptInfo', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdByInfo'
          }
        },
        { $unwind: { path: '$createdByInfo', preserveNullAndEmptyArrays: true } },
        { $sort: { effectiveDate: -1 } },
        {
          $project: {
            _id: 0,
            appointmentId: '$_id',
            customerName: 1,
            phone: 1,
            personsCount: { $ifNull: ['$personsCount', 1] },
            appointmentDate: '$effectiveDate',
            type: 1,
            status: 1,
            totalAmount: { $ifNull: ['$totalAmount', 0] },
            paidAmount: { $ifNull: ['$paidAmount', 0] },
            departmentName: { $ifNull: ['$deptInfo.title', '-' ] },
            createdByName: { $ifNull: ['$createdByInfo.name', '-' ] }
          }
        }
      ]);
    }

    res.json({
      success: true,
      data: report,
      details
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تقرير الموظفين
// @route   GET /api/reports/employees
// @access  Private/Admin
exports.getEmployeesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, excludeTypes, excludeDepartments } = req.query;

    const apptMatchStages = buildAppointmentMatchStages(
      startDate,
      endDate,
      {},
      { excludeTypes, excludeDepartments }
    );

    const report = await Appointment.aggregate([
      ...apptMatchStages,
      {
        $group: {
          _id: '$createdBy',
          totalAppointments: { $sum: 1 },
          totalPersons: { $sum: { $ifNull: ['$personsCount', 1] } },
          totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          employeeId: '$_id',
          employeeName: { $ifNull: ['$employee.name', 'غير معروف'] },
          employeeEmail: '$employee.email',
          totalAppointments: 1,
          totalPersons: 1,
          totalAmount: 1,
          completedCount: 1,
          cancelledCount: 1,
          completionRate: {
            $cond: [
              { $gt: ['$totalAppointments', 0] },
              { $multiply: [{ $divide: ['$completedCount', '$totalAppointments'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { totalAppointments: -1 } }
    ]);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تقرير الأقسام
// @route   GET /api/reports/departments
// @access  Private/Admin
exports.getDepartmentsReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const apptMatchStages = buildAppointmentMatchStages(startDate, endDate);

    const report = await Appointment.aggregate([
      ...apptMatchStages,
      {
        $group: {
          _id: '$department',
          totalAppointments: { $sum: 1 },
          totalPersons: { $sum: { $ifNull: ['$personsCount', 1] } },
          totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } },
          confirmedCount: {
            $sum: { $cond: [{ $eq: ['$type', 'confirmed'] }, 1, 0] }
          },
          unconfirmedCount: {
            $sum: { $cond: [{ $eq: ['$type', 'unconfirmed'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'department'
        }
      },
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          departmentId: '$_id',
          departmentName: { $ifNull: ['$department.title', 'غير محدد'] },
          totalAppointments: 1,
          totalPersons: 1,
          totalAmount: 1,
          confirmedCount: 1,
          unconfirmedCount: 1
        }
      },
      { $sort: { totalAppointments: -1 } }
    ]);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تقرير المالية
// @route   GET /api/reports/financial
// @access  Private/Admin
exports.getFinancialReport = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const apptMatchStages = buildAppointmentMatchStages(startDate, endDate);

    let groupByFormat;
    switch (groupBy) {
      case 'week':
        groupByFormat = { $isoWeek: '$effectiveDate' };
        break;
      case 'month':
        groupByFormat = { $dateToString: { format: '%Y-%m', date: '$effectiveDate' } };
        break;
      default:
        groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$effectiveDate' } };
    }

    const report = await Appointment.aggregate([
      ...apptMatchStages,
      { $match: { totalAmount: { $gt: 0 } } },
      {
        $group: {
          _id: groupByFormat,
          totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } },
          paidAmount: { $sum: { $ifNull: ['$paidAmount', 0] } },
          appointmentsCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 1,
          totalAmount: 1,
          paidAmount: 1,
          remainingAmount: { $subtract: ['$totalAmount', '$paidAmount'] },
          appointmentsCount: 1
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // إجمالي الفترة
    const totals = await Appointment.aggregate([
      ...apptMatchStages,
      {
        $group: {
          _id: null,
          totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } },
          paidAmount: { $sum: { $ifNull: ['$paidAmount', 0] } }
        }
      }
    ]);

    const totalStats = totals[0] || { totalAmount: 0, paidAmount: 0 };

    // توزيع طرق الدفع
    const paymentMethods = await Appointment.aggregate([
      ...apptMatchStages,
      { $match: { paymentType: { $ne: '' } } },
      {
        $group: {
          _id: '$paymentType',
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ['$paidAmount', 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        daily: report,
        totals: {
          ...totalStats,
          remainingAmount: totalStats.totalAmount - totalStats.paidAmount
        },
        paymentMethods
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تقرير أداء الموظفين التفصيلي
// @route   GET /api/reports/employee-performance
// @access  Private/Admin
exports.getEmployeePerformance = async (req, res, next) => {
  try {
    const { startDate, endDate, employeeId, period = 'daily' } = req.query;

    // فلتر التاريخ للعملاء والفواتير (على createdAt لأنه لا يوجد appointmentDate)
    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        }
      };
    }

    // إذا تم تحديد موظف معين
    let employeeMatch = {};
    if (employeeId) {
      const mongoose = require('mongoose');
      employeeMatch = { createdBy: new mongoose.Types.ObjectId(employeeId) };
    }

    // مراحل فلترة المواعيد حسب التاريخ الفعلي واستثناء المسودات
    const apptMatchStages = buildAppointmentMatchStages(startDate, endDate, employeeMatch);

    // تحديد صيغة التجميع حسب الفترة (يستخدم effectiveDate للمواعيد)
    let groupByFormat;
    let customerGroupByFormat;
    switch (period) {
      case 'monthly':
        groupByFormat = { $dateToString: { format: '%Y-%m', date: '$effectiveDate' } };
        customerGroupByFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        break;
      case 'yearly':
        groupByFormat = { $dateToString: { format: '%Y', date: '$effectiveDate' } };
        customerGroupByFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
        break;
      default: // daily
        groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$effectiveDate' } };
        customerGroupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    // تقرير المواعيد لكل موظف
    const appointmentsByEmployee = await Appointment.aggregate([
      ...apptMatchStages,
      {
        $group: {
          _id: {
            employee: '$createdBy',
            period: groupByFormat
          },
          totalAppointments: { $sum: 1 },
          totalPersons: { $sum: { $ifNull: ['$personsCount', 1] } },
          totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } },
          paidAmount: { $sum: { $ifNull: ['$paidAmount', 0] } },
          confirmedCount: { $sum: { $cond: [{ $eq: ['$type', 'confirmed'] }, 1, 0] } },
          completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          completedPersons: {
            $sum: { $cond: [
              { $eq: ['$status', 'completed'] },
              { $ifNull: ['$personsCount', 1] },
              0
            ]}
          },
          cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.employee',
          foreignField: '_id',
          as: 'employeeInfo'
        }
      },
      { $unwind: { path: '$employeeInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          employeeId: '$_id.employee',
          employeeName: { $ifNull: ['$employeeInfo.name', 'غير معروف'] },
          employeeEmail: '$employeeInfo.email',
          period: '$_id.period',
          totalAppointments: 1,
          totalPersons: 1,
          totalAmount: 1,
          paidAmount: 1,
          confirmedCount: 1,
          completedCount: 1,
          completedPersons: 1,
          cancelledCount: 1
        }
      },
      { $sort: { period: -1, totalPersons: -1 } }
    ]);

    // عدد العملاء المضافين لكل موظف
    const customersByEmployee = await Customer.aggregate([
      { $match: { ...dateQuery, ...(employeeId ? { createdBy: new (require('mongoose').Types.ObjectId)(employeeId) } : {}) } },
      {
        $group: {
          _id: {
            employee: '$createdBy',
            period: customerGroupByFormat
          },
          totalCustomers: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.employee',
          foreignField: '_id',
          as: 'employeeInfo'
        }
      },
      { $unwind: { path: '$employeeInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          employeeId: '$_id.employee',
          employeeName: { $ifNull: ['$employeeInfo.name', 'غير معروف'] },
          period: '$_id.period',
          totalCustomers: 1
        }
      },
      { $sort: { period: -1 } }
    ]);

    // الفواتير لكل موظف
    const invoicesByEmployee = await Invoice.aggregate([
      { $match: { ...dateQuery, ...(employeeId ? { createdBy: new (require('mongoose').Types.ObjectId)(employeeId) } : {}) } },
      {
        $group: {
          _id: {
            employee: '$createdBy',
            period: customerGroupByFormat
          },
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$total', 0] } },
          paidAmount: { $sum: { $ifNull: ['$paidAmount', 0] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.employee',
          foreignField: '_id',
          as: 'employeeInfo'
        }
      },
      { $unwind: { path: '$employeeInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          employeeId: '$_id.employee',
          employeeName: { $ifNull: ['$employeeInfo.name', 'غير معروف'] },
          period: '$_id.period',
          totalInvoices: 1,
          totalAmount: 1,
          paidAmount: 1
        }
      },
      { $sort: { period: -1 } }
    ]);

    // تفاصيل المواعيد لكل موظف (قائمة العملاء)
    const appointmentDetailsByEmployee = await Appointment.aggregate([
      ...apptMatchStages,
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'deptInfo'
        }
      },
      { $unwind: { path: '$deptInfo', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdByInfo'
        }
      },
      { $unwind: { path: '$createdByInfo', preserveNullAndEmptyArrays: true } },
      { $sort: { effectiveDate: -1 } },
      {
        $group: {
          _id: '$createdBy',
          appointments: {
            $push: {
              appointmentId: '$_id',
              customerName: '$customerName',
              phone: '$phone',
              personsCount: { $ifNull: ['$personsCount', 1] },
              appointmentDate: '$effectiveDate',
              type: '$type',
              status: '$status',
              totalAmount: { $ifNull: ['$totalAmount', 0] },
              paidAmount: { $ifNull: ['$paidAmount', 0] },
              departmentName: { $ifNull: ['$deptInfo.title', '-'] },
              createdByName: { $ifNull: ['$createdByInfo.name', '-'] }
            }
          }
        }
      }
    ]);

    // تجميع البيانات لكل موظف
    const employees = await User.find({ role: { $in: ['employee', 'admin'] } }).select('name email role');

    const summary = employees.map(emp => {
      const empAppointments = appointmentsByEmployee.filter(a => a.employeeId?.toString() === emp._id.toString());
      const empCustomers = customersByEmployee.filter(c => c.employeeId?.toString() === emp._id.toString());
      const empInvoices = invoicesByEmployee.filter(i => i.employeeId?.toString() === emp._id.toString());
      const empDetails = appointmentDetailsByEmployee.find(
        d => d._id?.toString() === emp._id.toString()
      );

      return {
        employeeId: emp._id,
        employeeName: emp.name,
        employeeEmail: emp.email,
        employeeRole: emp.role,
        totals: {
          appointments: empAppointments.reduce((sum, a) => sum + a.totalAppointments, 0),
          persons: empAppointments.reduce((sum, a) => sum + a.totalPersons, 0),
          customers: empCustomers.reduce((sum, c) => sum + c.totalCustomers, 0),
          invoices: empInvoices.reduce((sum, i) => sum + i.totalInvoices, 0),
          appointmentAmount: empAppointments.reduce((sum, a) => sum + a.totalAmount, 0),
          invoiceAmount: empInvoices.reduce((sum, i) => sum + i.totalAmount, 0),
          completedAppointments: empAppointments.reduce((sum, a) => sum + a.completedCount, 0),
          completedPersons: empAppointments.reduce((sum, a) => sum + (a.completedPersons || 0), 0),
          cancelledAppointments: empAppointments.reduce((sum, a) => sum + a.cancelledCount, 0)
        },
        breakdown: {
          appointments: empAppointments,
          customers: empCustomers,
          invoices: empInvoices
        },
        appointmentsDetails: empDetails?.appointments || []
      };
    });

    res.json({
      success: true,
      data: {
        summary: summary.filter(s => s.totals.appointments > 0 || s.totals.customers > 0 || s.totals.invoices > 0),
        period,
        dateRange: { startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Employee performance report error:', error);
    next(error);
  }
};

// @desc    تقرير العملاء الأكثر إنفاقاً
// @route   GET /api/reports/top-customers
// @access  Private/Admin
exports.getTopCustomers = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        }
      };
    }

    // العملاء الأكثر إنفاقاً من المواعيد
    const topByAppointments = await Appointment.aggregate([
      ...buildAppointmentMatchStages(startDate, endDate, { customer: { $ne: null } }),
      {
        $group: {
          _id: '$customer',
          totalAppointments: { $sum: 1 },
          totalPersons: { $sum: { $ifNull: ['$personsCount', 1] } },
          totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } },
          paidAmount: { $sum: { $ifNull: ['$paidAmount', 0] } }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      { $unwind: { path: '$customerInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          customerId: '$_id',
          customerName: { $ifNull: ['$customerInfo.name', 'غير معروف'] },
          customerPhone: '$customerInfo.phone',
          customerEmail: '$customerInfo.email',
          totalAppointments: 1,
          totalPersons: 1,
          totalAmount: 1,
          paidAmount: 1,
          remainingAmount: { $subtract: ['$totalAmount', '$paidAmount'] }
        }
      },
      { $sort: { paidAmount: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // العملاء الأكثر إنفاقاً من الفواتير
    const topByInvoices = await Invoice.aggregate([
      { $match: { ...dateQuery, customer: { $ne: null } } },
      {
        $group: {
          _id: '$customer',
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$total', 0] } },
          paidAmount: { $sum: { $ifNull: ['$paidAmount', 0] } }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      { $unwind: { path: '$customerInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          customerId: '$_id',
          customerName: { $ifNull: ['$customerInfo.name', 'غير معروف'] },
          customerPhone: '$customerInfo.phone',
          totalInvoices: 1,
          totalAmount: 1,
          paidAmount: 1
        }
      },
      { $sort: { paidAmount: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: {
        byAppointments: topByAppointments,
        byInvoices: topByInvoices
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تقرير الأرباح والخسائر
// @route   GET /api/reports/profit-loss
// @access  Private/Admin
exports.getProfitLossReport = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        }
      };
    }

    let groupByFormat;
    let apptGroupByFormat;
    switch (groupBy) {
      case 'yearly':
        groupByFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
        apptGroupByFormat = { $dateToString: { format: '%Y', date: '$effectiveDate' } };
        break;
      case 'daily':
        groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        apptGroupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$effectiveDate' } };
        break;
      default: // monthly
        groupByFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        apptGroupByFormat = { $dateToString: { format: '%Y-%m', date: '$effectiveDate' } };
    }

    // الدخل من المواعيد
    const appointmentIncome = await Appointment.aggregate([
      ...buildAppointmentMatchStages(startDate, endDate, { paidAmount: { $gt: 0 } }),
      {
        $group: {
          _id: apptGroupByFormat,
          income: { $sum: { $ifNull: ['$paidAmount', 0] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // الدخل من الفواتير
    const invoiceIncome = await Invoice.aggregate([
      { $match: { ...dateQuery, paidAmount: { $gt: 0 }, type: 'invoice' } },
      {
        $group: {
          _id: groupByFormat,
          income: { $sum: { $ifNull: ['$paidAmount', 0] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // المصروفات من المعاملات
    const expenses = await Transaction.aggregate([
      { $match: { ...dateQuery, type: 'expense' } },
      {
        $group: {
          _id: groupByFormat,
          expense: { $sum: { $ifNull: ['$amount', 0] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // تجميع البيانات
    const allPeriods = new Set([
      ...appointmentIncome.map(a => a._id),
      ...invoiceIncome.map(i => i._id),
      ...expenses.map(e => e._id)
    ]);

    const report = Array.from(allPeriods).sort().map(period => {
      const aptInc = appointmentIncome.find(a => a._id === period);
      const invInc = invoiceIncome.find(i => i._id === period);
      const exp = expenses.find(e => e._id === period);

      const totalIncome = (aptInc?.income || 0) + (invInc?.income || 0);
      const totalExpense = exp?.expense || 0;

      return {
        period,
        appointmentIncome: aptInc?.income || 0,
        invoiceIncome: invInc?.income || 0,
        totalIncome,
        expense: totalExpense,
        profit: totalIncome - totalExpense,
        profitMargin: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(2) : 0
      };
    });

    // الإجمالي
    const totals = {
      appointmentIncome: appointmentIncome.reduce((sum, a) => sum + a.income, 0),
      invoiceIncome: invoiceIncome.reduce((sum, i) => sum + i.income, 0),
      totalIncome: 0,
      expense: expenses.reduce((sum, e) => sum + e.expense, 0),
      profit: 0,
      profitMargin: 0
    };
    totals.totalIncome = totals.appointmentIncome + totals.invoiceIncome;
    totals.profit = totals.totalIncome - totals.expense;
    totals.profitMargin = totals.totalIncome > 0 ? ((totals.profit / totals.totalIncome) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        breakdown: report,
        totals,
        period: groupBy,
        dateRange: { startDate, endDate }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    بيانات الرسوم البيانية
// @route   GET /api/reports/charts
// @access  Private/Admin
exports.getChartsData = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const apptMatchStages = buildAppointmentMatchStages(startDate, endDate);

    // المواعيد اليومية (آخر 30 يوم)
    const appointmentsChart = await Appointment.aggregate([
      ...apptMatchStages,
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$effectiveDate' } },
          count: { $sum: 1 },
          persons: { $sum: { $ifNull: ['$personsCount', 1] } },
          amount: { $sum: { $ifNull: ['$paidAmount', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // توزيع حالات المواعيد
    const statusDistribution = await Appointment.aggregate([
      ...apptMatchStages,
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // توزيع أنواع المواعيد
    const typeDistribution = await Appointment.aggregate([
      ...apptMatchStages,
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // الإيرادات الشهرية (آخر 12 شهر) — مستقلة عن فلتر الفترة
    const monthlyRevenue = await Appointment.aggregate([
      ...buildAppointmentMatchStages(null, null, { paidAmount: { $gt: 0 } }),
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$effectiveDate' } },
          revenue: { $sum: { $ifNull: ['$paidAmount', 0] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 12 }
    ]);

    // أداء الموظفين
    const employeePerformance = await Appointment.aggregate([
      ...apptMatchStages,
      {
        $group: {
          _id: '$createdBy',
          appointments: { $sum: 1 },
          persons: { $sum: { $ifNull: ['$personsCount', 1] } },
          revenue: { $sum: { $ifNull: ['$paidAmount', 0] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ['$user.name', 'غير معروف'] },
          appointments: 1,
          persons: 1,
          revenue: 1
        }
      },
      { $sort: { persons: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        appointmentsChart: appointmentsChart.reverse(),
        statusDistribution,
        typeDistribution,
        monthlyRevenue: monthlyRevenue.reverse(),
        employeePerformance
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تقرير المهام
// @route   GET /api/reports/tasks
// @access  Private/Admin
exports.getTasksReport = async (req, res, next) => {
  try {
    const { startDate, endDate, month, specificDate, groupBy = 'day', excludeTypes, excludeDepartments } = req.query;

    // فلتر استثناء أنواع وأقسام المواعيد المرتبطة بالمهام
    // (يُطبّق بعد $lookup على appointmentInfo)
    const mongoose = require('mongoose');
    const excludedTypes = ['draft', ...toArray(excludeTypes)];
    const excludedDepIds = toArray(excludeDepartments)
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const taskApptFilter = { 'appointmentInfo.type': { $nin: excludedTypes } };
    if (excludedDepIds.length > 0) {
      taskApptFilter['appointmentInfo.department'] = { $nin: excludedDepIds };
    }
    const taskApptFilterStage = { $match: taskApptFilter };

    // بناء فلتر التاريخ بناءً على تاريخ الموعد (وليس تاريخ إنشاء المهمة)
    let dateStart = null;
    let dateEnd = null;

    if (specificDate) {
      dateStart = new Date(specificDate);
      dateEnd = new Date(specificDate);
      dateEnd.setHours(23, 59, 59, 999);
    } else if (month) {
      const year = new Date().getFullYear();
      const monthNum = parseInt(month);
      dateStart = new Date(year, monthNum - 1, 1);
      dateEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);
    } else if (startDate && endDate) {
      dateStart = new Date(startDate);
      dateEnd = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    // البحث عن المواعيد ضمن نطاق التاريخ ثم استخدام معرّفاتها لفلترة المهام
    let dateQuery = {};
    if (dateStart && dateEnd) {
      const dateRange = { $gte: dateStart, $lte: dateEnd };
      const matchingAppointments = await Appointment.find({
        $or: [
          { appointmentDate: dateRange },
          { appointmentDate: null, dateFrom: dateRange }
        ]
      }).select('_id');
      const appointmentIds = matchingAppointments.map(a => a._id);
      dateQuery = { appointment: { $in: appointmentIds } };
    }

    // إحصائيات عامة للمهام
    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      cancelledTasks,
      newTasks
    ] = await Promise.all([
      Task.countDocuments(dateQuery),
      Task.countDocuments({ ...dateQuery, status: 'completed' }),
      Task.countDocuments({ ...dateQuery, status: 'in_progress' }),
      Task.countDocuments({ ...dateQuery, status: 'cancelled' }),
      Task.countDocuments({ ...dateQuery, status: 'new' })
    ]);

    // المهام المكتملة حسب الموظف مع عدد الأشخاص
    const tasksByEmployee = await Task.aggregate([
      { $match: { ...dateQuery, status: 'completed' } },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointment',
          foreignField: '_id',
          as: 'appointmentInfo'
        }
      },
      { $unwind: { path: '$appointmentInfo', preserveNullAndEmptyArrays: true } },
      taskApptFilterStage,
      {
        $group: {
          _id: '$assignedTo',
          completedTasks: { $sum: 1 },
          totalPersons: { $sum: { $ifNull: ['$appointmentInfo.personsCount', 1] } },
          totalAmount: { $sum: { $ifNull: ['$appointmentInfo.totalAmount', 0] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'employeeInfo'
        }
      },
      { $unwind: { path: '$employeeInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          employeeId: '$_id',
          employeeName: { $ifNull: ['$employeeInfo.name', 'غير معروف'] },
          employeeEmail: '$employeeInfo.email',
          completedTasks: 1,
          totalPersons: 1,
          totalAmount: 1
        }
      },
      { $sort: { completedTasks: -1 } }
    ]);

    // إجمالي الأشخاص من المهام المكتملة
    const totalPersonsCompleted = await Task.aggregate([
      { $match: { ...dateQuery, status: 'completed' } },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointment',
          foreignField: '_id',
          as: 'appointmentInfo'
        }
      },
      { $unwind: { path: '$appointmentInfo', preserveNullAndEmptyArrays: true } },
      taskApptFilterStage,
      {
        $group: {
          _id: null,
          totalPersons: { $sum: { $ifNull: ['$appointmentInfo.personsCount', 1] } }
        }
      }
    ]);

    // متوسط وقت إكمال المهمة
    const avgCompletionTime = await Task.aggregate([
      {
        $match: {
          ...dateQuery,
          status: 'completed',
          startedAt: { $ne: null },
          completedAt: { $ne: null }
        }
      },
      {
        $project: {
          completionTimeMs: { $subtract: ['$completedAt', '$startedAt'] }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$completionTimeMs' }
        }
      }
    ]);

    // تحويل الوقت لساعات/دقائق
    const avgTimeMs = avgCompletionTime[0]?.avgTime || 0;
    const avgTimeHours = Math.floor(avgTimeMs / (1000 * 60 * 60));
    const avgTimeMinutes = Math.floor((avgTimeMs % (1000 * 60 * 60)) / (1000 * 60));

    // تفاصيل المهام المكتملة مع بيانات العملاء
    const completedTasksDetails = await Task.aggregate([
      { $match: { ...dateQuery, status: 'completed' } },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointment',
          foreignField: '_id',
          as: 'appointmentInfo'
        }
      },
      { $unwind: { path: '$appointmentInfo', preserveNullAndEmptyArrays: true } },
      taskApptFilterStage,
      {
        $lookup: {
          from: 'customers',
          localField: 'appointmentInfo.customer',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      { $unwind: { path: '$customerInfo', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'employeeInfo'
        }
      },
      { $unwind: { path: '$employeeInfo', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'appointmentInfo.createdBy',
          foreignField: '_id',
          as: 'createdByInfo'
        }
      },
      { $unwind: { path: '$createdByInfo', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'departments',
          localField: 'appointmentInfo.department',
          foreignField: '_id',
          as: 'deptInfo'
        }
      },
      { $unwind: { path: '$deptInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          taskNumber: 1,
          customerName: {
            $ifNull: ['$customerInfo.name', { $ifNull: ['$appointmentInfo.customerName', 'غير معروف'] }]
          },
          customerPhone: { $ifNull: ['$customerInfo.phone', '$appointmentInfo.phone'] },
          personsCount: { $ifNull: ['$appointmentInfo.personsCount', 1] },
          completedAt: 1,
          employeeName: { $ifNull: ['$employeeInfo.name', 'غير معروف'] },
          createdByName: { $ifNull: ['$createdByInfo.name', '-'] },
          departmentName: { $ifNull: ['$deptInfo.title', '-'] },
          appointmentDate: '$appointmentInfo.appointmentDate',
          totalAmount: { $ifNull: ['$appointmentInfo.totalAmount', 0] },
          paidAmount: { $ifNull: ['$appointmentInfo.paidAmount', 0] }
        }
      },
      { $sort: { completedAt: -1 } }
    ]);

    // تجميع المهام حسب الشهر
    const tasksByMonth = await Task.aggregate([
      { $match: { status: 'completed' } },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointment',
          foreignField: '_id',
          as: 'appointmentInfo'
        }
      },
      { $unwind: { path: '$appointmentInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $month: '$completedAt' },
          completedTasks: { $sum: 1 },
          totalPersons: { $sum: { $ifNull: ['$appointmentInfo.personsCount', 1] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // أسماء الشهور بالعربية
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    const tasksByMonthFormatted = tasksByMonth.map(item => ({
      month: item._id,
      monthName: monthNames[item._id - 1],
      completedTasks: item.completedTasks,
      totalPersons: item.totalPersons
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          cancelledTasks,
          newTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          totalPersonsCompleted: totalPersonsCompleted[0]?.totalPersons || 0,
          avgCompletionTime: avgTimeMs > 0 ? `${avgTimeHours}س ${avgTimeMinutes}د` : '-'
        },
        byEmployee: tasksByEmployee,
        byMonth: tasksByMonthFormatted,
        completedTasksDetails,
        dateRange: { startDate, endDate },
        filters: { month, specificDate }
      }
    });
  } catch (error) {
    console.error('Tasks report error:', error);
    next(error);
  }
};
