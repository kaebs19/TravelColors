const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // نوع الموعد: مؤكد، غير مؤكد، مسودة
  type: {
    type: String,
    enum: ['confirmed', 'unconfirmed', 'draft'],
    default: 'confirmed'
  },

  // بيانات العميل
  customerName: {
    type: String,
    required: [true, 'اسم العميل مطلوب'],
    trim: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  phone: {
    type: String,
    trim: true
  },
  personsCount: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },

  // تفعيل التقديم
  isSubmission: {
    type: Boolean,
    default: false
  },

  // بيانات الموعد للنوع المؤكد
  appointmentDate: {
    type: Date,
    required: function() {
      return this.type === 'confirmed';
    }
  },
  appointmentTime: {
    type: String,
    required: function() {
      return this.type === 'confirmed';
    }
  },
  duration: {
    type: Number,
    default: 5,
    min: 5
  },

  // بيانات الموعد للنوع غير مؤكد (تاريخين)
  dateFrom: {
    type: Date,
    required: function() {
      return this.type === 'unconfirmed';
    }
  },
  dateTo: {
    type: Date,
    required: function() {
      return this.type === 'unconfirmed';
    }
  },

  // بيانات المسودة - التذكير
  reminderEnabled: {
    type: Boolean,
    default: true
  },
  reminderDate: {
    type: Date,
    required: function() {
      return this.type === 'draft' && this.reminderEnabled;
    }
  },
  reminderTime: {
    type: String,
    required: function() {
      return this.type === 'draft' && this.reminderEnabled;
    }
  },

  // خصوصية المسودة
  visibility: {
    type: String,
    enum: ['private', 'public'],
    default: 'private'
  },

  // عميل VIP
  isVIP: {
    type: Boolean,
    default: false
  },

  // القسم والمدينة
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: function() {
      return this.type !== 'draft';
    }
  },
  city: {
    type: String,
    default: 'الرياض'
  },

  // ملاحظات ومرفقات
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // حالة الموعد
  status: {
    type: String,
    enum: ['new', 'in_progress', 'completed', 'cancelled'],
    default: 'new'
  },

  // بيانات الدفع
  paymentType: {
    type: String,
    enum: ['cash', 'card', 'transfer', ''],
    default: ''
  },
  totalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    default: 0
  },

  // من أنشأ الموعد
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// حساب المبلغ المتبقي تلقائياً
appointmentSchema.pre('save', function() {
  if (this.totalAmount && this.paidAmount !== undefined) {
    this.remainingAmount = this.totalAmount - this.paidAmount;
  }
});

// Index للبحث السريع
appointmentSchema.index({ appointmentDate: 1, department: 1 });
appointmentSchema.index({ customerName: 'text' });
appointmentSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
