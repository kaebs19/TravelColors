const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getCashRegister,
  getTransactions,
  addTransaction,
  getCashReport,
  getTodaySummary
} = require('../controllers/cashRegisterController');

// حماية جميع المسارات
router.use(protect);

// بيانات الصندوق
router.get('/', getCashRegister);

// ملخص اليوم
router.get('/today', getTodaySummary);

// الحركات المالية
router.get('/transactions', getTransactions);

// إضافة حركة مالية
router.post('/transaction', addTransaction);

// تقرير الصندوق (للمدير فقط)
router.get('/report', authorize('admin'), getCashReport);

module.exports = router;
