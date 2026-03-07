/**
 * أداة مشتركة لتوليد أرقام طلبات فريدة
 * VA- للتأشيرة الأمريكية، DL- للرخصة، VS- لخدمة التأشيرة الإلكترونية
 */

/**
 * توليد رقم طلب فريد
 * @param {String} prefix - البادئة (مثل 'VS', 'DL', 'VA')
 * @returns {String} رقم الطلب (مثل VS-20260303-4821)
 */
exports.generate = (prefix = 'APP') => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${rand}`;
};
