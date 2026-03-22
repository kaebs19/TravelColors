const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, requirePermission } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// إعدادات التأشيرة الأمريكية - عام بدون auth
router.get('/us-visa-public', settingsController.getUsVisaPublicSettings);

// جلب الإعدادات - متاح لجميع المستخدمين المسجلين مع صلاحية العرض
router.get('/', protect, requirePermission('settings.view'), settingsController.getSettings);

// تحديث الإعدادات
router.put('/', protect, requirePermission('settings.edit'), settingsController.updateSettings);

// طرق الدفع
router.post('/payment-types', protect, requirePermission('settings.edit'), settingsController.addPaymentType);
router.delete('/payment-types/:id', protect, requirePermission('settings.edit'), settingsController.deletePaymentType);

// حالات المواعيد
router.post('/appointment-statuses', protect, requirePermission('settings.edit'), settingsController.addAppointmentStatus);
router.delete('/appointment-statuses/:id', protect, requirePermission('settings.edit'), settingsController.deleteAppointmentStatus);

// المدن
router.post('/cities', protect, requirePermission('settings.edit'), settingsController.addCity);
router.delete('/cities/:id', protect, requirePermission('settings.edit'), settingsController.deleteCity);

// رفع الشعار
router.post('/upload-logo', protect, requirePermission('settings.edit'), upload.single('logo'), settingsController.uploadLogo);
router.delete('/logo', protect, requirePermission('settings.edit'), settingsController.deleteLogo);

// Google Sheets
router.post('/google-sheets/test', protect, requirePermission('settings.edit'), settingsController.testGoogleSheetsConnection);
router.post('/google-sheets/sync', protect, requirePermission('settings.edit'), settingsController.syncGoogleSheets);
router.get('/google-sheets/status', protect, requirePermission('settings.view'), settingsController.getGoogleSheetsStatus);

module.exports = router;
