const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// جلب الإعدادات - متاح لجميع المستخدمين المسجلين
router.get('/', protect, settingsController.getSettings);

// تحديث الإعدادات - للمدراء فقط
router.put('/', protect, authorize('admin'), settingsController.updateSettings);

// طرق الدفع
router.post('/payment-types', protect, authorize('admin'), settingsController.addPaymentType);
router.delete('/payment-types/:id', protect, authorize('admin'), settingsController.deletePaymentType);

// حالات المواعيد
router.post('/appointment-statuses', protect, authorize('admin'), settingsController.addAppointmentStatus);
router.delete('/appointment-statuses/:id', protect, authorize('admin'), settingsController.deleteAppointmentStatus);

// المدن
router.post('/cities', protect, authorize('admin'), settingsController.addCity);
router.delete('/cities/:id', protect, authorize('admin'), settingsController.deleteCity);

// رفع الشعار
router.post('/upload-logo', protect, authorize('admin'), upload.single('logo'), settingsController.uploadLogo);
router.delete('/logo', protect, authorize('admin'), settingsController.deleteLogo);

// Google Sheets
router.post('/google-sheets/test', protect, authorize('admin'), settingsController.testGoogleSheetsConnection);
router.post('/google-sheets/sync', protect, authorize('admin'), settingsController.syncGoogleSheets);
router.get('/google-sheets/status', protect, authorize('admin'), settingsController.getGoogleSheetsStatus);

module.exports = router;
