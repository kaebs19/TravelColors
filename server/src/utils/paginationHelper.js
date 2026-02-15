/**
 * أدوات مساعدة للـ Pagination
 * توحيد منطق التقسيم إلى صفحات عبر جميع الـ Controllers
 */

/**
 * حساب قيم الـ Pagination
 * @param {number|string} page - رقم الصفحة (يبدأ من 1)
 * @param {number|string} limit - عدد العناصر في الصفحة
 * @returns {Object} - { page, limit, skip }
 */
const calculatePagination = (page = 1, limit = 50) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
  const skip = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    skip
  };
};

/**
 * تنسيق استجابة الـ Pagination
 * @param {Array} items - العناصر
 * @param {number} total - إجمالي العناصر
 * @param {number} page - رقم الصفحة
 * @param {number} limit - عدد العناصر في الصفحة
 * @param {string} itemsKey - اسم مفتاح العناصر (مثل: customers, appointments)
 * @returns {Object}
 */
const formatPaginatedResponse = (items, total, page, limit, itemsKey = 'items') => {
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    [itemsKey]: items,
    data: {
      [itemsKey]: items,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  };
};

/**
 * تطبيق الـ Pagination على query
 * @param {Object} query - Mongoose query
 * @param {Object} paginationOptions - { page, limit }
 * @param {string} sortBy - الحقل للترتيب (default: -createdAt)
 * @returns {Object} - Modified query
 */
const applyPagination = (query, paginationOptions, sortBy = '-createdAt') => {
  const { skip, limit } = calculatePagination(
    paginationOptions.page,
    paginationOptions.limit
  );

  return query.sort(sortBy).skip(skip).limit(limit);
};

module.exports = {
  calculatePagination,
  formatPaginatedResponse,
  applyPagination
};
