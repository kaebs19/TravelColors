/**
 * أدوات مساعدة للصلاحيات والتحقق من الملكية
 * توحيد منطق الصلاحيات عبر جميع الـ Controllers
 */

const { sendUnauthorized } = require('./responseHelper');

/**
 * التحقق من ملكية المورد
 * @param {Object} user - المستخدم الحالي
 * @param {Object} resource - المورد المراد التحقق منه
 * @param {string} ownerField - اسم حقل المالك (default: createdBy)
 * @returns {boolean}
 */
const checkResourceOwnership = (user, resource, ownerField = 'createdBy') => {
  // Admin لديه صلاحية كاملة
  if (user.role === 'admin') return true;

  // التحقق من الملكية
  const ownerId = resource[ownerField]?.toString?.() || resource[ownerField];
  const userId = user.id?.toString?.() || user._id?.toString?.() || user.id;

  return ownerId === userId;
};

/**
 * التحقق من دور المستخدم
 * @param {Object} user - المستخدم الحالي
 * @param {Array<string>} allowedRoles - الأدوار المسموحة
 * @returns {boolean}
 */
const checkRole = (user, allowedRoles) => {
  if (!user || !user.role) return false;
  return allowedRoles.includes(user.role);
};

/**
 * التحقق من الصلاحية وإرجاع 403 إذا غير مصرح
 * @param {Object} res - Express response object
 * @param {Object} user - المستخدم الحالي
 * @param {Object} resource - المورد
 * @param {string} ownerField - حقل المالك
 * @returns {boolean} - true إذا مصرح، false إذا غير مصرح (وتم إرسال 403)
 */
const checkAuthorization = (res, user, resource, ownerField = 'createdBy') => {
  if (!checkResourceOwnership(user, resource, ownerField)) {
    sendUnauthorized(res);
    return false;
  }
  return true;
};

/**
 * التحقق من صلاحية الدور وإرجاع 403 إذا غير مصرح
 * @param {Object} res - Express response object
 * @param {Object} user - المستخدم الحالي
 * @param {Array<string>} allowedRoles - الأدوار المسموحة
 * @param {string} message - رسالة الخطأ (اختياري)
 * @returns {boolean}
 */
const checkRoleAuthorization = (res, user, allowedRoles, message = 'غير مصرح لك بتنفيذ هذا الإجراء') => {
  if (!checkRole(user, allowedRoles)) {
    sendUnauthorized(res, message);
    return false;
  }
  return true;
};

/**
 * التحقق من أن المستخدم يمكنه التعديل على المورد
 * (إما مالك أو admin)
 * @param {Object} res - Express response object
 * @param {Object} user - المستخدم الحالي
 * @param {Object} resource - المورد
 * @param {string} ownerField - حقل المالك
 * @returns {boolean}
 */
const canModifyResource = (res, user, resource, ownerField = 'createdBy') => {
  // Admin يمكنه التعديل على أي مورد
  if (user.role === 'admin') return true;

  // التحقق من الملكية للـ employee
  if (user.role === 'employee') {
    return checkAuthorization(res, user, resource, ownerField);
  }

  // أي دور آخر غير مصرح
  sendUnauthorized(res);
  return false;
};

/**
 * التحقق من صلاحية إضافة نوع معين من المعاملات
 * @param {Object} res - Express response object
 * @param {Object} user - المستخدم الحالي
 * @param {string} transactionType - نوع المعاملة (income/expense)
 * @returns {boolean}
 */
const canAddTransactionType = (res, user, transactionType) => {
  // Admin يمكنه إضافة أي نوع
  if (user.role === 'admin') return true;

  // Employee لا يمكنه إضافة مصروفات
  if (user.role === 'employee' && transactionType === 'expense') {
    sendUnauthorized(res, 'غير مصرح لك بإضافة مصروفات');
    return false;
  }

  return true;
};

module.exports = {
  checkResourceOwnership,
  checkRole,
  checkAuthorization,
  checkRoleAuthorization,
  canModifyResource,
  canAddTransactionType
};
