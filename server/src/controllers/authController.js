const { User, AuditLog } = require('../models');
const { generateToken } = require('../utils/generateToken');

// @desc    تسجيل مستخدم جديد
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // التحقق من وجود المستخدم
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مسجل مسبقاً'
      });
    }

    // إنشاء المستخدم
    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    // إنشاء التوكن
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'تم التسجيل بنجاح',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تسجيل الدخول
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // التحقق من البيانات
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور'
      });
    }

    // البحث عن المستخدم
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة'
      });
    }

    // التحقق من كلمة المرور
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة'
      });
    }

    // التحقق من حالة الحساب
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'الحساب معطل، يرجى التواصل مع الإدارة'
      });
    }

    // إنشاء التوكن
    const token = generateToken(user._id);

    // تحديث آخر تسجيل دخول (بدون تشغيل middleware)
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    // تسجيل في سجل التدقيق
    try {
      await AuditLog.create({
        action: 'view',
        entityType: 'user',
        entityId: user._id,
        entityNumber: user.email,
        userId: user._id,
        userName: user.name,
        userRole: user.role,
        ipAddress: req.ip || req.connection?.remoteAddress || req.headers?.['x-forwarded-for'],
        userAgent: req.get?.('User-Agent') || req.headers?.['user-agent'],
        description: `تسجيل دخول - ${user.name} (${user.role === 'admin' ? 'مدير' : 'موظف'})`,
        metadata: {
          loginTime: new Date(),
          email: user.email
        }
      });
    } catch (auditError) {
      console.error('Error creating login audit log:', auditError);
    }

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على بيانات المستخدم الحالي
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث بيانات المستخدم
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, avatar },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'تم تحديث البيانات بنجاح',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تغيير كلمة المرور
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // التحقق من كلمة المرور الحالية
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الحالية غير صحيحة'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });
  } catch (error) {
    next(error);
  }
};
