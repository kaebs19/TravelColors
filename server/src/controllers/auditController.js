const AuditLog = require('../models/AuditLog');
const { getDayBounds, getMonthBounds } = require('../utils/financialUtils');

/**
 * @desc    الحصول على سجل التدقيق
 * @route   GET /api/audit
 * @access  Private (Admin only)
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const {
      entityType,
      action,
      userId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};

    // فلتر نوع الكيان
    if (entityType) {
      query.entityType = entityType;
    }

    // فلتر الإجراء
    if (action) {
      query.action = action;
    }

    // فلتر المستخدم
    if (userId) {
      query.userId = userId;
    }

    // فلتر التاريخ
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // البحث
    if (search) {
      query.$or = [
        { entityNumber: new RegExp(search, 'i') },
        { userName: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    الحصول على سجل كيان معين
 * @route   GET /api/audit/entity/:entityType/:entityId
 * @access  Private (Admin only)
 */
exports.getEntityLogs = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const logs = await AuditLog.getEntityHistory(entityType, entityId, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const total = await AuditLog.countDocuments({ entityType, entityId });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    الحصول على نشاط مستخدم معين
 * @route   GET /api/audit/user/:userId
 * @access  Private (Admin only)
 */
exports.getUserActivity = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const {
      action,
      entityType,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    };

    if (action) options.action = action;
    if (entityType) options.entityType = entityType;

    if (startDate && endDate) {
      options.startDate = new Date(startDate);
      options.endDate = new Date(endDate);
      options.endDate.setHours(23, 59, 59, 999);
    }

    const logs = await AuditLog.getUserActivity(userId, options);

    // حساب العدد الإجمالي
    const countQuery = { userId };
    if (action) countQuery.action = action;
    if (entityType) countQuery.entityType = entityType;
    if (startDate && endDate) {
      countQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const total = await AuditLog.countDocuments(countQuery);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    الحصول على آخر الأنشطة
 * @route   GET /api/audit/recent
 * @access  Private (Admin only)
 */
exports.getRecentActivity = async (req, res, next) => {
  try {
    const { entityType, action, limit = 20 } = req.query;

    const logs = await AuditLog.getRecentActivity({
      entityType,
      action,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: { logs }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    الحصول على إحصائيات التدقيق
 * @route   GET /api/audit/stats
 * @access  Private (Admin only)
 */
exports.getAuditStats = async (req, res, next) => {
  try {
    const { startDate, endDate, period = 'month' } = req.query;

    let start, end;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      const bounds = period === 'day' ? getDayBounds() : getMonthBounds();
      start = bounds.start;
      end = bounds.end;
    }

    const stats = await AuditLog.getStats(start, end);

    // إحصائيات إضافية
    const totalLogs = await AuditLog.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });

    // أكثر المستخدمين نشاطاً
    const topUsers = await AuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
          userName: { $first: '$userName' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        period: { start, end },
        totalLogs,
        byAction: stats,
        topUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    البحث في سجل التدقيق
 * @route   GET /api/audit/search
 * @access  Private (Admin only)
 */
exports.searchAuditLogs = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 50 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال نص للبحث'
      });
    }

    const logs = await AuditLog.search(q, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    // حساب العدد الإجمالي
    const total = await AuditLog.countDocuments({
      $or: [
        { entityNumber: new RegExp(q, 'i') },
        { userName: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') }
      ]
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
