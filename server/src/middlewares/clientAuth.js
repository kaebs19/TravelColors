const jwt = require('jsonwebtoken');
const ClientProfile = require('../models/ClientProfile');

// حماية مسارات العميل
exports.clientProtect = async (req, res, next) => {
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

    // التحقق من أن التوكن خاص بالعميل (clientId وليس id)
    if (!decoded.clientId) {
      return res.status(401).json({
        success: false,
        message: 'جلسة غير صالحة'
      });
    }

    const client = await ClientProfile.findById(decoded.clientId);

    if (!client) {
      return res.status(401).json({
        success: false,
        message: 'الحساب غير موجود'
      });
    }

    if (!client.isActive) {
      return res.status(401).json({
        success: false,
        message: 'الحساب معطل'
      });
    }

    req.client = client;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'جلسة غير صالحة، يرجى تسجيل الدخول مرة أخرى'
    });
  }
};
