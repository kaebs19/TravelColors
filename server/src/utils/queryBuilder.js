/**
 * أدوات بناء الـ Queries
 * توحيد منطق البحث والفلترة عبر جميع الـ Controllers
 */

/**
 * Escape للأحرف الخاصة في RegExp لمنع RegExp Injection
 * @param {string} string - النص المراد تأمينه
 * @returns {string}
 */
const escapeRegExp = (string) => {
  if (!string || typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * بناء query البحث
 * @param {Array<string>} fields - الحقول المراد البحث فيها
 * @param {string} searchTerm - نص البحث
 * @param {boolean} escaped - هل يتم escape للنص (default: true للأمان)
 * @returns {Object} - MongoDB query object
 */
const buildSearchQuery = (fields, searchTerm, escaped = true) => {
  if (!searchTerm || !fields || fields.length === 0) return {};

  const term = escaped ? escapeRegExp(searchTerm) : searchTerm;

  return {
    $or: fields.map(field => ({ [field]: { $regex: term, $options: 'i' } }))
  };
};

/**
 * بناء query نطاق التاريخ
 * @param {string|Date} startDate - تاريخ البداية
 * @param {string|Date} endDate - تاريخ النهاية
 * @param {string} field - اسم حقل التاريخ (default: createdAt)
 * @returns {Object} - MongoDB query object
 */
const buildDateRangeQuery = (startDate, endDate, field = 'createdAt') => {
  if (!startDate && !endDate) return {};

  const query = {};
  query[field] = {};

  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    query[field].$gte = start;
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query[field].$lte = end;
  }

  return query;
};

/**
 * بناء query الحالة
 * @param {string} status - الحالة المطلوبة
 * @param {string} field - اسم حقل الحالة (default: status)
 * @returns {Object} - MongoDB query object
 */
const buildStatusQuery = (status, field = 'status') => {
  if (!status || status === 'all') return {};
  return { [field]: status };
};

/**
 * دمج عدة queries معاً
 * @param {...Object} queries - الـ queries المراد دمجها
 * @returns {Object} - MongoDB query object
 */
const mergeQueries = (...queries) => {
  return queries.reduce((acc, query) => {
    if (!query || Object.keys(query).length === 0) return acc;
    return { ...acc, ...query };
  }, {});
};

/**
 * بناء query كامل مع البحث والفلترة
 * @param {Object} options - خيارات البحث
 * @param {string} options.search - نص البحث
 * @param {Array<string>} options.searchFields - حقول البحث
 * @param {string} options.startDate - تاريخ البداية
 * @param {string} options.endDate - تاريخ النهاية
 * @param {string} options.dateField - حقل التاريخ
 * @param {string} options.status - الحالة
 * @param {string} options.statusField - حقل الحالة
 * @param {Object} options.additionalFilters - فلاتر إضافية
 * @returns {Object} - MongoDB query object
 */
const buildFullQuery = (options = {}) => {
  const {
    search,
    searchFields = [],
    startDate,
    endDate,
    dateField = 'createdAt',
    status,
    statusField = 'status',
    additionalFilters = {}
  } = options;

  return mergeQueries(
    buildSearchQuery(searchFields, search),
    buildDateRangeQuery(startDate, endDate, dateField),
    buildStatusQuery(status, statusField),
    additionalFilters
  );
};

module.exports = {
  escapeRegExp,
  buildSearchQuery,
  buildDateRangeQuery,
  buildStatusQuery,
  mergeQueries,
  buildFullQuery
};
