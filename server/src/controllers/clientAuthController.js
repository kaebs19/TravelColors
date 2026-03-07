const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ClientProfile = require('../models/ClientProfile');
const WebsiteContent = require('../models/WebsiteContent');
const sendEmail = require('../utils/sendEmail');
const { sendEmailSilent } = require('../utils/sendEmail');
const { welcomeEmail, passwordResetEmail, passwordChangedEmail } = require('../utils/emailTemplates');

// جلب إعدادات البريد من قاعدة البيانات
const getEmailOverrides = async (templateKey) => {
  try {
    const content = await WebsiteContent.getContent();
    return content.emailSettings?.[templateKey] || {};
  } catch (e) {
    return {};
  }
};

// توليد JWT خاص بالعميل
const generateClientToken = (clientId) => {
  return jwt.sign(
    { clientId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// @desc    تسجيل عميل جديد
// @route   POST /api/client/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // التحقق من عدم وجود حساب بنفس الإيميل
    const existingClient = await ClientProfile.findOne({ email });
    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مسجل مسبقاً'
      });
    }

    // إنشاء الحساب
    const client = await ClientProfile.create({
      name,
      email,
      password,
      phone
    });

    // توليد التوكن
    const token = generateClientToken(client._id);

    // تحديث آخر تسجيل دخول
    client.lastLogin = new Date();
    await client.save();

    // إرسال إيميل ترحيبي (بدون انتظار)
    getEmailOverrides('welcome').then(overrides => {
      const welcome = welcomeEmail(client.name, overrides);
      sendEmailSilent({ email: client.email, subject: welcome.subject, html: welcome.html });
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: {
        token,
        client: {
          _id: client._id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          nationalId: client.nationalId,
          shippingAddress: client.shippingAddress
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تسجيل دخول العميل
// @route   POST /api/client/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور'
      });
    }

    // البحث عن العميل مع كلمة المرور
    const client = await ClientProfile.findOne({ email }).select('+password');

    if (!client) {
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة'
      });
    }

    if (!client.isActive) {
      return res.status(401).json({
        success: false,
        message: 'الحساب معطل، يرجى التواصل مع الدعم'
      });
    }

    // التحقق من كلمة المرور
    const isMatch = await client.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة'
      });
    }

    // توليد التوكن
    const token = generateClientToken(client._id);

    // تحديث آخر تسجيل دخول
    client.lastLogin = new Date();
    await client.save();

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        token,
        client: {
          _id: client._id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          nationalId: client.nationalId,
          shippingAddress: client.shippingAddress
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على بيانات العميل الحالي
// @route   GET /api/client/auth/me
// @access  Private (Client)
exports.getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        client: {
          _id: req.client._id,
          name: req.client.name,
          email: req.client.email,
          phone: req.client.phone,
          address: req.client.address,
          nationalId: req.client.nationalId,
          shippingAddress: req.client.shippingAddress
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث بيانات العميل
// @route   PUT /api/client/auth/update-profile
// @access  Private (Client)
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, nationalId, shippingAddress } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (nationalId !== undefined) updates.nationalId = nationalId;
    if (shippingAddress !== undefined) updates.shippingAddress = shippingAddress;

    const client = await ClientProfile.findByIdAndUpdate(
      req.client._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'تم تحديث البيانات بنجاح',
      data: {
        client: {
          _id: client._id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          nationalId: client.nationalId,
          shippingAddress: client.shippingAddress
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تغيير كلمة المرور
// @route   PUT /api/client/auth/change-password
// @access  Private (Client)
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال كلمة المرور الحالية والجديدة'
      });
    }

    const client = await ClientProfile.findById(req.client._id).select('+password');
    const isMatch = await client.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'كلمة المرور الحالية غير صحيحة'
      });
    }

    client.password = newPassword;
    await client.save();

    // إشعار تغيير كلمة المرور
    getEmailOverrides('passwordChanged').then(overrides => {
      const changed = passwordChangedEmail(client.name, overrides);
      sendEmailSilent({ email: client.email, subject: changed.subject, html: changed.html });
    });

    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    نسيت كلمة المرور
// @route   POST /api/client/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال البريد الإلكتروني' });
    }

    const client = await ClientProfile.findOne({ email });

    // نرجع نفس الرسالة حتى لو الإيميل غير موجود (أمان)
    if (!client) {
      return res.json({
        success: true,
        message: 'إذا كان البريد مسجلاً لدينا، سيصلك رابط استعادة كلمة المرور'
      });
    }

    // توليد توكن
    const resetToken = client.createPasswordResetToken();
    await client.save({ validateBeforeSave: false });

    // بناء رابط الاستعادة
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').split(',')[0];
    const resetUrl = `${clientUrl}/portal/reset-password/${resetToken}`;

    // إرسال الإيميل
    const overrides = await getEmailOverrides('passwordReset');
    const resetEmailData = passwordResetEmail(client.name, resetUrl, overrides);
    try {
      await sendEmail({ email: client.email, subject: resetEmailData.subject, html: resetEmailData.html });
    } catch (err) {
      // إذا فشل الإرسال نمسح التوكن
      client.passwordResetToken = undefined;
      client.passwordResetExpires = undefined;
      await client.save({ validateBeforeSave: false });
      console.error('[ForgotPassword] Email send failed:', err.message);
      return res.status(500).json({ success: false, message: 'حدث خطأ في إرسال البريد الإلكتروني' });
    }

    res.json({
      success: true,
      message: 'إذا كان البريد مسجلاً لدينا، سيصلك رابط استعادة كلمة المرور'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إعادة تعيين كلمة المرور
// @route   POST /api/client/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    // تشفير التوكن للمقارنة
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const client = await ClientProfile.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!client) {
      return res.status(400).json({
        success: false,
        message: 'الرابط غير صالح أو منتهي الصلاحية'
      });
    }

    // تحديث كلمة المرور
    client.password = password;
    client.passwordResetToken = undefined;
    client.passwordResetExpires = undefined;
    await client.save();

    // إشعار تغيير كلمة المرور
    getEmailOverrides('passwordChanged').then(overrides => {
      const changed = passwordChangedEmail(client.name, overrides);
      sendEmailSilent({ email: client.email, subject: changed.subject, html: changed.html });
    });

    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح، يمكنك تسجيل الدخول الآن'
    });
  } catch (error) {
    next(error);
  }
};
