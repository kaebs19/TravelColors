/**
 * أدوات مساعدة للـ API Responses
 * توحيد تنسيق الاستجابات عبر جميع الـ Controllers
 */

/**
 * إرسال استجابة نجاح
 * @param {Object} res - Express response object
 * @param {Object} data - البيانات المراد إرسالها
 * @param {string} message - رسالة النجاح (اختياري)
 * @param {number} statusCode - كود الحالة (default: 200)
 */
const sendSuccess = (res, data = {}, message = '', statusCode = 200) => {
  const response = { success: true };
  if (message) response.message = message;

  return res.status(statusCode).json({ ...response, ...data });
};

/**
 * إرسال استجابة خطأ
 * @param {Object} res - Express response object
 * @param {string} message - رسالة الخطأ
 * @param {number} statusCode - كود الحالة (default: 400)
 */
const sendError = (res, message = 'حدث خطأ', statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

/**
 * إرسال استجابة 404 - غير موجود
 * @param {Object} res - Express response object
 * @param {string} resourceName - اسم المورد
 */
const sendNotFound = (res, resourceName = 'البيان') => {
  return res.status(404).json({
    success: false,
    message: `${resourceName} غير موجود`
  });
};

/**
 * إرسال استجابة 403 - غير مصرح
 * @param {Object} res - Express response object
 * @param {string} message - رسالة عدم الصلاحية
 */
const sendUnauthorized = (res, message = 'غير مصرح لك بالوصول') => {
  return res.status(403).json({
    success: false,
    message
  });
};

/**
 * إرسال استجابة 401 - غير مسجل الدخول
 * @param {Object} res - Express response object
 * @param {string} message - رسالة
 */
const sendUnauthenticated = (res, message = 'يرجى تسجيل الدخول') => {
  return res.status(401).json({
    success: false,
    message
  });
};

/**
 * إرسال استجابة خطأ في التحقق
 * @param {Object} res - Express response object
 * @param {string} message - رسالة الخطأ
 */
const sendValidationError = (res, message = 'يرجى تقديم جميع البيانات المطلوبة') => {
  return res.status(400).json({
    success: false,
    message
  });
};

/**
 * إرسال استجابة إنشاء ناجح
 * @param {Object} res - Express response object
 * @param {Object} data - البيانات المُنشأة
 * @param {string} message - رسالة النجاح
 */
const sendCreated = (res, data = {}, message = 'تم الإنشاء بنجاح') => {
  return sendSuccess(res, data, message, 201);
};

/**
 * التحقق من وجود المورد وإرجاع 404 إذا غير موجود
 * @param {Object} res - Express response object
 * @param {any} resource - المورد المراد التحقق منه
 * @param {string} resourceName - اسم المورد
 * @returns {boolean} - true إذا موجود، false إذا غير موجود (وتم إرسال 404)
 */
const checkExists = (res, resource, resourceName = 'البيان') => {
  if (!resource) {
    sendNotFound(res, resourceName);
    return false;
  }
  return true;
};

/**
 * التحقق من الحقول المطلوبة
 * @param {Object} res - Express response object
 * @param {Object} data - البيانات المراد التحقق منها
 * @param {Array<string>} requiredFields - الحقول المطلوبة
 * @returns {boolean} - true إذا كل الحقول موجودة، false إذا ناقصة
 */
const checkRequired = (res, data, requiredFields) => {
  const missing = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    sendValidationError(res, `يرجى تقديم: ${missing.join(', ')}`);
    return false;
  }
  return true;
};

module.exports = {
  sendSuccess,
  sendError,
  sendNotFound,
  sendUnauthorized,
  sendUnauthenticated,
  sendValidationError,
  sendCreated,
  checkExists,
  checkRequired
};
