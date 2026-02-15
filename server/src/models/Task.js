const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  // رقم المهمة التلقائي
  taskNumber: {
    type: String,
    unique: true
  },

  // الربط مع الموعد (علاقة 1:1)
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true
  },

  // حالة المهمة
  status: {
    type: String,
    enum: ['new', 'in_progress', 'completed', 'cancelled'],
    default: 'new'
  },

  // الموظف المسؤول
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // تاريخ بدء العمل
  startedAt: {
    type: Date,
    default: null
  },

  // تاريخ الإكمال
  completedAt: {
    type: Date,
    default: null
  },

  // تاريخ الإلغاء
  cancelledAt: {
    type: Date,
    default: null
  },

  // سبب الإلغاء
  cancelReason: {
    type: String,
    default: null
  },

  // سجل التحويلات
  transferHistory: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    transferredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    transferredAt: {
      type: Date,
      default: Date.now
    }
  }],

  // ملاحظات إضافية على المهمة
  taskNotes: [{
    content: {
      type: String,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // مرفقات إضافية على المهمة
  taskAttachments: [{
    filename: String,
    originalName: String,
    path: String,
    url: String,
    mimetype: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // من أنشأ المهمة
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // الحالة النشطة
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// توليد رقم المهمة تلقائياً
taskSchema.pre('save', async function() {
  if (!this.taskNumber) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // البحث عن آخر مهمة اليوم
    const lastTask = await this.constructor.findOne({
      taskNumber: new RegExp(`^TASK-${dateStr}-`)
    }).sort({ taskNumber: -1 });

    let sequence = 1;
    if (lastTask) {
      const lastSeq = parseInt(lastTask.taskNumber.split('-')[2]);
      sequence = lastSeq + 1;
    }

    this.taskNumber = `TASK-${dateStr}-${String(sequence).padStart(3, '0')}`;
  }
});

// Index للبحث السريع
taskSchema.index({ status: 1, assignedTo: 1 });
taskSchema.index({ appointment: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ taskNumber: 1 });

module.exports = mongoose.model('Task', taskSchema);
