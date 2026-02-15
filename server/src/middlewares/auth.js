const jwt = require('jsonwebtoken');
const { User } = require('../models');

// حماية المسارات
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'يجب تسجيل الدخول للوصول لهذه الصفحة'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'الحساب معطل'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'جلسة غير صالحة، يرجى تسجيل الدخول مرة أخرى'
    });
  }
};

// التحقق من الصلاحيات
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بالوصول لهذه الصفحة'
      });
    }
    next();
  };
};
