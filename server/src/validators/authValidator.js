const { body } = require('express-validator');

exports.registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('الاسم مطلوب')
    .isLength({ min: 2, max: 50 }).withMessage('الاسم يجب أن يكون بين 2 و 50 حرف'),

  body('email')
    .trim()
    .notEmpty().withMessage('البريد الإلكتروني مطلوب')
    .isEmail().withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s]+$/).withMessage('رقم الهاتف غير صالح')
];

exports.loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('البريد الإلكتروني مطلوب')
    .isEmail().withMessage('البريد الإلكتروني غير صالح'),

  body('password')
    .notEmpty().withMessage('كلمة المرور مطلوبة')
];

exports.changePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('كلمة المرور الحالية مطلوبة'),

  body('newPassword')
    .notEmpty().withMessage('كلمة المرور الجديدة مطلوبة')
    .isLength({ min: 6 }).withMessage('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل')
];
