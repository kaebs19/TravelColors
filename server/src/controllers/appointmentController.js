const { Appointment, Department, Customer, CashRegister, Receipt, Transaction, Settings, AuditLog, Task } = require('../models');
const googleSheetsService = require('../services/googleSheetsService');
const { isGoogleSheetsEnabled } = require('../config/google');
const { calculatePagination, formatPaginatedResponse } = require('../utils/paginationHelper');
const { buildSearchQuery } = require('../utils/queryBuilder');
const { checkExists } = require('../utils/responseHelper');

// @desc    الحصول على جميع المواعيد
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res, next) => {
  try {
    const { page, limit, search, department, city, status, date, type } = req.query;

    const { skip, page: pageNum, limit: limitNum } = calculatePagination(page, limit);

    const query = {
      ...buildSearchQuery(['customerName', 'phone', 'notes'], search)
    };

    if (department) {
      query.department = department;
    }

    if (city) {
      query.city = city;
    }

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      // البحث في جميع أنواع التواريخ
      query.$or = [
        { appointmentDate: { $gte: startDate, $lte: endDate } },
        { dateFrom: { $lte: endDate }, dateTo: { $gte: startDate } },
        { reminderDate: { $gte: startDate, $lte: endDate } }
      ];
    }

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('department', 'title cities submissionType processingDays')
        .populate('customer', 'name phone email')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Appointment.countDocuments(query)
    ]);

    res.json(formatPaginatedResponse(appointments, total, pageNum, limitNum, 'appointments'));
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على موعد واحد
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('department', 'title cities submissionType processingDays')
      .populate('customer', 'name phone email')
      .populate('createdBy', 'name');

    if (!checkExists(res, appointment, 'الموعد')) return;

    res.json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إنشاء موعد جديد
// @route   POST /api/appointments
// @access  Private
exports.createAppointment = async (req, res, next) => {
  try {
    const {
      type,
      customerName,
      customer,
      phone,
      personsCount,
      isSubmission,
      isVIP,
      appointmentDate,
      appointmentTime,
      duration,
      dateFrom,
      dateTo,
      reminderEnabled,
      reminderDate,
      reminderTime,
      department,
      city,
      notes,
      // بيانات الدفع
      paymentType,
      totalAmount,
      paidAmount,
      // مضاف بواسطة (اختياري)
      createdBy
    } = req.body;

    // التحقق من القسم للأنواع غير المسودة
    if (type !== 'draft') {
      const dept = await Department.findById(department);
      if (!dept) {
        return res.status(400).json({
          success: false,
          message: 'القسم غير موجود'
        });
      }
    }

    // إضافة العميل تلقائياً إذا لم يكن موجوداً
    let customerId = customer || null;
    if (!customer && customerName && phone) {
      try {
        // البحث عن عميل موجود بنفس رقم الهاتف
        let existingCustomer = await Customer.findOne({ phone: phone });
        if (existingCustomer) {
          customerId = existingCustomer._id;
        } else {
          // إنشاء عميل جديد
          const newCustomer = await Customer.create({
            name: customerName,
            phone: phone,
            address: { city: city || 'الرياض' },
            createdBy: req.user.id
          });
          customerId = newCustomer._id;
        }
      } catch (customerError) {
        console.error('Error creating customer:', customerError);
        // متابعة إنشاء الموعد حتى لو فشل إنشاء العميل
      }
    }

    const appointmentData = {
      type: type || 'confirmed',
      customerName,
      customer: customerId,
      phone,
      personsCount: Math.min(Math.max(personsCount || 1, 1), 10),
      isSubmission: isSubmission || false,
      isVIP: isVIP || false,
      department: type !== 'draft' ? department : undefined,
      city: city || 'الرياض',
      notes,
      // بيانات الدفع
      paymentType: paymentType || '',
      totalAmount: parseFloat(totalAmount) || 0,
      paidAmount: parseFloat(paidAmount) || 0,
      createdBy: createdBy || req.user.id
    };

    // إضافة الحقول حسب نوع الموعد
    if (type === 'confirmed') {
      appointmentData.appointmentDate = appointmentDate;
      appointmentData.appointmentTime = appointmentTime;
      appointmentData.duration = duration || 5;
    } else if (type === 'unconfirmed') {
      appointmentData.dateFrom = dateFrom;
      appointmentData.dateTo = dateTo;
    } else if (type === 'draft') {
      // إذا لم يحدد المستخدم تاريخ تذكير، نُعطّل التذكير لتفادي خطأ التحقق
      const effectiveReminderEnabled = reminderEnabled !== false && !!reminderDate;
      appointmentData.reminderEnabled = effectiveReminderEnabled;
      if (effectiveReminderEnabled) {
        appointmentData.reminderDate = reminderDate;
        appointmentData.reminderTime = reminderTime;
      }
    }

    const appointment = await Appointment.create(appointmentData);

    // معالجة المرفقات إن وُجدت
    if (req.files && req.files.length > 0) {
      appointment.attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      }));
      await appointment.save();
    }

    // إنشاء إيصال ومعاملة إذا تم الدفع
    if (appointmentData.paidAmount > 0) {
      try {
        // جلب بيانات الشركة للإيصال
        const settings = await Settings.findOne();
        const companyInfo = settings ? {
          name: settings.companyName,
          nameEn: settings.companyNameEn,
          address: settings.address,
          phone: settings.phone,
          email: settings.email,
          logo: settings.logo,
          taxNumber: settings.taxNumber
        } : {};

        // توليد رقم الإيصال
        const receiptNumber = await Receipt.generateReceiptNumber();

        // إنشاء الإيصال
        const receipt = await Receipt.create({
          receiptNumber,
          appointment: appointment._id,
          customer: customerId,
          customerName: customerName,
          customerPhone: phone || '',
          amount: appointmentData.paidAmount,
          paymentMethod: appointmentData.paymentType || 'cash',
          description: `دفعة موعد - ${department ? (await Department.findById(department))?.title || '' : ''}`,
          companyInfo,
          createdBy: req.user.id,
          status: 'active'
        });

        // الحصول على الرصيد الحالي
        const cashRegister = await CashRegister.getOrCreate();
        const paymentMethod = appointmentData.paymentType || 'cash';
        const balanceBefore = paymentMethod === 'cash' ? cashRegister.cashBalance :
                             paymentMethod === 'card' ? cashRegister.cardBalance :
                             cashRegister.transferBalance;

        // توليد رقم المعاملة
        const transactionNumber = await Transaction.generateTransactionNumber();

        // إنشاء المعاملة
        const transaction = await Transaction.create({
          transactionNumber,
          type: 'income',
          amount: appointmentData.paidAmount,
          description: `إيصال ${receiptNumber} - دفعة موعد - ${customerName}`,
          category: 'appointment_payment',
          paymentMethod,
          source: 'automatic',
          sourceType: 'receipt',
          receipt: receipt._id,
          appointment: appointment._id,
          customer: customerId,
          balanceBefore,
          balanceAfter: balanceBefore + appointmentData.paidAmount,
          createdBy: req.user.id
        });

        // تحديث الإيصال بالمعاملة
        receipt.transaction = transaction._id;
        await receipt.save();

        // تحديث رصيد الصندوق
        if (paymentMethod === 'cash') {
          cashRegister.cashBalance += appointmentData.paidAmount;
        } else if (paymentMethod === 'card') {
          cashRegister.cardBalance += appointmentData.paidAmount;
        } else {
          cashRegister.transferBalance += appointmentData.paidAmount;
        }
        cashRegister.totalBalance += appointmentData.paidAmount;
        await cashRegister.save();

        // تحديث إجمالي صرف العميل
        if (customerId) {
          await Customer.findByIdAndUpdate(customerId, {
            $inc: { totalSpent: appointmentData.paidAmount }
          });
        }

        // إنشاء سجل تدقيق
        await AuditLog.log({
          action: 'create',
          entityType: 'receipt',
          entityId: receipt._id,
          entityNumber: receiptNumber,
          user: req.user,
          changes: { after: receipt.toObject() },
          req,
          description: `إنشاء إيصال ${receiptNumber} من موعد`
        });
      } catch (receiptError) {
        console.error('Error creating receipt:', receiptError);
        // Fallback للنظام القديم
        try {
          const cashRegister = await CashRegister.getOrCreate();
          await cashRegister.addTransaction({
            type: 'income',
            amount: appointmentData.paidAmount,
            description: `دفعة موعد - ${customerName}`,
            category: 'appointment_payment',
            paymentMethod: appointmentData.paymentType || 'cash',
            appointment: appointment._id,
            customer: customerId,
            createdBy: req.user.id
          });

          if (customerId) {
            await Customer.findByIdAndUpdate(customerId, {
              $inc: { totalSpent: appointmentData.paidAmount }
            });
          }
        } catch (fallbackError) {
          console.error('Error in fallback transaction:', fallbackError);
        }
      }
    }

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('department', 'title cities submissionType processingDays')
      .populate('customer', 'name phone email')
      .populate('createdBy', 'name');

    // إنشاء مهمة تلقائياً للمواعيد المؤكدة
    if (appointmentData.type === 'confirmed') {
      try {
        // التحقق إذا كان تقديم إلكتروني
        const dept = await Department.findById(appointmentData.department);
        const isElectronicSubmission = appointmentData.isSubmission && dept?.submissionType === 'إلكتروني';

        const taskData = {
          appointment: appointment._id,
          createdBy: req.user.id
        };

        // إسناد المهمة دائماً لمنشئ الموعد
        taskData.assignedTo = req.user.id;

        if (isElectronicSubmission) {
          // التقديم الإلكتروني: بدء العمل تلقائياً
          taskData.status = 'in_progress';
          taskData.startedAt = new Date();
        } else {
          taskData.status = 'new';
        }

        const newTask = await Task.create(taskData);

        // تسجيل في سجل التدقيق إذا كان تقديم إلكتروني
        if (isElectronicSubmission) {
          try {
            await AuditLog.create({
              action: 'start_task',
              entityType: 'task',
              entityId: newTask._id,
              entityNumber: newTask.taskNumber,
              userId: req.user.id,
              userName: req.user.name,
              userRole: req.user.role,
              description: `بدأ العمل تلقائياً - أضافه: ${req.user.name}`,
              changes: {
                before: { status: 'new' },
                after: { status: 'in_progress', assignedTo: req.user.id }
              }
            });
          } catch (auditErr) {
            console.error('Error creating audit log for auto-start:', auditErr);
          }
        }
      } catch (taskError) {
        console.error('Error creating task for appointment:', taskError);
        // لا نوقف العملية إذا فشل إنشاء المهمة
      }
    }

    // تسجيل في سجل التدقيق
    try {
      await AuditLog.log({
        action: 'create',
        entityType: 'appointment',
        entityId: appointment._id,
        entityNumber: appointment._id.toString().slice(-6).toUpperCase(),
        user: req.user,
        changes: { after: appointmentData },
        req,
        description: `إنشاء موعد جديد - ${customerName}`
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }

    // مزامنة مع Google Sheets
    if (isGoogleSheetsEnabled()) {
      try {
        await googleSheetsService.addAppointment(populatedAppointment);
      } catch (sheetsError) {
        console.error('Error syncing to Google Sheets:', sheetsError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الموعد بنجاح',
      data: { appointment: populatedAppointment }
    });
  } catch (error) {
    console.error('Error in createAppointment:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    return res.status(500).json({
      success: false,
      message: error.message || 'حدث خطأ أثناء إنشاء الموعد',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    تحديث موعد
// @route   PUT /api/appointments/:id
// @access  Private
exports.updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!checkExists(res, appointment, 'الموعد')) return;

    // حفظ النوع القديم قبل التعديل (لإنشاء مهمة عند التحويل لمؤكد)
    const oldType = appointment.type;

    const {
      type,
      customerName,
      customer,
      phone,
      personsCount,
      isSubmission,
      isVIP,
      appointmentDate,
      appointmentTime,
      duration,
      dateFrom,
      dateTo,
      reminderEnabled,
      reminderDate,
      reminderTime,
      department,
      city,
      notes,
      status,
      // بيانات الدفع
      paymentType,
      totalAmount,
      paidAmount,
      // مضاف بواسطة
      createdBy
    } = req.body;

    // تحديث الحقول الأساسية
    if (type) appointment.type = type;
    if (customerName) appointment.customerName = customerName;
    if (customer !== undefined) appointment.customer = customer || null;
    if (phone !== undefined) appointment.phone = phone;
    if (personsCount) appointment.personsCount = Math.min(Math.max(personsCount, 1), 10);
    if (isSubmission !== undefined) appointment.isSubmission = isSubmission;
    if (isVIP !== undefined) appointment.isVIP = isVIP;
    if (department) appointment.department = department;
    if (city) appointment.city = city;
    if (notes !== undefined) appointment.notes = notes;
    if (status) appointment.status = status;
    // تحديث مضاف بواسطة (الموظف المسؤول)
    if (createdBy) appointment.createdBy = createdBy;

    // تحديث بيانات الدفع
    if (paymentType !== undefined) appointment.paymentType = paymentType;
    if (totalAmount !== undefined) appointment.totalAmount = parseFloat(totalAmount) || 0;
    if (paidAmount !== undefined) appointment.paidAmount = parseFloat(paidAmount) || 0;

    // تحديث الحقول حسب النوع
    if (type === 'confirmed' || appointment.type === 'confirmed') {
      if (appointmentDate) appointment.appointmentDate = appointmentDate;
      if (appointmentTime) appointment.appointmentTime = appointmentTime;
      if (duration) appointment.duration = duration;
    }

    if (type === 'unconfirmed' || appointment.type === 'unconfirmed') {
      if (dateFrom) appointment.dateFrom = dateFrom;
      if (dateTo) appointment.dateTo = dateTo;
    }

    if (type === 'draft' || appointment.type === 'draft') {
      if (reminderEnabled !== undefined) appointment.reminderEnabled = reminderEnabled;
      if (reminderDate) appointment.reminderDate = reminderDate;
      if (reminderTime) appointment.reminderTime = reminderTime;
      // إذا لم يوجد تاريخ تذكير، نُعطّل التذكير لتفادي خطأ التحقق
      if (!appointment.reminderDate) {
        appointment.reminderEnabled = false;
      }
    }

    // حفظ البيانات القديمة للتدقيق
    const oldData = appointment.toObject();

    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate('department', 'title cities submissionType processingDays')
      .populate('customer', 'name phone email')
      .populate('createdBy', 'name');

    // تسجيل في سجل التدقيق
    try {
      const statusLabels = {
        new: 'جديد',
        in_progress: 'قيد العمل',
        completed: 'مكتمل',
        cancelled: 'ملغي'
      };
      const description = status
        ? `تغيير حالة الموعد إلى ${statusLabels[status] || status} - ${appointment.customerName}`
        : `تحديث بيانات الموعد - ${appointment.customerName}`;

      await AuditLog.log({
        action: 'update',
        entityType: 'appointment',
        entityId: appointment._id,
        entityNumber: appointment._id.toString().slice(-6).toUpperCase(),
        user: req.user,
        changes: { before: oldData, after: req.body },
        req,
        description
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }

    // إنشاء مهمة تلقائياً عند تحويل الموعد إلى مؤكد
    if (type === 'confirmed' && oldType !== 'confirmed') {
      try {
        const existingTask = await Task.findOne({ appointment: appointment._id });
        if (!existingTask) {
          const dept = await Department.findById(appointment.department);
          const isElectronicSubmission = appointment.isSubmission && dept?.submissionType === 'إلكتروني';

          const taskData = {
            appointment: appointment._id,
            createdBy: req.user.id
          };

          // إسناد المهمة دائماً لمنشئ الموعد
          taskData.assignedTo = req.user.id;

          if (isElectronicSubmission) {
            taskData.status = 'in_progress';
            taskData.startedAt = new Date();
          } else {
            taskData.status = 'new';
          }

          await Task.create(taskData);
        }
      } catch (taskError) {
        console.error('Error creating task on convert:', taskError);
      }
    }

    // مزامنة مع Google Sheets
    if (isGoogleSheetsEnabled()) {
      try {
        await googleSheetsService.updateAppointment(updatedAppointment);
      } catch (sheetsError) {
        console.error('Error syncing to Google Sheets:', sheetsError);
      }
    }

    res.json({
      success: true,
      message: 'تم تحديث الموعد بنجاح',
      data: { appointment: updatedAppointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    حذف موعد
// @route   DELETE /api/appointments/:id
// @access  Private
exports.deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!checkExists(res, appointment, 'الموعد')) return;

    // إلغاء المهمة المرتبطة بالموعد (تبقى مرئية في قسم الملغية)
    try {
      await Task.findOneAndUpdate(
        { appointment: req.params.id, status: { $ne: 'completed' } },
        { status: 'cancelled', cancelledAt: new Date() }
      );
    } catch (taskError) {
      console.error('Error cancelling task for appointment:', taskError);
    }

    // حذف من Google Sheets
    if (isGoogleSheetsEnabled()) {
      try {
        await googleSheetsService.deleteAppointment(req.params.id);
      } catch (sheetsError) {
        console.error('Error deleting from Google Sheets:', sheetsError);
      }
    }

    await Appointment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'تم حذف الموعد بنجاح'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إضافة مرفقات لموعد موجود
// @route   POST /api/appointments/:id/attachments
// @access  Private
exports.addAttachments = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!checkExists(res, appointment, 'الموعد')) return;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم رفع أي ملفات'
      });
    }

    const newAttachments = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    }));

    appointment.attachments.push(...newAttachments);
    await appointment.save();

    const populatedAppointment = await Appointment.findById(req.params.id)
      .populate('department', 'title cities submissionType processingDays')
      .populate('customer', 'name phone email')
      .populate('createdBy', 'name');

    res.json({
      success: true,
      message: `تم إضافة ${newAttachments.length} مرفق بنجاح`,
      data: { appointment: populatedAppointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    حذف مرفق من موعد
// @route   DELETE /api/appointments/:id/attachments/:attachmentId
// @access  Private
exports.deleteAttachment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!checkExists(res, appointment, 'الموعد')) return;

    const attachment = appointment.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'المرفق غير موجود'
      });
    }

    // حذف الملف من القرص
    const fs = require('fs');
    const filePath = attachment.path;
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    attachment.deleteOne();
    await appointment.save();

    res.json({
      success: true,
      message: 'تم حذف المرفق بنجاح',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تغيير حالة الموعد
// @route   PUT /api/appointments/:id/status
// @access  Private
exports.changeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!checkExists(res, appointment, 'الموعد')) return;

    appointment.status = status;
    await appointment.save();

    // مزامنة حالة المهمة المرتبطة تلقائياً
    try {
      const task = await Task.findOne({ appointment: appointment._id });
      if (task) {
        if (status === 'in_progress' && task.status === 'new') {
          task.status = 'in_progress';
          task.startedAt = new Date();
          task.assignedTo = task.assignedTo || req.user.id;
          await task.save();
        } else if (status === 'completed' && task.status !== 'completed') {
          task.status = 'completed';
          task.completedAt = new Date();
          task.assignedTo = task.assignedTo || req.user.id;
          if (!task.startedAt) task.startedAt = task.completedAt;
          await task.save();
        } else if (status === 'cancelled' && task.status !== 'cancelled') {
          task.status = 'cancelled';
          task.cancelledAt = new Date();
          task.cancelReason = 'تم إلغاء الموعد';
          await task.save();
        }
      }
    } catch (taskErr) {
      console.error('Error syncing task status:', taskErr);
    }

    // مزامنة مع Google Sheets
    if (isGoogleSheetsEnabled()) {
      try {
        const populatedAppointment = await Appointment.findById(req.params.id)
          .populate('department', 'title')
          .populate('createdBy', 'name');
        await googleSheetsService.updateAppointment(populatedAppointment);
      } catch (sheetsError) {
        console.error('Error syncing status to Google Sheets:', sheetsError);
      }
    }

    res.json({
      success: true,
      message: 'تم تغيير حالة الموعد',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    جلب التقديمات الإلكترونية المتأخرة
// @route   GET /api/appointments/overdue-electronic
// @access  Private
exports.getOverdueElectronic = async (req, res, next) => {
  try {
    // جلب الأقسام الإلكترونية
    const electronicDepts = await Department.find({ submissionType: 'إلكتروني' });
    const deptMap = {};
    electronicDepts.forEach(d => { deptMap[d._id.toString()] = d; });
    const deptIds = electronicDepts.map(d => d._id);

    // جلب المواعيد الإلكترونية الغير مكتملة/ملغية
    const appointments = await Appointment.find({
      isSubmission: true,
      department: { $in: deptIds },
      status: { $nin: ['completed', 'cancelled'] }
    });

    const now = new Date();
    const overdue = [];

    for (const appt of appointments) {
      // التحقق من حالة المهمة
      const task = await Task.findOne({ appointment: appt._id, isActive: true });
      if (task && (task.status === 'completed' || task.status === 'cancelled')) continue;

      const dept = deptMap[appt.department.toString()];
      const processingDays = parseInt(dept?.processingDays) || 0;
      if (processingDays <= 0) continue;

      const apptDate = new Date(appt.appointmentDate || appt.dateFrom || appt.createdAt);
      const diffDays = Math.floor((now - apptDate) / (1000 * 60 * 60 * 24));

      if (diffDays > processingDays) {
        overdue.push({
          id: appt._id,
          customerName: appt.customerName,
          departmentTitle: dept?.title || 'غير محدد',
          daysPassed: diffDays,
          processingDays
        });
      }
    }

    res.json({ success: true, data: overdue });
  } catch (error) {
    next(error);
  }
};

// @desc    تسجيل إرسال رسالة تحديث سريع في سجل التدقيق
// @route   POST /api/appointments/:id/log-quick-update
// @access  Private
exports.logQuickUpdate = async (req, res, next) => {
  try {
    const { messageType, customerName } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!checkExists(res, appointment, 'الموعد')) return;

    const typeLabels = {
      accepted: 'تم القبول',
      rejected: 'تم الرفض',
      additionalDocs: 'مستندات إضافية',
      processingDelay: 'تأخر في المعالجة'
    };

    const label = typeLabels[messageType] || messageType;

    await AuditLog.log({
      action: 'send_message',
      entityType: 'appointment',
      entityId: appointment._id,
      entityNumber: appointment._id.toString().slice(-6).toUpperCase(),
      user: req.user,
      req,
      description: `إرسال تحديث واتساب: "${label}" - العميل: ${customerName || appointment.customerName}`,
      metadata: { messageType, customerName: customerName || appointment.customerName }
    });

    res.json({
      success: true,
      message: 'تم تسجيل الإرسال في سجل التدقيق'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على مواعيد اليوم
// @route   GET /api/appointments/today
// @access  Private
exports.getTodayAppointments = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      $or: [
        { appointmentDate: { $gte: today, $lt: tomorrow } },
        { reminderDate: { $gte: today, $lt: tomorrow } }
      ]
    })
      .populate('department', 'title')
      .populate('customer', 'name phone')
      .sort({ appointmentTime: 1 });

    res.json({
      success: true,
      data: { appointments, count: appointments.length }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إحصائيات شاملة للوحة التحكم
// @route   GET /api/appointments/dashboard-stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();

    // اليوم
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // بداية ونهاية الشهر الحالي
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // بداية ونهاية الشهر السابق
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // استعلامات التاريخ
    const todayQuery = { createdAt: { $gte: today, $lt: tomorrow } };
    const monthQuery = { createdAt: { $gte: monthStart, $lte: monthEnd } };
    const lastMonthQuery = { createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } };

    // إحصائيات العملاء
    const [
      totalCustomers,
      todayCustomers,
      monthCustomers,
      lastMonthCustomers,
      vipCustomers
    ] = await Promise.all([
      Customer.countDocuments(),
      Customer.countDocuments(todayQuery),
      Customer.countDocuments(monthQuery),
      Customer.countDocuments(lastMonthQuery),
      Customer.countDocuments({ isVIP: true })
    ]);

    // إحصائيات المواعيد
    const [
      totalAppointments,
      todayAppointments,
      monthAppointments,
      lastMonthAppointments,
      newAppointments,
      completedAppointments
    ] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({
        $or: [
          { appointmentDate: { $gte: today, $lt: tomorrow } },
          { dateFrom: { $lte: tomorrow }, dateTo: { $gte: today } },
          { reminderDate: { $gte: today, $lt: tomorrow } }
        ]
      }),
      Appointment.countDocuments(monthQuery),
      Appointment.countDocuments(lastMonthQuery),
      Appointment.countDocuments({ status: 'new' }),
      Appointment.countDocuments({ status: 'completed' })
    ]);

    // إحصائيات الأشخاص
    const [
      totalPersonsResult,
      todayPersonsResult,
      monthPersonsResult,
      lastMonthPersonsResult
    ] = await Promise.all([
      Appointment.aggregate([
        { $group: { _id: null, total: { $sum: { $ifNull: ['$personsCount', 1] } } } }
      ]),
      Appointment.aggregate([
        { $match: todayQuery },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$personsCount', 1] } } } }
      ]),
      Appointment.aggregate([
        { $match: monthQuery },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$personsCount', 1] } } } }
      ]),
      Appointment.aggregate([
        { $match: lastMonthQuery },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$personsCount', 1] } } } }
      ])
    ]);

    // أكثر الموظفين إضافة للعملاء (بالأشخاص)
    const topEmployeesByPersons = await Appointment.aggregate([
      { $match: monthQuery },
      {
        $group: {
          _id: '$createdBy',
          totalPersons: { $sum: { $ifNull: ['$personsCount', 1] } },
          appointmentsCount: { $sum: 1 }
        }
      },
      { $sort: { totalPersons: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ['$employee.name', 'غير معروف'] },
          totalPersons: 1,
          appointmentsCount: 1
        }
      }
    ]);

    // أكثر الأقسام نشاطاً
    const topDepartments = await Appointment.aggregate([
      { $match: { ...monthQuery, department: { $exists: true } } },
      {
        $group: {
          _id: '$department',
          totalPersons: { $sum: { $ifNull: ['$personsCount', 1] } },
          appointmentsCount: { $sum: 1 }
        }
      },
      { $sort: { appointmentsCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'department'
        }
      },
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          title: { $ifNull: ['$department.title', 'غير معروف'] },
          totalPersons: 1,
          appointmentsCount: 1
        }
      }
    ]);

    // إحصائيات يومية للشهر الحالي (للمخطط البياني)
    const dailyStats = await Appointment.aggregate([
      { $match: monthQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          appointments: { $sum: 1 },
          persons: { $sum: { $ifNull: ['$personsCount', 1] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // إحصائيات حسب النوع
    const byType = await Appointment.aggregate([
      { $match: monthQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          persons: { $sum: { $ifNull: ['$personsCount', 1] } }
        }
      }
    ]);

    // إحصائيات حسب الحالة
    const byStatus = await Appointment.aggregate([
      { $match: monthQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // إحصائيات التقديمات الإلكترونية
    const electronicDepts = await Department.find({ submissionType: 'إلكتروني' }).select('_id processingDays');
    const electronicDeptIds = electronicDepts.map(d => d._id);
    const electronicDeptMap = {};
    electronicDepts.forEach(d => { electronicDeptMap[d._id.toString()] = parseInt(d.processingDays) || 0; });

    const electronicBase = { isSubmission: true, department: { $in: electronicDeptIds } };

    const [electronicProcessing, electronicAcceptedMonth, electronicActiveAll] = await Promise.all([
      // قيد المعالجة: جديد أو قيد العمل
      Appointment.countDocuments({ ...electronicBase, status: { $in: ['new', 'in_progress'] } }),
      // مقبولة هذا الشهر
      Appointment.countDocuments({ ...electronicBase, status: 'completed', updatedAt: { $gte: monthStart, $lte: monthEnd } }),
      // جميع النشطة لحساب المتأخرة
      Appointment.find({ ...electronicBase, status: { $in: ['new', 'in_progress'] } })
        .select('appointmentDate dateFrom createdAt department')
        .lean()
    ]);

    // حساب المتأخرة
    const nowDate = new Date();
    let electronicOverdue = 0;
    electronicActiveAll.forEach(appt => {
      const processingDays = electronicDeptMap[appt.department?.toString()] || 0;
      if (processingDays <= 0) return;
      const apptDate = new Date(appt.appointmentDate || appt.dateFrom || appt.createdAt);
      const diffDays = Math.floor((nowDate - apptDate) / (1000 * 60 * 60 * 24));
      if (diffDays > processingDays) electronicOverdue++;
    });

    // حساب نسبة التغيير
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    res.json({
      success: true,
      data: {
        customers: {
          total: totalCustomers,
          today: todayCustomers,
          month: monthCustomers,
          vip: vipCustomers,
          monthChange: calculateChange(monthCustomers, lastMonthCustomers)
        },
        appointments: {
          total: totalAppointments,
          today: todayAppointments,
          month: monthAppointments,
          new: newAppointments,
          completed: completedAppointments,
          monthChange: calculateChange(monthAppointments, lastMonthAppointments)
        },
        persons: {
          total: totalPersonsResult[0]?.total || 0,
          today: todayPersonsResult[0]?.total || 0,
          month: monthPersonsResult[0]?.total || 0,
          monthChange: calculateChange(
            monthPersonsResult[0]?.total || 0,
            lastMonthPersonsResult[0]?.total || 0
          )
        },
        topEmployeesByPersons,
        topDepartments,
        dailyStats,
        byType: byType.reduce((acc, item) => {
          acc[item._id] = { count: item.count, persons: item.persons };
          return acc;
        }, {}),
        byStatus: byStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        electronic: {
          processing: electronicProcessing,
          overdue: electronicOverdue,
          acceptedMonth: electronicAcceptedMonth
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إحصائيات المواعيد
// @route   GET /api/appointments/stats
// @access  Private
exports.getStats = async (req, res, next) => {
  try {
    const now = new Date();

    // اليوم
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // غداً
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // بداية ونهاية الشهر
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // استعلامات التاريخ
    const todayQuery = {
      $or: [
        { appointmentDate: { $gte: today, $lt: tomorrow } },
        { dateFrom: { $lte: tomorrow }, dateTo: { $gte: today } },
        { reminderDate: { $gte: today, $lt: tomorrow } }
      ]
    };

    const tomorrowQuery = {
      $or: [
        { appointmentDate: { $gte: tomorrow, $lt: dayAfterTomorrow } },
        { dateFrom: { $lte: dayAfterTomorrow }, dateTo: { $gte: tomorrow } },
        { reminderDate: { $gte: tomorrow, $lt: dayAfterTomorrow } }
      ]
    };

    const monthQuery = {
      $or: [
        { appointmentDate: { $gte: monthStart, $lte: monthEnd } },
        { dateFrom: { $lte: monthEnd }, dateTo: { $gte: monthStart } },
        { reminderDate: { $gte: monthStart, $lte: monthEnd } }
      ]
    };

    const [
      total,
      todayCount,
      tomorrowCount,
      monthCount,
      newStatus,
      completed,
      cancelled,
      confirmed,
      unconfirmed,
      draft,
      todayAppointments,
      totalPersonsResult
    ] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments(todayQuery),
      Appointment.countDocuments(tomorrowQuery),
      Appointment.countDocuments(monthQuery),
      Appointment.countDocuments({ status: 'new' }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Appointment.countDocuments({ type: 'confirmed' }),
      Appointment.countDocuments({ type: 'unconfirmed' }),
      Appointment.countDocuments({ type: 'draft' }),
      Appointment.find(todayQuery).select('personsCount'),
      Appointment.aggregate([
        { $group: { _id: null, totalPersons: { $sum: { $ifNull: ['$personsCount', 1] } } } }
      ])
    ]);

    // حساب إجمالي الأشخاص اليوم
    const todayPersons = todayAppointments.reduce((sum, a) => sum + (a.personsCount || 1), 0);
    const totalPersons = totalPersonsResult[0]?.totalPersons || 0;

    res.json({
      success: true,
      data: {
        total,
        today: todayCount,
        tomorrow: tomorrowCount,
        month: monthCount,
        new: newStatus,
        completed,
        cancelled,
        todayPersons,
        totalPersons,
        byType: {
          confirmed,
          unconfirmed,
          draft
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إضافة دفعة جديدة لموعد
// @route   POST /api/appointments/:id/payment
// @access  Private
exports.addPayment = async (req, res, next) => {
  try {
    const { amount, paymentType } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('department', 'title');

    if (!checkExists(res, appointment, 'الموعد')) return;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال مبلغ صحيح' });
    }

    if (amount > appointment.remainingAmount) {
      return res.status(400).json({ success: false, message: 'المبلغ أكبر من المبلغ المتبقي' });
    }

    const paymentMethod = paymentType || 'cash';

    try {
      const settings = await Settings.findOne();
      const companyInfo = settings ? {
        name: settings.companyName,
        nameEn: settings.companyNameEn,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        logo: settings.logo,
        taxNumber: settings.taxNumber
      } : {};

      const receiptNumber = await Receipt.generateReceiptNumber();

      const receipt = await Receipt.create({
        receiptNumber,
        appointment: appointment._id,
        customer: appointment.customer,
        customerName: appointment.customerName,
        customerPhone: appointment.phone || '',
        amount,
        paymentMethod,
        description: `دفعة إضافية - موعد ${appointment.department?.title || ''}`,
        companyInfo,
        createdBy: req.user.id,
        status: 'active'
      });

      const cashRegister = await CashRegister.getOrCreate();
      const balanceBefore = paymentMethod === 'cash' ? cashRegister.cashBalance :
                           paymentMethod === 'card' ? cashRegister.cardBalance :
                           cashRegister.transferBalance;

      const transactionNumber = await Transaction.generateTransactionNumber();

      const transaction = await Transaction.create({
        transactionNumber,
        type: 'income',
        amount,
        description: `إيصال ${receiptNumber} - دفعة إضافية - ${appointment.customerName}`,
        category: 'appointment_payment',
        paymentMethod,
        source: 'automatic',
        sourceType: 'receipt',
        receipt: receipt._id,
        appointment: appointment._id,
        customer: appointment.customer,
        balanceBefore,
        balanceAfter: balanceBefore + amount,
        createdBy: req.user.id
      });

      receipt.transaction = transaction._id;
      await receipt.save();

      if (paymentMethod === 'cash') {
        cashRegister.cashBalance += amount;
      } else if (paymentMethod === 'card') {
        cashRegister.cardBalance += amount;
      } else {
        cashRegister.transferBalance += amount;
      }
      cashRegister.totalBalance += amount;
      await cashRegister.save();

      if (appointment.customer) {
        await Customer.findByIdAndUpdate(appointment.customer, {
          $inc: { totalSpent: amount }
        });
      }

      // تحديث المبلغ المدفوع في الموعد
      appointment.paidAmount = (appointment.paidAmount || 0) + amount;
      appointment.paymentType = paymentMethod;
      await appointment.save();

      await AuditLog.log({
        action: 'create',
        entityType: 'receipt',
        entityId: receipt._id,
        entityNumber: receiptNumber,
        user: req.user,
        changes: { after: receipt.toObject() },
        req,
        description: `إنشاء إيصال ${receiptNumber} - دفعة إضافية لموعد`
      });

      res.json({
        success: true,
        message: 'تم إضافة الدفعة بنجاح',
        data: {
          receipt,
          appointment: {
            paidAmount: appointment.paidAmount,
            remainingAmount: appointment.remainingAmount,
            totalAmount: appointment.totalAmount
          }
        }
      });
    } catch (receiptError) {
      console.error('Error creating receipt for additional payment:', receiptError);
      appointment.paidAmount = (appointment.paidAmount || 0) + amount;
      appointment.paymentType = paymentMethod;
      await appointment.save();

      res.json({
        success: true,
        message: 'تم إضافة الدفعة (بدون إيصال)',
        data: {
          appointment: {
            paidAmount: appointment.paidAmount,
            remainingAmount: appointment.remainingAmount,
            totalAmount: appointment.totalAmount
          }
        }
      });
    }
  } catch (error) {
    next(error);
  }
};
