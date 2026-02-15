const mongoose = require('mongoose');

// نموذج الحركة المالية
const transactionSchema = new mongoose.Schema({
  // نوع الحركة
  type: {
    type: String,
    enum: ['income', 'expense', 'transfer'],
    required: true
  },

  // المبلغ
  amount: {
    type: Number,
    required: true,
    min: 0
  },

  // الوصف
  description: {
    type: String,
    required: true
  },

  // التصنيف
  category: {
    type: String,
    enum: [
      'invoice_payment',      // دفعة فاتورة
      'appointment_payment',  // دفعة موعد
      'deposit',              // إيداع
      'withdrawal',           // سحب
      'refund',               // استرداد
      'expense',              // مصروف
      'salary',               // راتب
      'commission',           // عمولة
      'other'                 // أخرى
    ],
    default: 'other'
  },

  // طريقة الدفع
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer'],
    default: 'cash'
  },

  // مرجع الفاتورة (إن وجد)
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },

  // مرجع الموعد (إن وجد)
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },

  // مرجع العميل
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },

  // الموظف الذي أدخل الحركة
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // الرصيد بعد الحركة
  balanceAfter: {
    type: Number,
    default: 0
  },

  // ملاحظات
  notes: {
    type: String,
    default: ''
  },

  // تاريخ الحركة
  transactionDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// نموذج الصندوق
const cashRegisterSchema = new mongoose.Schema({
  // اسم الصندوق
  name: {
    type: String,
    required: true,
    default: 'الصندوق الرئيسي'
  },

  // الرصيد الحالي
  currentBalance: {
    type: Number,
    default: 0
  },

  // رصيد النقدي
  cashBalance: {
    type: Number,
    default: 0
  },

  // رصيد الشبكة/البطاقات
  cardBalance: {
    type: Number,
    default: 0
  },

  // رصيد التحويلات
  transferBalance: {
    type: Number,
    default: 0
  },

  // الحركات المالية
  transactions: [transactionSchema],

  // حالة الصندوق
  isOpen: {
    type: Boolean,
    default: true
  },

  // آخر فتح للصندوق
  lastOpenedAt: {
    type: Date,
    default: Date.now
  },

  // آخر إغلاق للصندوق
  lastClosedAt: {
    type: Date
  },

  // الموظف المسؤول
  managedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// إضافة حركة مالية
cashRegisterSchema.methods.addTransaction = async function(transactionData) {
  const { type, amount, paymentMethod = 'cash' } = transactionData;

  // تحديث الأرصدة حسب نوع الحركة
  if (type === 'income') {
    this.currentBalance += amount;
    if (paymentMethod === 'cash') this.cashBalance += amount;
    else if (paymentMethod === 'card') this.cardBalance += amount;
    else if (paymentMethod === 'transfer') this.transferBalance += amount;
  } else if (type === 'expense') {
    this.currentBalance -= amount;
    if (paymentMethod === 'cash') this.cashBalance -= amount;
    else if (paymentMethod === 'card') this.cardBalance -= amount;
    else if (paymentMethod === 'transfer') this.transferBalance -= amount;
  }

  // إضافة الرصيد بعد الحركة
  transactionData.balanceAfter = this.currentBalance;

  this.transactions.push(transactionData);
  await this.save();

  return this.transactions[this.transactions.length - 1];
};

// الحصول على الصندوق أو إنشاؤه
cashRegisterSchema.statics.getOrCreate = async function() {
  let register = await this.findOne({ name: 'الصندوق الرئيسي' });

  if (!register) {
    register = await this.create({
      name: 'الصندوق الرئيسي',
      currentBalance: 0,
      cashBalance: 0,
      cardBalance: 0,
      transferBalance: 0
    });
  }

  return register;
};

// إحصائيات الصندوق
cashRegisterSchema.methods.getStats = function(startDate, endDate) {
  const filteredTransactions = this.transactions.filter(t => {
    const date = new Date(t.transactionDate);
    return date >= startDate && date <= endDate;
  });

  const income = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalIncome: income,
    totalExpense: expense,
    netAmount: income - expense,
    transactionCount: filteredTransactions.length
  };
};

// فهارس
transactionSchema.index({ transactionDate: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ createdBy: 1 });

module.exports = mongoose.model('CashRegister', cashRegisterSchema);
