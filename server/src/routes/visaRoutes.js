const express = require('express');
const router = express.Router();
const visaController = require('../controllers/visaController');
const { protect } = require('../middlewares');
const upload = require('../middlewares/upload');
const { createApplicationLimiter, uploadLimiter } = require('../middlewares/rateLimiter');

// === Public Routes (للعملاء) ===
router.post('/applications', createApplicationLimiter, visaController.createApplication);
router.get('/applications/:id', visaController.getApplication);
router.put('/applications/:id', visaController.updateApplication);
router.post('/applications/:id/submit', createApplicationLimiter, visaController.submitApplication);
router.post('/upload-passport', uploadLimiter, upload.single('passport'), visaController.uploadPassport);
router.post('/upload-photo', uploadLimiter, upload.single('photo'), visaController.uploadPersonalPhoto);
router.post('/ocr-passport', uploadLimiter, upload.single('passport'), visaController.ocrPassport);

// === Admin Routes (محمية) ===
router.get('/applications', protect, visaController.getApplications);
router.put('/applications/:id/status', protect, visaController.updateStatus);
router.delete('/applications/:id', protect, visaController.deleteApplication);
router.put('/applications/:id/link-customer', protect, visaController.linkCustomer);

module.exports = router;
