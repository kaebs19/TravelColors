const express = require('express');
const router = express.Router();
const { protect, requirePermission } = require('../middlewares/auth');
const transactionController = require('../controllers/transactionController');

// حماية جميع المسارات
router.use(protect);
router.use(requirePermission('finance.transactions'));

// مسارات الإحصائيات (يجب أن تكون قبل /:id)
router.get('/stats/summary', transactionController.getTransactionStats);
router.get('/balance/summary', transactionController.getBalanceSummary);
router.get('/reports/daily', requirePermission('finance.reports'), transactionController.getDailyReport);

// المسارات الرئيسية
router.route('/')
  .get(transactionController.getTransactions)
  .post(transactionController.createTransaction);

router.route('/:id')
  .get(transactionController.getTransaction);

// إلغاء معاملة
router.put('/:id/cancel', requirePermission('finance.cancelTransaction'), transactionController.cancelTransaction);

module.exports = router;
