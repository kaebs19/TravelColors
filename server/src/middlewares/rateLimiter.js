const rateLimit = require('express-rate-limit');

// حماية عامة — 300 طلب لكل IP كل 15 دقيقة (يتم تجاوزها للمستخدمين المسجلين)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // إعفاء المستخدمين المسجلين
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) return true;
    // إعفاء طلبات القراءة العامة (التأشيرات + محتوى الموقع)
    if (req.method === 'GET' && (
      req.path === '/visa-catalog' ||
      req.path === '/website/public' ||
      req.path.startsWith('/visa-catalog/')
    )) return true;
    return false;
  },
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة بعد قليل.'
  }
});

// حماية صارمة لتسجيل الدخول — 10 محاولات لكل IP كل 15 دقيقة
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'محاولات تسجيل دخول كثيرة. يرجى المحاولة بعد 15 دقيقة.'
  }
});

// حماية رفع الملفات — 20 رفع لكل IP كل 15 دقيقة
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح لرفع الملفات. يرجى المحاولة بعد قليل.'
  }
});

// حماية إنشاء الطلبات — 15 طلب لكل IP كل 15 دقيقة
const createApplicationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح لإنشاء الطلبات. يرجى المحاولة بعد قليل.'
  }
});

// حماية التحقق من الكوبون — 15 محاولة لكل IP كل 15 دقيقة
const couponLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'محاولات كثيرة للتحقق من الكوبون. يرجى المحاولة بعد قليل.'
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  createApplicationLimiter,
  couponLimiter
};
