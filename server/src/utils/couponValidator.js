/**
 * أداة مشتركة للتحقق من صلاحية كوبون الخصم
 * تُستخدم في: الرخصة الدولية، كتالوج التأشيرات
 */

/**
 * التحقق من كوبون خصم ضمن قائمة كوبونات
 * @param {Array} coupons - قائمة الكوبونات
 * @param {String} code - كود الكوبون المُدخل
 * @returns {Object} { valid, coupon, message }
 */
exports.validateCoupon = (coupons, code) => {
  if (!code || !code.trim()) {
    return { valid: false, message: 'يرجى إدخال كود الكوبون' };
  }

  if (!coupons || !Array.isArray(coupons) || coupons.length === 0) {
    return { valid: false, message: 'كود الكوبون غير صالح' };
  }

  const coupon = coupons.find(c =>
    c.code.toLowerCase() === code.trim().toLowerCase() && c.enabled
  );

  if (!coupon) {
    return { valid: false, message: 'كود الكوبون غير صالح' };
  }

  // فحص تاريخ الانتهاء
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, message: 'كود الكوبون منتهي الصلاحية' };
  }

  // فحص عدد الاستخدامات
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, message: 'تم استخدام هذا الكوبون الحد الأقصى من المرات' };
  }

  return {
    valid: true,
    message: 'كود الكوبون صالح',
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    }
  };
};
