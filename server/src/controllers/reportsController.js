const { Appointment, Customer, User, Department, Invoice, Transaction, Task } = require('../models');

// @desc    تقرير إحصائيات عامة
// @route   GET /api/reports/overview
// @access  Private/Admin
exports.getOverviewReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // إحصائيات عامة
    const [
      totalAppointments,
      totalCustomers,
      totalEmployees,
      appointmentStats
    ] = await Promise.all([
      Appointment.countDocuments(dateQuery),
      Customer.countDocuments(dateQuery),
      User.countDocuments({ role: { $in: ['employee', 'admin'] } }),
      Appointment.aggregate([
        { $match: dateQuery },
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

    res.json({
      success: true,
      data: {
        totalAppointments,
        totalCustomers,
        totalEmployees,
        ...stats,
        remainingAmount: stats.totalAmount - stats.totalPaid
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
    const { startDate, endDate, groupBy = 'day' } = req.query;

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    let groupByFormat;
    switch (groupBy) {
      case 'week':
        groupByFormat = { $isoWeek: '$createdAt' };
        break;
      case 'month':
        groupByFormat = { $month: '$createdAt' };
        break;
      default:
        groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const report = await Appointment.aggregate([
      { $match: dateQuery },
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

    res.json({
      success: true,
      data: report
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
    const { startDate, endDate } = req.query;

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const report = await Appointment.aggregate([
      { $match: dateQuery },
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

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const report = await Appointment.aggregate([
      { $match: dateQuery },
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

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    let groupByFormat;
    switch (groupBy) {
      case 'week':
        groupByFormat = { $isoWeek: '$createdAt' };
        break;
      case 'month':
        groupByFormat = { $month: '$createdAt' };
        break;
      default:
        groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const report = await Appointment.aggregate([
      { $match: { ...dateQuery, totalAmount: { $gt: 0 } } },
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
      { $match: dateQuery },
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
      { $match: { ...dateQuery, paymentType: { $ne: '' } } },
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

    // تحديد صيغة التجميع حسب الفترة
    let groupByFormat;
    switch (period) {
      case 'monthly':
        groupByFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        break;
      case 'yearly':
        groupByFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
        break;
      default: // daily
        groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    // تقرير المواعيد لكل موظف
    const appointmentsByEmployee = await Appointment.aggregate([
      { $match: { ...dateQuery, ...employeeMatch } },
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
            period: groupByFormat
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
            period: groupByFormat
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

    // تجميع البيانات لكل موظف
    const employees = await User.find({ role: { $in: ['employee', 'admin'] } }).select('name email role');

    const summary = employees.map(emp => {
      const empAppointments = appointmentsByEmployee.filter(a => a.employeeId?.toString() === emp._id.toString());
      const empCustomers = customersByEmployee.filter(c => c.employeeId?.toString() === emp._id.toString());
      const empInvoices = invoicesByEmployee.filter(i => i.employeeId?.toString() === emp._id.toString());

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
          cancelledAppointments: empAppointments.reduce((sum, a) => sum + a.cancelledCount, 0)
        },
        breakdown: {
          appointments: empAppointments,
          customers: empCustomers,
          invoices: empInvoices
        }
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
      { $match: { ...dateQuery, customer: { $ne: null } } },
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
    switch (groupBy) {
      case 'yearly':
        groupByFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
        break;
      case 'daily':
        groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        break;
      default: // monthly
        groupByFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    }

    // الدخل من المواعيد
    const appointmentIncome = await Appointment.aggregate([
      { $match: { ...dateQuery, paidAmount: { $gt: 0 } } },
      {
        $group: {
          _id: groupByFormat,
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

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        }
      };
    }

    // المواعيد اليومية (آخر 30 يوم)
    const appointmentsChart = await Appointment.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          persons: { $sum: { $ifNull: ['$personsCount', 1] } },
          amount: { $sum: { $ifNull: ['$paidAmount', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // توزيع حالات المواعيد
    const statusDistribution = await Appointment.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // توزيع أنواع المواعيد
    const typeDistribution = await Appointment.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // الإيرادات الشهرية (آخر 12 شهر)
    const monthlyRevenue = await Appointment.aggregate([
      { $match: { paidAmount: { $gt: 0 } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: { $ifNull: ['$paidAmount', 0] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 12 }
    ]);

    // أداء الموظفين
    const employeePerformance = await Appointment.aggregate([
      { $match: dateQuery },
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
    const { startDate, endDate, month, specificDate, groupBy = 'day' } = req.query;

    let dateQuery = {};

    // فلتر حسب تاريخ محدد
    if (specificDate) {
      const date = new Date(specificDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      dateQuery = {
        createdAt: {
          $gte: date,
          $lt: nextDay
        }
      };
    }
    // فلتر حسب الشهر
    else if (month) {
      const year = new Date().getFullYear();
      const monthNum = parseInt(month);
      const startOfMonth = new Date(year, monthNum - 1, 1);
      const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59, 999);
      dateQuery = {
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      };
    }
    // فلتر حسب نطاق التاريخ
    else if (startDate && endDate) {
      dateQuery = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        }
      };
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
        $project: {
          _id: 0,
          taskNumber: 1,
          customerName: { $ifNull: ['$customerInfo.name', 'غير معروف'] },
          customerPhone: '$customerInfo.phone',
          personsCount: { $ifNull: ['$appointmentInfo.personsCount', 1] },
          completedAt: 1,
          employeeName: { $ifNull: ['$employeeInfo.name', 'غير معروف'] },
          appointmentDate: '$appointmentInfo.appointmentDate'
        }
      },
      { $sort: { completedAt: -1 } },
      { $limit: 100 }
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
