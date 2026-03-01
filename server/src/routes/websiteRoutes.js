const express = require('express');
const router = express.Router();
const websiteController = require('../controllers/websiteController');
const { protect, requirePermission } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// محتوى الموقع العام - بدون auth
router.get('/public', websiteController.getPublicContent);

// محتوى الموقع - للإدارة
router.get('/', protect, requirePermission('settings.view'), websiteController.getContent);

// تحديث المحتوى
router.put('/', protect, requirePermission('settings.edit'), websiteController.updateContent);

// رفع صورة
router.post('/upload', protect, requirePermission('settings.edit'), upload.single('image'), websiteController.uploadImage);

// حذف صورة
router.delete('/image', protect, requirePermission('settings.edit'), websiteController.deleteImage);

module.exports = router;
