const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const visaCatalogController = require('../controllers/visaCatalogController');
const { couponLimiter } = require('../middlewares/rateLimiter');

// Public routes
router.get('/', visaCatalogController.getVisas);
router.post('/validate-coupon', couponLimiter, visaCatalogController.validateVisaCoupon);

// Admin routes (protect)
router.get('/admin/all', protect, visaCatalogController.getAllVisas);
router.post('/admin', protect, visaCatalogController.createVisa);
router.put('/admin/:id', protect, visaCatalogController.updateVisa);
router.delete('/admin/:id', protect, visaCatalogController.deleteVisa);
router.put('/admin/:id/toggle', protect, visaCatalogController.toggleVisa);
router.post('/admin/upload-image', protect, upload.single('image'), visaCatalogController.uploadVisaImage);

// Public slug route (بعد admin لتفادي التداخل)
router.get('/:slug', visaCatalogController.getVisaBySlug);

module.exports = router;
