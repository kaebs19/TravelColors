// تنسيق التاريخ بالعربي
exports.formatDateAr = (date) => {
  return new Date(date).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// تنسيق العملة
exports.formatCurrency = (amount, currency = 'SAR') => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency
  }).format(amount);
};

// توليد كود عشوائي
exports.generateCode = (length = 6) => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// تنظيف النص من الـ HTML
exports.sanitizeHtml = (text) => {
  return text.replace(/<[^>]*>/g, '');
};
