const { Task, Appointment, User, AuditLog } = require('../models');

// @desc    جلب جميع المهام
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res, next) => {
  try {
    const {
      status,
      assignedTo,
      department,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20
    } = req.query;

    // بناء الـ query
    let query = { isActive: true };

    // فلترة حسب الحالة
    if (status) {
      query.status = status;
    }

    // فلترة حسب الموظف المسؤول
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // فلترة حسب التاريخ
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // جلب المهام مع populate
    let tasks = await Task.find(query)
      .populate({
        path: 'appointment',
        populate: [
          { path: 'department', select: 'title' },
          { path: 'customer', select: 'name phone' }
        ]
      })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // فلترة إضافية حسب القسم (بعد populate)
    if (department) {
      tasks = tasks.filter(t => t.appointment?.department?._id?.toString() === department);
    }

    // البحث
    if (search) {
      const searchLower = search.toLowerCase();
      tasks = tasks.filter(t =>
        t.taskNumber?.toLowerCase().includes(searchLower) ||
        t.appointment?.customerName?.toLowerCase().includes(searchLower) ||
        t.appointment?.phone?.includes(search)
      );
    }

    // العدد الإجمالي
    const total = await Task.countDocuments(query);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    جلب مهمة واحدة
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate({
        path: 'appointment',
        populate: [
          { path: 'department', select: 'title cities requirements' },
          { path: 'customer', select: 'name phone email' },
          { path: 'createdBy', select: 'name' }
        ]
      })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .populate('taskNotes.createdBy', 'name')
      .populate('taskAttachments.uploadedBy', 'name')
      .populate('transferHistory.from', 'name')
      .populate('transferHistory.to', 'name')
      .populate('transferHistory.transferredBy', 'name');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'المهمة غير موجودة'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    بدء العمل على مهمة
// @route   PUT /api/tasks/:id/start
// @access  Private
exports.startTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'المهمة غير موجودة'
      });
    }

    if (task.status !== 'new') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن بدء العمل على هذه المهمة - الحالة الحالية: ' + task.status
      });
    }

    // تحديث المهمة
    task.status = 'in_progress';
    task.assignedTo = req.user.id;
    task.startedAt = new Date();
    await task.save();

    // سجل التدقيق
    await AuditLog.create({
      action: 'start_task',
      entityType: 'task',
      entityId: task._id,
      entityNumber: task.taskNumber,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      changes: {
        before: { status: 'new', assignedTo: null },
        after: { status: 'in_progress', assignedTo: req.user.id }
      }
    });

    // جلب المهمة محدثة
    const updatedTask = await Task.findById(task._id)
      .populate({
        path: 'appointment',
        populate: [
          { path: 'department', select: 'title' },
          { path: 'customer', select: 'name phone' }
        ]
      })
      .populate('assignedTo', 'name email');

    res.json({
      success: true,
      message: 'تم بدء العمل على المهمة',
      data: updatedTask
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إكمال المهمة
// @route   PUT /api/tasks/:id/complete
// @access  Private
exports.completeTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'المهمة غير موجودة'
      });
    }

    if (task.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'المهمة مكتملة بالفعل'
      });
    }

    // التحقق من أن الموظف هو المسؤول أو مدير
    if (task.assignedTo && task.assignedTo.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'لا يمكنك إكمال مهمة مسؤول عنها موظف آخر'
      });
    }

    const previousStatus = task.status;

    // تحديث المهمة
    task.status = 'completed';
    task.completedAt = new Date();
    if (!task.assignedTo) {
      task.assignedTo = req.user.id;
    }
    await task.save();

    // سجل التدقيق
    await AuditLog.create({
      action: 'complete_task',
      entityType: 'task',
      entityId: task._id,
      entityNumber: task.taskNumber,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      changes: {
        before: { status: previousStatus },
        after: { status: 'completed', completedAt: task.completedAt }
      }
    });

    res.json({
      success: true,
      message: 'تم إكمال المهمة بنجاح',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إلغاء المهمة
// @route   PUT /api/tasks/:id/cancel
// @access  Private
exports.cancelTask = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'المهمة غير موجودة'
      });
    }

    if (task.status === 'completed' || task.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن إلغاء هذه المهمة'
      });
    }

    const previousStatus = task.status;

    // تحديث المهمة
    task.status = 'cancelled';
    task.cancelledAt = new Date();
    task.cancelReason = reason || '';
    await task.save();

    // سجل التدقيق
    await AuditLog.create({
      action: 'cancel_task',
      entityType: 'task',
      entityId: task._id,
      entityNumber: task.taskNumber,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      changes: {
        before: { status: previousStatus },
        after: { status: 'cancelled', cancelReason: reason }
      }
    });

    res.json({
      success: true,
      message: 'تم إلغاء المهمة',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تحويل المهمة لموظف آخر
// @route   PUT /api/tasks/:id/transfer
// @access  Private
exports.transferTask = async (req, res, next) => {
  try {
    const { toUserId, reason } = req.body;

    if (!toUserId) {
      return res.status(400).json({
        success: false,
        message: 'يجب تحديد الموظف المراد التحويل إليه'
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'المهمة غير موجودة'
      });
    }

    if (task.status === 'completed' || task.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تحويل مهمة مكتملة أو ملغاة'
      });
    }

    // التحقق من وجود الموظف الجديد
    const newAssignee = await User.findById(toUserId);
    if (!newAssignee) {
      return res.status(404).json({
        success: false,
        message: 'الموظف المحدد غير موجود'
      });
    }

    // التحقق من الصلاحيات (المدير أو الموظف المسؤول الحالي)
    if (task.assignedTo && task.assignedTo.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'لا يمكنك تحويل مهمة مسؤول عنها موظف آخر'
      });
    }

    const previousAssignee = task.assignedTo;

    // إضافة سجل التحويل
    task.transferHistory.push({
      from: previousAssignee,
      to: toUserId,
      transferredBy: req.user.id,
      reason: reason || '',
      transferredAt: new Date()
    });

    task.assignedTo = toUserId;
    if (task.status === 'new') {
      task.status = 'in_progress';
      task.startedAt = new Date();
    }
    await task.save();

    // سجل التدقيق
    await AuditLog.create({
      action: 'transfer_task',
      entityType: 'task',
      entityId: task._id,
      entityNumber: task.taskNumber,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      changes: {
        before: { assignedTo: previousAssignee },
        after: { assignedTo: toUserId, transferReason: reason }
      }
    });

    // جلب المهمة محدثة
    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('transferHistory.from', 'name')
      .populate('transferHistory.to', 'name');

    res.json({
      success: true,
      message: 'تم تحويل المهمة بنجاح',
      data: updatedTask
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إضافة ملاحظة للمهمة
// @route   POST /api/tasks/:id/notes
// @access  Private
exports.addTaskNote = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'محتوى الملاحظة مطلوب'
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'المهمة غير موجودة'
      });
    }

    task.taskNotes.push({
      content: content.trim(),
      createdBy: req.user.id,
      createdAt: new Date()
    });
    await task.save();

    // جلب المهمة محدثة
    const updatedTask = await Task.findById(task._id)
      .populate('taskNotes.createdBy', 'name');

    res.json({
      success: true,
      message: 'تمت إضافة الملاحظة',
      data: updatedTask.taskNotes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إضافة مرفق للمهمة
// @route   POST /api/tasks/:id/attachments
// @access  Private
exports.addTaskAttachment = async (req, res, next) => {
  try {
    const { filename, originalName, path, url, mimetype, size } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'المهمة غير موجودة'
      });
    }

    task.taskAttachments.push({
      filename,
      originalName,
      path,
      url,
      mimetype,
      size,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    });
    await task.save();

    res.json({
      success: true,
      message: 'تمت إضافة المرفق',
      data: task.taskAttachments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إحصائيات المهام
// @route   GET /api/tasks/stats
// @access  Private
exports.getTaskStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        }
      };
    }

    // إحصائيات عامة
    const [
      totalTasks,
      newTasks,
      inProgressTasks,
      completedTasks,
      cancelledTasks
    ] = await Promise.all([
      Task.countDocuments({ isActive: true, ...dateQuery }),
      Task.countDocuments({ status: 'new', isActive: true, ...dateQuery }),
      Task.countDocuments({ status: 'in_progress', isActive: true, ...dateQuery }),
      Task.countDocuments({ status: 'completed', isActive: true, ...dateQuery }),
      Task.countDocuments({ status: 'cancelled', isActive: true, ...dateQuery })
    ]);

    // مكتملة هذا الشهر
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const completedThisMonth = await Task.countDocuments({
      status: 'completed',
      isActive: true,
      completedAt: { $gte: startOfMonth }
    });

    // المهام حسب الموظف
    const tasksByEmployee = await Task.aggregate([
      { $match: { isActive: true, assignedTo: { $ne: null }, ...dateQuery } },
      {
        $group: {
          _id: '$assignedTo',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } }
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
      { $unwind: '$employee' },
      {
        $project: {
          employeeId: '$_id',
          employeeName: '$employee.name',
          total: 1,
          completed: 1,
          inProgress: 1
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        total: totalTasks,
        new: newTasks,
        inProgress: inProgressTasks,
        completed: completedTasks,
        cancelled: cancelledTasks,
        completedThisMonth,
        byEmployee: tasksByEmployee
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    مهام الموظف الحالي
// @route   GET /api/tasks/my-tasks
// @access  Private
exports.getMyTasks = async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = {
      assignedTo: req.user.id,
      isActive: true
    };

    if (status) {
      query.status = status;
    }

    const tasks = await Task.find(query)
      .populate({
        path: 'appointment',
        populate: [
          { path: 'department', select: 'title' },
          { path: 'customer', select: 'name phone' }
        ]
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    جلب المهمة بواسطة الموعد
// @route   GET /api/tasks/by-appointment/:appointmentId
// @access  Private
exports.getTaskByAppointment = async (req, res, next) => {
  try {
    const task = await Task.findOne({ appointment: req.params.appointmentId })
      .populate('assignedTo', 'name email')
      .populate('taskNotes.createdBy', 'name');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'لا توجد مهمة لهذا الموعد'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إحصائيات المهام للوحة التحكم
// @route   GET /api/tasks/dashboard-stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    // بداية الأسبوع (السبت)
    const startOfWeek = new Date(today);
    const dayOfWeek = startOfWeek.getDay();
    const diffToSaturday = dayOfWeek === 6 ? 0 : (dayOfWeek + 1);
    startOfWeek.setDate(startOfWeek.getDate() - diffToSaturday);
    startOfWeek.setHours(0, 0, 0, 0);

    // 1. مهام اليوم (حسب موعد الموعد المرتبط)
    const todayTasksData = await Task.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointment',
          foreignField: '_id',
          as: 'appointmentInfo'
        }
      },
      { $unwind: { path: '$appointmentInfo', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          'appointmentInfo.appointmentDate': {
            $gte: today,
            $lt: tomorrow
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $ne: ['$status', 'completed'] }, 1, 0] } }
        }
      }
    ]);

    const todayTasks = todayTasksData[0] || { total: 0, completed: 0, pending: 0 };

    // 2. مهام متأخرة (الموعد فات ولم تكتمل)
    const overdueTasksCount = await Task.aggregate([
      {
        $match: {
          isActive: true,
          status: { $nin: ['completed', 'cancelled'] }
        }
      },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointment',
          foreignField: '_id',
          as: 'appointmentInfo'
        }
      },
      { $unwind: { path: '$appointmentInfo', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          'appointmentInfo.appointmentDate': { $lt: today }
        }
      },
      { $count: 'count' }
    ]);

    const overdueTasks = overdueTasksCount[0]?.count || 0;

    // 3. مهام تنتهي خلال 24 ساعة
    const dueSoonCount = await Task.aggregate([
      {
        $match: {
          isActive: true,
          status: { $nin: ['completed', 'cancelled'] }
        }
      },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointment',
          foreignField: '_id',
          as: 'appointmentInfo'
        }
      },
      { $unwind: { path: '$appointmentInfo', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          'appointmentInfo.appointmentDate': {
            $gte: today,
            $lt: dayAfterTomorrow
          }
        }
      },
      { $count: 'count' }
    ]);

    const dueSoon = dueSoonCount[0]?.count || 0;

    // 4. نسبة الإنجاز اليومية
    const dailyCompletionRate = todayTasks.total > 0
      ? Math.round((todayTasks.completed / todayTasks.total) * 100)
      : 0;

    // 5. الرسم البياني (آخر 7 أيام)
    const weeklyChart = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayStats = await Task.aggregate([
        {
          $match: {
            isActive: true,
            createdAt: { $gte: dayStart, $lt: dayEnd }
          }
        },
        {
          $group: {
            _id: null,
            received: { $sum: 1 }
          }
        }
      ]);

      const completedStats = await Task.aggregate([
        {
          $match: {
            isActive: true,
            status: 'completed',
            completedAt: { $gte: dayStart, $lt: dayEnd }
          }
        },
        {
          $group: {
            _id: null,
            completed: { $sum: 1 }
          }
        }
      ]);

      weeklyChart.push({
        date: dayStart.toISOString().split('T')[0],
        dayName: dayStart.toLocaleDateString('ar-SA', { weekday: 'short' }),
        received: dayStats[0]?.received || 0,
        completed: completedStats[0]?.completed || 0
      });
    }

    // 6. التنبيهات
    // مهام جديدة لم تُستلم
    const unassignedCount = await Task.countDocuments({
      isActive: true,
      status: 'new',
      assignedTo: null
    });

    // مهام قيد التنفيذ لأكثر من 24 ساعة
    const longRunningDate = new Date();
    longRunningDate.setHours(longRunningDate.getHours() - 24);
    const longRunningCount = await Task.countDocuments({
      isActive: true,
      status: 'in_progress',
      startedAt: { $lt: longRunningDate }
    });

    // مهام عاجلة (موعدها اليوم ولم تكتمل)
    const urgentCount = await Task.aggregate([
      {
        $match: {
          isActive: true,
          status: { $nin: ['completed', 'cancelled'] }
        }
      },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointment',
          foreignField: '_id',
          as: 'appointmentInfo'
        }
      },
      { $unwind: { path: '$appointmentInfo', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          'appointmentInfo.appointmentDate': {
            $gte: today,
            $lt: tomorrow
          }
        }
      },
      { $count: 'count' }
    ]);

    // 7. أفضل 3 موظفين هذا الأسبوع
    const topEmployees = await Task.aggregate([
      {
        $match: {
          isActive: true,
          status: 'completed',
          completedAt: { $gte: startOfWeek }
        }
      },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointment',
          foreignField: '_id',
          as: 'appointmentInfo'
        }
      },
      { $unwind: { path: '$appointmentInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$assignedTo',
          completedTasks: { $sum: 1 },
          totalPersons: { $sum: { $ifNull: ['$appointmentInfo.personsCount', 1] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'employeeInfo'
        }
      },
      { $unwind: { path: '$employeeInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          employeeId: '$_id',
          name: { $ifNull: ['$employeeInfo.name', 'غير معروف'] },
          completedTasks: 1,
          totalPersons: 1
        }
      },
      { $sort: { completedTasks: -1 } },
      { $limit: 3 }
    ]);

    res.json({
      success: true,
      data: {
        todayTasks,
        overdueTasks,
        dueSoon,
        dailyCompletionRate,
        weeklyChart,
        alerts: {
          unassigned: unassignedCount,
          longRunning: longRunningCount,
          urgent: urgentCount[0]?.count || 0
        },
        topEmployees
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    next(error);
  }
};

// @desc    جلب النشاطات الأخيرة للمهام
// @route   GET /api/tasks/recent-activities
// @access  Private
exports.getRecentActivities = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // جلب آخر نشاطات المهام من سجل التدقيق
    const activities = await AuditLog.find({
      entityType: 'task',
      action: { $in: ['start_task', 'complete_task'] }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name');

    // تحويل النشاطات إلى الصيغة المطلوبة
    const formattedActivities = await Promise.all(
      activities.map(async (activity) => {
        // جلب بيانات المهمة
        const task = await Task.findById(activity.entityId)
          .populate({
            path: 'appointment',
            select: 'customerName'
          });

        const now = new Date();
        const diff = now - activity.createdAt;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));

        let timeAgo;
        if (minutes < 1) {
          timeAgo = 'الآن';
        } else if (minutes < 60) {
          timeAgo = `منذ ${minutes} دقيقة`;
        } else if (hours < 24) {
          timeAgo = `منذ ${hours} ساعة`;
        } else {
          const days = Math.floor(hours / 24);
          timeAgo = `منذ ${days} يوم`;
        }

        return {
          id: activity._id,
          taskId: activity.entityId,
          taskNumber: activity.entityNumber,
          type: activity.action === 'start_task' ? 'start' : 'complete',
          employeeName: activity.userName || activity.userId?.name || 'موظف',
          customerName: task?.appointment?.customerName || 'عميل',
          timeAgo,
          createdAt: activity.createdAt
        };
      })
    );

    res.json({
      success: true,
      data: {
        activities: formattedActivities
      }
    });
  } catch (error) {
    next(error);
  }
};
