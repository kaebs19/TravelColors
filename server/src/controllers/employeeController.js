const { User, Appointment } = require('../models');

// @desc    الحصول على جميع الموظفين
// @route   GET /api/employees
// @access  Private/Admin
exports.getEmployees = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, role } = req.query;

    const query = {
      role: { $in: ['employee', 'admin'] }
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } }
      ];
    }

    if (role && ['employee', 'admin'].includes(role)) {
      query.role = role;
    }

    const total = await User.countDocuments(query);
    const employees = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // جلب إحصائيات المواعيد لكل موظف
    const employeeIds = employees.map(e => e._id);

    const appointmentStats = await Appointment.aggregate([
      { $match: { createdBy: { $in: employeeIds } } },
      {
        $group: {
          _id: '$createdBy',
          totalAppointments: { $sum: 1 },
          totalPersons: { $sum: { $ifNull: ['$personsCount', 1] } },
          totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          lastAppointment: { $max: '$createdAt' }
        }
      }
    ]);

    // إحصائيات الشهر الحالي
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyStats = await Appointment.aggregate([
      {
        $match: {
          createdBy: { $in: employeeIds },
          createdAt: { $gte: monthStart }
        }
      },
      {
        $group: {
          _id: '$createdBy',
          monthAppointments: { $sum: 1 },
          monthPersons: { $sum: { $ifNull: ['$personsCount', 1] } },
          monthAmount: { $sum: { $ifNull: ['$totalAmount', 0] } }
        }
      }
    ]);

    // إنشاء خريطة للإحصائيات
    const statsMap = {};
    appointmentStats.forEach(stat => {
      statsMap[stat._id.toString()] = {
        totalAppointments: stat.totalAppointments,
        totalPersons: stat.totalPersons,
        totalAmount: stat.totalAmount,
        completedCount: stat.completedCount,
        lastAppointment: stat.lastAppointment
      };
    });

    const monthlyStatsMap = {};
    monthlyStats.forEach(stat => {
      monthlyStatsMap[stat._id.toString()] = {
        monthAppointments: stat.monthAppointments,
        monthPersons: stat.monthPersons,
        monthAmount: stat.monthAmount
      };
    });

    // دمج الإحصائيات مع بيانات الموظفين
    const employeesWithStats = employees.map(employee => {
      const stats = statsMap[employee._id.toString()] || {
        totalAppointments: 0,
        totalPersons: 0,
        totalAmount: 0,
        completedCount: 0,
        lastAppointment: null
      };
      const monthly = monthlyStatsMap[employee._id.toString()] || {
        monthAppointments: 0,
        monthPersons: 0,
        monthAmount: 0
      };
      return {
        ...employee,
        stats: {
          ...stats,
          ...monthly
        }
      };
    });

    res.json({
      success: true,
      data: {
        employees: employeesWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على موظف واحد
// @route   GET /api/employees/:id
// @access  Private/Admin
exports.getEmployee = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id).select('-password').lean();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    // جلب إحصائيات المواعيد
    const appointmentStats = await Appointment.aggregate([
      { $match: { createdBy: employee._id } },
      {
        $group: {
          _id: null,
          totalAppointments: { $sum: 1 },
          totalPersons: { $sum: { $ifNull: ['$personsCount', 1] } },
          totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    // جلب أحدث المواعيد
    const recentAppointments = await Appointment.find({ createdBy: employee._id })
      .populate('department', 'title')
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const stats = appointmentStats[0] || {
      totalAppointments: 0,
      totalPersons: 0,
      totalAmount: 0,
      completedCount: 0
    };

    res.json({
      success: true,
      data: {
        employee: {
          ...employee,
          stats
        },
        recentAppointments
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إنشاء موظف جديد
// @route   POST /api/employees
// @access  Private/Admin
exports.createEmployee = async (req, res, next) => {
  try {
    const { name, email, password, phone, jobTitle, role, avatar } = req.body;

    // التحقق من وجود الإيميل
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مستخدم مسبقاً'
      });
    }

    const employee = await User.create({
      name,
      email,
      password,
      phone,
      jobTitle: jobTitle || '',
      role: role || 'employee',
      avatar: avatar || '/favicon.svg',
      isActive: true
    });

    // إزالة كلمة المرور من الاستجابة
    const employeeResponse = employee.toObject();
    delete employeeResponse.password;

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الموظف بنجاح',
      data: { employee: employeeResponse }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث موظف
// @route   PUT /api/employees/:id
// @access  Private/Admin
exports.updateEmployee = async (req, res, next) => {
  try {
    const { name, email, phone, jobTitle, role, avatar, password } = req.body;

    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    // التحقق من الإيميل إذا تم تغييره
    if (email && email !== employee.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'البريد الإلكتروني مستخدم مسبقاً'
        });
      }
    }

    // تحديث الحقول
    employee.name = name || employee.name;
    employee.email = email || employee.email;
    employee.phone = phone || employee.phone;
    employee.jobTitle = jobTitle !== undefined ? jobTitle : employee.jobTitle;
    employee.role = role || employee.role;
    employee.avatar = avatar !== undefined ? avatar : employee.avatar;

    // تحديث كلمة المرور إذا تم إرسالها
    if (password) {
      employee.password = password;
    }

    await employee.save();

    const employeeResponse = employee.toObject();
    delete employeeResponse.password;

    res.json({
      success: true,
      message: 'تم تحديث الموظف بنجاح',
      data: { employee: employeeResponse }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    حذف موظف
// @route   DELETE /api/employees/:id
// @access  Private/Admin
exports.deleteEmployee = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    // منع حذف المدير الرئيسي
    if (employee.email === 'admin@travelcolors.com') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف المدير الرئيسي'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'تم حذف الموظف بنجاح'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تفعيل/إلغاء تفعيل موظف
// @route   PUT /api/employees/:id/toggle
// @access  Private/Admin
exports.toggleEmployee = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    // منع تعطيل المدير الرئيسي
    if (employee.email === 'admin@travelcolors.com') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تعطيل المدير الرئيسي'
      });
    }

    employee.isActive = !employee.isActive;
    await employee.save();

    res.json({
      success: true,
      message: employee.isActive ? 'تم تفعيل الموظف' : 'تم تعطيل الموظف',
      data: { employee }
    });
  } catch (error) {
    next(error);
  }
};
