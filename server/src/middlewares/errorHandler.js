const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // طباعة الخطأ في وضع التطوير
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.message = 'المعرف غير صالح';
    error.statusCode = 400;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `القيمة المدخلة في حقل ${field} موجودة مسبقاً`;
    error.statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error.message = messages.join(', ');
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'جلسة غير صالحة';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى';
    error.statusCode = 401;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'حدث خطأ في السيرفر'
  });
};

module.exports = errorHandler;
