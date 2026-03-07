import React from 'react';

/**
 * مكون مشترك لإدارة كوبونات الخصم
 * يُستخدم في: تاب الرخصة الدولية + تاب كتالوج التأشيرات
 *
 * Props:
 *  - coupons: Array — قائمة الكوبونات الحالية
 *  - onUpdate: Function(updatedCoupons) — callback عند التحديث
 *  - currency: String — العملة (ريال)
 */
const CouponManager = ({ coupons = [], onUpdate, currency = 'ريال' }) => {

  const handleAdd = () => {
    const updated = [...coupons, {
      code: '', discountType: 'percentage', discountValue: '0',
      enabled: true, maxUses: 0, usedCount: 0, expiresAt: ''
    }];
    onUpdate(updated);
  };

  const handleChange = (index, field, value) => {
    const updated = [...coupons];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate(updated);
  };

  const handleRemove = (index) => {
    const updated = [...coupons];
    updated.splice(index, 1);
    onUpdate(updated);
  };

  return (
    <div className="wm-coupons-section">
      <div className="wm-section-header">
        <h4>🎫 كوبونات الخصم</h4>
        <button className="wm-btn-add" onClick={handleAdd}>
          + إضافة كوبون
        </button>
      </div>
      <p className="wm-section-desc">كوبونات خصم يمكن للعميل استخدامها عند التقديم — الخصم بنسبة مئوية أو مبلغ ثابت</p>

      {coupons.length === 0 ? (
        <p className="wm-empty-hint">لا توجد كوبونات — اضغط "إضافة كوبون" لإنشاء واحد</p>
      ) : (
        coupons.map((coupon, i) => (
          <div className="wm-coupon-item" key={i}>
            <div className="wm-addon-item-header">
              <label className="wm-addon-toggle">
                <input
                  type="checkbox"
                  checked={coupon.enabled !== false}
                  onChange={e => handleChange(i, 'enabled', e.target.checked)}
                />
                <span>{coupon.enabled !== false ? 'مفعّل' : 'معطّل'}</span>
              </label>
              <div className="wm-coupon-usage">
                استخدام: {coupon.usedCount || 0}{coupon.maxUses > 0 ? ` / ${coupon.maxUses}` : ' (غير محدود)'}
              </div>
              <button className="wm-btn-remove" onClick={() => handleRemove(i)}>حذف</button>
            </div>
            <div className="wm-form-row">
              <div className="wm-form-group" style={{ flex: 2 }}>
                <label>كود الكوبون</label>
                <input
                  type="text"
                  value={coupon.code ?? ''}
                  onChange={e => handleChange(i, 'code', e.target.value.toUpperCase())}
                  dir="ltr"
                  placeholder="مثال: SAVE20"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              <div className="wm-form-group" style={{ flex: 1 }}>
                <label>نوع الخصم</label>
                <select
                  value={coupon.discountType || 'percentage'}
                  onChange={e => handleChange(i, 'discountType', e.target.value)}
                >
                  <option value="percentage">نسبة مئوية (%)</option>
                  <option value="fixed">مبلغ ثابت ({currency})</option>
                </select>
              </div>
              <div className="wm-form-group" style={{ flex: 1 }}>
                <label>قيمة الخصم</label>
                <input
                  type="text"
                  value={coupon.discountValue ?? '0'}
                  onChange={e => handleChange(i, 'discountValue', e.target.value)}
                  dir="ltr"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="wm-form-row">
              <div className="wm-form-group">
                <label>الحد الأقصى للاستخدام (0 = غير محدود)</label>
                <input
                  type="number"
                  value={coupon.maxUses ?? 0}
                  onChange={e => handleChange(i, 'maxUses', parseInt(e.target.value) || 0)}
                  min="0"
                  dir="ltr"
                />
              </div>
              <div className="wm-form-group">
                <label>تاريخ الانتهاء (اختياري)</label>
                <input
                  type="date"
                  value={coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 10) : ''}
                  onChange={e => handleChange(i, 'expiresAt', e.target.value || null)}
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CouponManager;
