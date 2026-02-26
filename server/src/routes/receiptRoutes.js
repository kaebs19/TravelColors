const express = require('express');
const router = express.Router();
const { protect, requirePermission } = require('../middlewares/auth');
const receiptController = require('../controllers/receiptController');

// حماية جميع المسارات
router.use(protect);
router.use(requirePermission('finance.receipts'));

// مسارات الإحصائيات (يجب أن تكون قبل /:id)
router.get('/stats', receiptController.getReceiptStats);

// المسارات الرئيسية
router.route('/')
  .get(receiptController.getReceipts)
  .post(receiptController.createReceipt);

// إنشاء إيصال من موعد
router.post('/from-appointment/:appointmentId', receiptController.createReceiptFromAppointment);

// مسارات الإيصال الفردي
router.route('/:id')
  .get(receiptController.getReceipt);

// تحويل إيصال إلى فاتورة
router.post('/:id/convert-to-invoice', receiptController.convertToInvoice);

// إلغاء إيصال
router.put('/:id/cancel', requirePermission('finance.cancelTransaction'), receiptController.cancelReceipt);

// طباعة إيصال
router.get('/:id/print', receiptController.getReceiptForPrint);

module.exports = router;
