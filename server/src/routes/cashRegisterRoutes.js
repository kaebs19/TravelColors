const express = require('express');
const router = express.Router();
const { protect, requirePermission } = require('../middlewares/auth');
const {
  getCashRegister,
  getTransactions,
  addTransaction,
  getCashReport,
  getTodaySummary
} = require('../controllers/cashRegisterController');

// حماية جميع المسارات
router.use(protect);
router.use(requirePermission('finance.cashRegister'));

// بيانات الصندوق
router.get('/', getCashRegister);

// ملخص اليوم
router.get('/today', getTodaySummary);

// الحركات المالية
router.get('/transactions', getTransactions);

// إضافة حركة مالية
router.post('/transaction', addTransaction);

// تقرير الصندوق
router.get('/report', requirePermission('finance.reports'), getCashReport);

module.exports = router;
