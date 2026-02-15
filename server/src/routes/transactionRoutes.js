const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const transactionController = require('../controllers/transactionController');

// حماية جميع المسارات
router.use(protect);

// مسارات الإحصائيات (يجب أن تكون قبل /:id)
router.get('/stats/summary', transactionController.getTransactionStats);
router.get('/balance/summary', transactionController.getBalanceSummary);
router.get('/reports/daily', authorize('admin'), transactionController.getDailyReport);

// المسارات الرئيسية
router.route('/')
  .get(transactionController.getTransactions)
  .post(transactionController.createTransaction);

router.route('/:id')
  .get(transactionController.getTransaction);

// إلغاء معاملة (للمدير فقط)
router.put('/:id/cancel', authorize('admin'), transactionController.cancelTransaction);

module.exports = router;
