const express = require('express');
const router = express.Router();
const { protect, requirePermission } = require('../middlewares/auth');
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
router.use(requirePermission('finance.invoices'));

// إحصائيات الفواتير
router.get('/stats', getInvoiceStats);

// CRUD الفواتير
router.route('/')
  .get(getInvoices)
  .post(createInvoice);

router.route('/:id')
  .get(getInvoice)
  .put(updateInvoice)
  .delete(requirePermission('finance.cancelTransaction'), cancelInvoice);

// تسجيل دفعة
router.post('/:id/payment', addPayment);

// سجل دفعات الفاتورة
router.get('/:id/payments', getInvoicePayments);

// استرداد دفعة
router.post('/:id/payments/:paymentId/refund', requirePermission('finance.cancelTransaction'), refundPayment);

// تحويل عرض سعر لفاتورة
router.post('/:id/convert', convertQuoteToInvoice);

module.exports = router;
