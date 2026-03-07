const express = require('express');
const router = express.Router();
const { clientProtect } = require('../middlewares/clientAuth');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const visaServiceController = require('../controllers/visaServiceAppController');
const { createApplicationLimiter, uploadLimiter } = require('../middlewares/rateLimiter');

// Client routes (clientProtect)
router.get('/my-applications', clientProtect, visaServiceController.getMyApplications);
router.post('/applications', clientProtect, createApplicationLimiter, visaServiceController.createApplication);
router.get('/applications/:id', clientProtect, visaServiceController.getMyApplication);
router.put('/applications/:id', clientProtect, visaServiceController.updateApplication);
router.post('/applications/:id/submit', clientProtect, visaServiceController.submitApplication);
router.post('/upload', clientProtect, uploadLimiter, upload.single('file'), visaServiceController.uploadFile);

// Admin routes (protect)
router.get('/admin/applications', protect, visaServiceController.getApplications);
router.get('/admin/applications/:id', protect, visaServiceController.getApplication);
router.put('/admin/applications/:id/status', protect, visaServiceController.updateStatus);
router.put('/admin/applications/:id/link-customer', protect, visaServiceController.linkCustomer);
router.delete('/admin/applications/:id', protect, visaServiceController.deleteApplication);

module.exports = router;
