const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  addPayment,
  cancelInvoice,
  convertQuoteToInvoice,
  getInvoiceStats,
  getInvoicePayments,
  refundPayment
} = require('../controllers/invoiceController');

// حماية جميع المسارات
router.use(protect);

// إحصائيات الفواتير
router.get('/stats', getInvoiceStats);

// CRUD الفواتير
router.route('/')
  .get(getInvoices)
  .post(createInvoice);

router.route('/:id')
  .get(getInvoice)
  .put(updateInvoice)
  .delete(authorize('admin'), cancelInvoice);

// تسجيل دفعة (للموظفين والمدراء)
router.post('/:id/payment', authorize('employee', 'admin'), addPayment);

// سجل دفعات الفاتورة (للموظفين والمدراء)
router.get('/:id/payments', authorize('employee', 'admin'), getInvoicePayments);

// استرداد دفعة (للمدير فقط)
router.post('/:id/payments/:paymentId/refund', authorize('admin'), refundPayment);

// تحويل عرض سعر لفاتورة (للموظفين والمدراء)
router.post('/:id/convert', authorize('employee', 'admin'), convertQuoteToInvoice);

module.exports = router;
