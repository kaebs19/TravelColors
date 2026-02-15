const mongoose = require('mongoose');

/**
 * نموذج دفعة الفاتورة
 * يتتبع كل دفعة على فاتورة بشكل منفصل
 * كل دفعة مرتبطة بمعاملة في السجل المالي
 */
const invoicePaymentSchema = new mongoose.Schema({
  // مرجع الفاتورة
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },

  // مبلغ الدفعة
  amount: {
    type: Number,
    required: true,
    min: 0
  },

  // طريقة الدفع
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer'],
    required: true,
    default: 'cash'
  },

  // المعاملة المرتبطة في السجل المالي (1:1)
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },

  // الموظف الذي سجل الدفعة
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ملاحظات
  notes: {
    type: String,
    default: ''
  },

  // هل تم استرداد هذه الدفعة؟
  isRefunded: {
    type: Boolean,
    default: false
  },

  // تاريخ الاسترداد
  refundedAt: {
    type: Date
  },

  // معاملة الاسترداد
  refundTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },

  // سبب الاسترداد
  refundReason: {
    type: String
  },

  // الموظف الذي قام بالاسترداد
  refundedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

/**
 * الحصول على مجموع الدفعات لفاتورة معينة
 */
invoicePaymentSchema.statics.getTotalPaidForInvoice = async function(invoiceId) {
  const result = await this.aggregate([
    {
      $match: {
        invoice: new mongoose.Types.ObjectId(invoiceId),
        isRefunded: false
      }
    },
    {
      $group: {
        _id: null,
        totalPaid: { $sum: '$amount' },
        paymentCount: { $sum: 1 }
      }
    }
  ]);

  if (result.length === 0) {
    return { totalPaid: 0, paymentCount: 0 };
  }

  return result[0];
};

/**
 * الحصول على آخر دفعة لفاتورة
 */
invoicePaymentSchema.statics.getLastPaymentForInvoice = async function(invoiceId) {
  return await this.findOne({ invoice: invoiceId })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name')
    .populate('transaction');
};

/**
 * الحصول على سجل الدفعات لفاتورة
 */
invoicePaymentSchema.statics.getPaymentHistory = async function(invoiceId) {
  return await this.find({ invoice: invoiceId })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name')
    .populate('transaction', 'transactionNumber')
    .populate('refundedBy', 'name')
    .populate('refundTransaction', 'transactionNumber');
};

// الفهارس
invoicePaymentSchema.index({ invoice: 1 });
invoicePaymentSchema.index({ transaction: 1 });
invoicePaymentSchema.index({ createdAt: -1 });
invoicePaymentSchema.index({ createdBy: 1 });
invoicePaymentSchema.index({ isRefunded: 1 });
// فهرس مركب للدفعات غير المستردة
invoicePaymentSchema.index({ invoice: 1, isRefunded: 1 });

module.exports = mongoose.model('InvoicePayment', invoicePaymentSchema);
