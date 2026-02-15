const { body } = require('express-validator');

exports.createTripValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('عنوان الرحلة مطلوب')
    .isLength({ max: 100 }).withMessage('العنوان يجب أن لا يتجاوز 100 حرف'),

  body('description')
    .trim()
    .notEmpty().withMessage('وصف الرحلة مطلوب'),

  body('destination')
    .trim()
    .notEmpty().withMessage('الوجهة مطلوبة'),

  body('origin')
    .trim()
    .notEmpty().withMessage('نقطة الانطلاق مطلوبة'),

  body('price')
    .notEmpty().withMessage('السعر مطلوب')
    .isNumeric().withMessage('السعر يجب أن يكون رقم')
    .custom(val => val >= 0).withMessage('السعر يجب أن يكون موجب'),

  body('startDate')
    .notEmpty().withMessage('تاريخ البداية مطلوب')
    .isISO8601().withMessage('تاريخ البداية غير صالح'),

  body('endDate')
    .notEmpty().withMessage('تاريخ النهاية مطلوب')
    .isISO8601().withMessage('تاريخ النهاية غير صالح'),

  body('totalSeats')
    .notEmpty().withMessage('عدد المقاعد مطلوب')
    .isInt({ min: 1 }).withMessage('عدد المقاعد يجب أن يكون 1 على الأقل'),

  body('category')
    .optional()
    .isIn(['domestic', 'international', 'hajj', 'umrah', 'honeymoon', 'family', 'adventure', 'business'])
    .withMessage('تصنيف غير صالح')
];

exports.updateTripValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('العنوان يجب أن لا يتجاوز 100 حرف'),

  body('price')
    .optional()
    .isNumeric().withMessage('السعر يجب أن يكون رقم')
    .custom(val => val >= 0).withMessage('السعر يجب أن يكون موجب'),

  body('startDate')
    .optional()
    .isISO8601().withMessage('تاريخ البداية غير صالح'),

  body('endDate')
    .optional()
    .isISO8601().withMessage('تاريخ النهاية غير صالح')
];
