const mongoose = require('mongoose');

/**
 * نموذج الإيصال
 * مستند مالي منفصل عن الفاتورة
 * كل إيصال ينشئ معاملة تلقائياً
 */
const receiptSchema = new mongoose.Schema({
  // رقم الإيصال التلقائي: REC-YYYYMMDD-XXX
  receiptNumber: {
    type: String,
    required: true,
    unique: true
  },

  // مرجع الموعد (اختياري)
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },

  // مرجع العميل
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },

  // بيانات العميل (snapshot للحفظ التاريخي)
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    default: ''
  },

  // المبلغ
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

  // الوصف / الغرض
  description: {
    type: String,
    default: ''
  },

  // المعاملة المرتبطة (1:1)
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },

  // هل تم تحويله لفاتورة؟
  convertedToInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  convertedAt: {
    type: Date
  },

  // حالة الإيصال
  status: {
    type: String,
    enum: ['active', 'converted', 'cancelled'],
    default: 'active'
  },

  // بيانات الشركة (snapshot وقت الإنشاء)
  companyInfo: {
    name: String,
    nameEn: String,
    address: String,
    phone: String,
    email: String,
    logo: String,
    taxNumber: String
  },

  // الموظف المسؤول
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
 * توليد رقم الإيصال التلقائي
 * الصيغة: REC-YYYYMMDD-XXX
 */
receiptSchema.statics.generateReceiptNumber = async function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // البحث عن آخر إيصال في نفس اليوم
  const lastReceipt = await this.findOne({
    receiptNumber: new RegExp(`^REC-${dateStr}`)
  }).sort({ receiptNumber: -1 });

  let sequence = 1;
  if (lastReceipt) {
    const parts = lastReceipt.receiptNumber.split('-');
    if (parts.length === 3) {
      sequence = parseInt(parts[2]) + 1;
    }
  }

  return `REC-${dateStr}-${sequence.toString().padStart(3, '0')}`;
};

/**
 * الحصول على إحصائيات الإيصالات
 */
receiptSchema.statics.getStats = async function(startDate, endDate, userId = null) {
  const match = {
    status: { $ne: 'cancelled' },
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
        totalAmount: { $sum: '$amount' },
        receiptCount: { $sum: 1 },
        convertedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] }
        },
        activeCount: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalAmount: 0,
      receiptCount: 0,
      convertedCount: 0,
      activeCount: 0
    };
  }

  return stats[0];
};

/**
 * إحصائيات حسب طريقة الدفع
 */
receiptSchema.statics.getStatsByPaymentMethod = async function(startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        status: { $ne: 'cancelled' },
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$paymentMethod',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

/**
 * إحصائيات حسب الموظف
 */
receiptSchema.statics.getStatsByEmployee = async function(startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        status: { $ne: 'cancelled' },
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$createdBy',
        total: { $sum: '$amount' },
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
        total: 1,
        count: 1
      }
    }
  ]);
};

// الفهارس
receiptSchema.index({ receiptNumber: 1 });
receiptSchema.index({ appointment: 1 });
receiptSchema.index({ customer: 1 });
receiptSchema.index({ status: 1 });
receiptSchema.index({ createdAt: -1 });
receiptSchema.index({ createdBy: 1 });
receiptSchema.index({ transaction: 1 });
receiptSchema.index({ convertedToInvoice: 1 });
// فهرس مركب للبحث السريع
receiptSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Receipt', receiptSchema);
