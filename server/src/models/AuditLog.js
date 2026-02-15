const mongoose = require('mongoose');

/**
 * نموذج سجل التدقيق
 * يتتبع جميع العمليات على الكيانات المالية والحساسة
 */
const auditLogSchema = new mongoose.Schema({
  // نوع الإجراء
  action: {
    type: String,
    enum: [
      'create',       // إنشاء
      'update',       // تعديل
      'delete',       // حذف
      'payment',      // دفعة
      'convert',      // تحويل (إيصال لفاتورة)
      'cancel',       // إلغاء
      'refund',       // استرداد
      'view',         // عرض (اختياري)
      'export',       // تصدير
      'print',        // طباعة
      'start_task',   // بدء المهمة
      'complete_task', // إكمال المهمة
      'cancel_task',  // إلغاء المهمة
      'transfer_task' // تحويل المهمة
    ],
    required: true
  },

  // نوع الكيان
  entityType: {
    type: String,
    enum: [
      'transaction',  // معاملة مالية
      'receipt',      // إيصال
      'invoice',      // فاتورة
      'appointment',  // موعد
      'customer',     // عميل
      'user',         // مستخدم
      'settings',     // إعدادات
      'task'          // مهمة
    ],
    required: true
  },

  // معرف الكيان
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  // رقم الكيان (للعرض السهل)
  entityNumber: {
    type: String
  },

  // المستخدم الذي قام بالإجراء
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // اسم المستخدم (للحفظ التاريخي)
  userName: {
    type: String
  },

  // دور المستخدم وقت الإجراء
  userRole: {
    type: String
  },

  // التغييرات
  changes: {
    before: {
      type: mongoose.Schema.Types.Mixed
    },
    after: {
      type: mongoose.Schema.Types.Mixed
    }
  },

  // عنوان IP
  ipAddress: {
    type: String
  },

  // معلومات المتصفح
  userAgent: {
    type: String
  },

  // وصف الإجراء
  description: {
    type: String
  },

  // بيانات إضافية
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

/**
 * إنشاء سجل تدقيق جديد
 */
auditLogSchema.statics.log = async function(data) {
  const {
    action,
    entityType,
    entityId,
    entityNumber,
    user,
    changes,
    req,
    description,
    metadata
  } = data;

  return await this.create({
    action,
    entityType,
    entityId,
    entityNumber,
    userId: user._id || user.id,
    userName: user.name,
    userRole: user.role,
    changes,
    ipAddress: req?.ip || req?.connection?.remoteAddress || req?.headers?.['x-forwarded-for'],
    userAgent: req?.get?.('User-Agent') || req?.headers?.['user-agent'],
    description,
    metadata
  });
};

/**
 * الحصول على سجل كيان معين
 */
auditLogSchema.statics.getEntityHistory = async function(entityType, entityId, options = {}) {
  const { limit = 50, skip = 0 } = options;

  return await this.find({ entityType, entityId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email role');
};

/**
 * الحصول على نشاط مستخدم معين
 */
auditLogSchema.statics.getUserActivity = async function(userId, options = {}) {
  const { limit = 50, skip = 0, startDate, endDate, action, entityType } = options;

  const query = { userId: new mongoose.Types.ObjectId(userId) };

  if (startDate && endDate) {
    query.createdAt = { $gte: startDate, $lte: endDate };
  }

  if (action) {
    query.action = action;
  }

  if (entityType) {
    query.entityType = entityType;
  }

  return await this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

/**
 * إحصائيات سجل التدقيق
 */
auditLogSchema.statics.getStats = async function(startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { action: '$action', entityType: '$entityType' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.action',
        entities: {
          $push: {
            entityType: '$_id.entityType',
            count: '$count'
          }
        },
        totalCount: { $sum: '$count' }
      }
    }
  ]);
};

/**
 * الحصول على آخر الإجراءات
 */
auditLogSchema.statics.getRecentActivity = async function(options = {}) {
  const { limit = 20, entityType, action } = options;

  const query = {};
  if (entityType) query.entityType = entityType;
  if (action) query.action = action;

  return await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'name email');
};

/**
 * البحث في السجل
 */
auditLogSchema.statics.search = async function(searchTerm, options = {}) {
  const { limit = 50, skip = 0 } = options;

  return await this.find({
    $or: [
      { entityNumber: new RegExp(searchTerm, 'i') },
      { userName: new RegExp(searchTerm, 'i') },
      { description: new RegExp(searchTerm, 'i') }
    ]
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email');
};

// الفهارس
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entityType: 1 });
auditLogSchema.index({ entityId: 1 });
auditLogSchema.index({ entityNumber: 1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ createdAt: -1 });
// فهارس مركبة
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, entityType: 1, createdAt: -1 });

// TTL Index - حذف السجلات بعد سنتين (اختياري، يمكن تعديله)
// auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
