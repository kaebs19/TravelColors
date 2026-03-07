const express = require('express');
const router = express.Router();
const { clientProtect } = require('../middlewares/clientAuth');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const licenseController = require('../controllers/licenseController');
const { createApplicationLimiter, uploadLimiter, couponLimiter } = require('../middlewares/rateLimiter');

// Client routes (clientProtect)
router.get('/my-applications', clientProtect, licenseController.getMyApplications);
router.post('/applications', clientProtect, createApplicationLimiter, licenseController.createApplication);
router.get('/applications/:id', clientProtect, licenseController.getMyApplication);
router.put('/applications/:id', clientProtect, licenseController.updateApplication);
router.post('/applications/:id/submit', clientProtect, licenseController.submitApplication);
router.post('/upload', clientProtect, uploadLimiter, upload.single('file'), licenseController.uploadFile);

// التحقق من كوبون الخصم
router.post('/validate-coupon', clientProtect, couponLimiter, licenseController.validateCoupon);

// قراءة بيانات الجواز بالـ OCR
router.post('/ocr-passport', clientProtect, uploadLimiter, upload.single('file'), licenseController.ocrPassport);

// Admin routes (protect)
router.get('/admin/applications', protect, licenseController.getApplications);
router.get('/admin/applications/:id', protect, licenseController.getApplication);
router.put('/admin/applications/:id/status', protect, licenseController.updateStatus);
router.put('/admin/applications/:id/link-customer', protect, licenseController.linkCustomer);

module.exports = router;
