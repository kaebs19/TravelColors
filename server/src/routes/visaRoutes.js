const express = require('express');
const router = express.Router();
const visaController = require('../controllers/visaController');
const { protect } = require('../middlewares');
const { clientProtect } = require('../middlewares/clientAuth');
const upload = require('../middlewares/upload');
const { uploadLimiter } = require('../middlewares/rateLimiter');

// === Client Routes (رفع الملفات و OCR — تتطلب تسجيل دخول العميل) ===
// ملاحظة: إنشاء/تعديل/تقديم الطلبات يتم عبر /api/client/applications (clientAppController)
router.post('/upload-passport', clientProtect, uploadLimiter, upload.single('passport'), visaController.uploadPassport);
router.post('/upload-photo', clientProtect, uploadLimiter, upload.single('photo'), visaController.uploadPersonalPhoto);
router.post('/ocr-passport', clientProtect, uploadLimiter, upload.single('passport'), visaController.ocrPassport);

// === Admin Routes (محمية) ===
router.get('/applications', protect, visaController.getApplications);
router.put('/applications/:id/status', protect, visaController.updateStatus);
router.delete('/applications/:id', protect, visaController.deleteApplication);
router.put('/applications/:id/link-customer', protect, visaController.linkCustomer);

module.exports = router;
