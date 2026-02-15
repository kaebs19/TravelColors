const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
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

  // عنوان المسودة
  title: {
    type: String,
    trim: true,
    default: ''
  },

  // الملاحظات
  notes: {
    type: String,
    trim: true,
    default: ''
  },

  // نوع الظهور: عام أو خاص
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'private'
  },

  // الأولوية
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  // التذكير
  reminderEnabled: {
    type: Boolean,
    default: true
  },
  reminderDate: {
    type: Date
  },
  reminderTime: {
    type: String,
    default: '08:00'
  },

  // الحالة
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },

  // الإجراء المتخذ
  action: {
    type: String,
    enum: ['none', 'called', 'messaged', 'converted', 'other'],
    default: 'none'
  },
  actionNotes: {
    type: String,
    default: ''
  },

  // القسم (اختياري - للربط بموعد مستقبلي)
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },

  // من أنشأ المسودة
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index للبحث السريع
noteSchema.index({ customerName: 'text', notes: 'text', title: 'text' });
noteSchema.index({ status: 1, visibility: 1 });
noteSchema.index({ reminderDate: 1 });
noteSchema.index({ createdBy: 1, visibility: 1 });

module.exports = mongoose.model('Note', noteSchema);
