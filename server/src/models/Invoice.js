const mongoose = require('mongoose');

// نموذج عنصر الفاتورة
const invoiceItemSchema = new mongoose.Schema({
  product: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  persons: {
    type: Number,
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true
  }
});

const invoiceSchema = new mongoose.Schema({
  // رقم الفاتورة
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },

  // نوع الوثيقة: فاتورة أو عرض سعر (الإيصالات الآن في نموذج منفصل)
  type: {
    type: String,
    enum: ['invoice', 'quote'],
    default: 'invoice'
  },

  // بادئة الرقم حسب النوع
  prefix: {
    type: String,
    default: 'INV'
  },

  // بيانات العميل
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    default: ''
  },
  customerAddress: {
    type: String,
    default: ''
  },
  customerCity: {
    type: String,
    default: ''
  },

  // عناصر الفاتورة
  items: [invoiceItemSchema],

  // المبالغ
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  taxRate: {
    type: Number,
    default: 0 // نسبة الضريبة
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    default: 0
  },

  // المدفوعات
  paidAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    default: 0
  },

  // طريقة الدفع
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer', 'mixed'],
    default: 'cash'
  },

  // حالة الفاتورة
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'partial', 'cancelled', 'expired'],
    default: 'draft'
  },

  // التواريخ
  issueDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  validUntil: {
    type: Date // لعروض الأسعار
  },

  // بيانات الشركة (snapshot وقت إنشاء الفاتورة)
  companyInfo: {
    name: String,
    nameEn: String,
    address: String,
    phone: String,
    email: String,
    logo: String,
    taxNumber: String
  },

  // الشروط والأحكام
  terms: {
    type: String,
    default: ''
  },

  // ملاحظات
  notes: {
    type: String,
    default: ''
  },

  // الموظف المسؤول
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // مرتبط بموعد
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },

  // === الحقول الجديدة للنظام المالي الموحد ===

  // سجل الدفعات المنفصل
  payments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvoicePayment'
  }],

  // الإيصال الأصلي (إذا تم تحويله من إيصال)
  originalReceipt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Receipt'
  },

  // بيانات الإلغاء
  cancelledAt: {
    type: Date
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: {
    type: String
  }
}, {
  timestamps: true
});

// إنشاء رقم فاتورة تلقائي
invoiceSchema.statics.generateInvoiceNumber = async function(type = 'invoice') {
  const prefixes = {
    invoice: 'INV',
    quote: 'EST'
  };
  const prefix = prefixes[type] || 'INV';

  const lastInvoice = await this.findOne({ type })
    .sort({ createdAt: -1 })
    .select('invoiceNumber');

  let nextNumber = 1;
  if (lastInvoice && lastInvoice.invoiceNumber) {
    const match = lastInvoice.invoiceNumber.match(/\d+$/);
    if (match) {
      nextNumber = parseInt(match[0]) + 1;
    }
  }

  return `${prefix}${nextNumber}`;
};

// حساب المجاميع قبل الحفظ
invoiceSchema.pre('save', function() {
  // حساب المجموع الجزئي
  this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);

  // حساب الضريبة
  this.taxAmount = (this.subtotal * this.taxRate) / 100;

  // حساب الإجمالي
  this.total = this.subtotal + this.taxAmount - this.discount;

  // حساب المتبقي
  this.remainingAmount = this.total - this.paidAmount;

  // تحديث الحالة
  if (this.paidAmount >= this.total && this.total > 0) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  }
});

// فهارس للبحث السريع
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ customer: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ type: 1 });
invoiceSchema.index({ createdAt: -1 });
invoiceSchema.index({ createdBy: 1 });
invoiceSchema.index({ originalReceipt: 1 });
invoiceSchema.index({ appointment: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
