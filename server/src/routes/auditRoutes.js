const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const auditController = require('../controllers/auditController');

// حماية جميع المسارات - للمدير فقط
router.use(protect);
router.use(authorize('admin'));

// مسارات خاصة (يجب أن تكون قبل /:id)
router.get('/recent', auditController.getRecentActivity);
router.get('/stats', auditController.getAuditStats);
router.get('/search', auditController.searchAuditLogs);

// سجل كيان معين
router.get('/entity/:entityType/:entityId', auditController.getEntityLogs);

// نشاط مستخدم معين
router.get('/user/:userId', auditController.getUserActivity);

// المسار الرئيسي
router.get('/', auditController.getAuditLogs);

module.exports = router;
