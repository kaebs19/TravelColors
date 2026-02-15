const mongoose = require('mongoose');

/**
 * نموذج المعاملة المالية (السجل المالي الموحد)
 * كل عملية مالية في النظام تنشئ سجل هنا
 */
const transactionSchema = new mongoose.Schema({
  // رقم المعاملة التلقائي: TRX-YYYYMMDD-XXX
  transactionNumber: {
    type: String,
    required: true,
    unique: true
  },

  // نوع المعاملة
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },

  // المبلغ (دائماً موجب، النوع يحدد الاتجاه)
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
      'appointment_payment',  // دفعة موعد
      'invoice_payment',      // دفعة فاتورة
      'expense',              // مصروف عام
      'salary',               // راتب
      'commission',           // عمولة
      'refund',               // استرداد
      'deposit',              // إيداع
      'withdrawal',           // سحب
      'other'                 // أخرى
    ],
    default: 'other'
  },

  // طريقة الدفع
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer'],
    required: true,
    default: 'cash'
  },

  // مصدر المعاملة (تلقائي أو يدوي)
  source: {
    type: String,
    enum: ['automatic', 'manual'],
    default: 'manual'
  },

  // نوع المصدر (إيصال، فاتورة، يدوي)
  sourceType: {
    type: String,
    enum: ['receipt', 'invoice', 'manual', null],
    default: null
  },

  // معرف المصدر
  sourceId: {
    type: mongoose.Schema.Types.ObjectId
  },

  // مرجع الإيصال (إن وجد)
  receipt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Receipt'
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

  // الرصيد قبل المعاملة
  balanceBefore: {
    type: Number,
    required: true,
    default: 0
  },

  // الرصيد بعد المعاملة
  balanceAfter: {
    type: Number,
    required: true,
    default: 0
  },

  // الموظف الذي أنشأ المعاملة
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

  // حالة المعاملة
  isActive: {
    type: Boolean,
    default: true
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

/**
 * توليد رقم المعاملة التلقائي
 * الصيغة: TRX-YYYYMMDD-XXX
 */
transactionSchema.statics.generateTransactionNumber = async function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // البحث عن آخر معاملة في نفس اليوم
  const lastTransaction = await this.findOne({
    transactionNumber: new RegExp(`^TRX-${dateStr}`)
  }).sort({ transactionNumber: -1 });

  let sequence = 1;
  if (lastTransaction) {
    const parts = lastTransaction.transactionNumber.split('-');
    if (parts.length === 3) {
      sequence = parseInt(parts[2]) + 1;
    }
  }

  return `TRX-${dateStr}-${sequence.toString().padStart(3, '0')}`;
};

/**
 * الحصول على إحصائيات المعاملات
 */
transactionSchema.statics.getStats = async function(startDate, endDate, userId = null) {
  const match = {
    isActive: true,
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };

  if (userId) {
    match.createdBy = new mongoose.Types.ObjectId(userId);
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
        },
        totalExpense: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
        },
        transactionCount: { $sum: 1 },
        incomeCount: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, 1, 0] }
        },
        expenseCount: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, 1, 0] }
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalIncome: 0,
      totalExpense: 0,
      netAmount: 0,
      transactionCount: 0,
      incomeCount: 0,
      expenseCount: 0
    };
  }

  return {
    ...stats[0],
    netAmount: stats[0].totalIncome - stats[0].totalExpense
  };
};

/**
 * إحصائيات حسب التصنيف
 */
transactionSchema.statics.getStatsByCategory = async function(startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        isActive: true,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { type: '$type', category: '$category' },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.category',
        income: {
          $sum: { $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0] }
        },
        expense: {
          $sum: { $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0] }
        },
        count: { $sum: '$count' }
      }
    }
  ]);
};

/**
 * إحصائيات حسب طريقة الدفع
 */
transactionSchema.statics.getStatsByPaymentMethod = async function(startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        isActive: true,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { type: '$type', paymentMethod: '$paymentMethod' },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.paymentMethod',
        income: {
          $sum: { $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0] }
        },
        expense: {
          $sum: { $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0] }
        },
        count: { $sum: '$count' }
      }
    }
  ]);
};

/**
 * إحصائيات حسب الموظف
 */
transactionSchema.statics.getStatsByEmployee = async function(startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        isActive: true,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$createdBy',
        income: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
        },
        expense: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
        },
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'employee'
      }
    },
    {
      $unwind: '$employee'
    },
    {
      $project: {
        employeeId: '$_id',
        employeeName: '$employee.name',
        income: 1,
        expense: 1,
        net: { $subtract: ['$income', '$expense'] },
        count: 1
      }
    }
  ]);
};

// الفهارس
transactionSchema.index({ transactionNumber: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ paymentMethod: 1 });
transactionSchema.index({ source: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ createdBy: 1 });
transactionSchema.index({ receipt: 1 });
transactionSchema.index({ invoice: 1 });
transactionSchema.index({ appointment: 1 });
transactionSchema.index({ customer: 1 });
transactionSchema.index({ isActive: 1 });
// فهرس مركب للبحث السريع
transactionSchema.index({ isActive: 1, createdAt: -1 });
transactionSchema.index({ isActive: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
