const { Note, Customer, Appointment } = require('../models');

// @desc    الحصول على جميع المسودات
// @route   GET /api/notes
// @access  Private
exports.getNotes = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, visibility, status, priority } = req.query;

    const query = { isActive: true };

    // المسودات الخاصة تظهر فقط لمنشئها، والعامة للجميع
    query.$or = [
      { visibility: 'public' },
      { createdBy: req.user.id }
    ];

    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { customerName: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } },
          { title: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (visibility) {
      query.visibility = visibility;
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    const total = await Note.countDocuments(query);
    const notes = await Note.find(query)
      .populate('customer', 'name phone email')
      .populate('department', 'title')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        notes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على مسودة واحدة
// @route   GET /api/notes/:id
// @access  Private
exports.getNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('customer', 'name phone email')
      .populate('department', 'title')
      .populate('createdBy', 'name');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'المسودة غير موجودة'
      });
    }

    // التحقق من صلاحية الوصول
    if (note.visibility === 'private' && note.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بالوصول لهذه المسودة'
      });
    }

    res.json({
      success: true,
      data: { note }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إنشاء مسودة جديدة
// @route   POST /api/notes
// @access  Private
exports.createNote = async (req, res, next) => {
  try {
    const {
      customerName,
      customer,
      phone,
      title,
      notes,
      visibility,
      priority,
      reminderEnabled,
      reminderDate,
      reminderTime,
      department
    } = req.body;

    // إضافة العميل تلقائياً إذا لم يكن موجوداً
    let customerId = customer || null;
    if (!customer && customerName && phone) {
      try {
        let existingCustomer = await Customer.findOne({ phone: phone });
        if (existingCustomer) {
          customerId = existingCustomer._id;
        } else {
          const newCustomer = await Customer.create({
            name: customerName,
            phone: phone,
            createdBy: req.user.id
          });
          customerId = newCustomer._id;
        }
      } catch (customerError) {
        console.error('Error creating customer:', customerError);
      }
    }

    const noteData = {
      customerName,
      customer: customerId,
      phone,
      title: title || '',
      notes: notes || '',
      visibility: visibility || 'private',
      priority: priority || 'medium',
      reminderEnabled: reminderEnabled !== false,
      department: department || undefined,
      createdBy: req.user.id
    };

    if (reminderEnabled !== false && reminderDate) {
      noteData.reminderDate = reminderDate;
      noteData.reminderTime = reminderTime || '08:00';
    }

    const note = await Note.create(noteData);

    const populatedNote = await Note.findById(note._id)
      .populate('customer', 'name phone email')
      .populate('department', 'title')
      .populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المسودة بنجاح',
      data: { note: populatedNote }
    });
  } catch (error) {
    console.error('Error in createNote:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'حدث خطأ أثناء إنشاء المسودة'
    });
  }
};

// @desc    تحديث مسودة
// @route   PUT /api/notes/:id
// @access  Private
exports.updateNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'المسودة غير موجودة'
      });
    }

    // التحقق من صلاحية التعديل
    if (note.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بتعديل هذه المسودة'
      });
    }

    const {
      customerName,
      customer,
      phone,
      title,
      notes,
      visibility,
      priority,
      reminderEnabled,
      reminderDate,
      reminderTime,
      status,
      action,
      actionNotes,
      department
    } = req.body;

    if (customerName) note.customerName = customerName;
    if (customer !== undefined) note.customer = customer || null;
    if (phone !== undefined) note.phone = phone;
    if (title !== undefined) note.title = title;
    if (notes !== undefined) note.notes = notes;
    if (visibility) note.visibility = visibility;
    if (priority) note.priority = priority;
    if (reminderEnabled !== undefined) note.reminderEnabled = reminderEnabled;
    if (reminderDate) note.reminderDate = reminderDate;
    if (reminderTime) note.reminderTime = reminderTime;
    if (status) note.status = status;
    if (action) note.action = action;
    if (actionNotes !== undefined) note.actionNotes = actionNotes;
    if (department !== undefined) note.department = department || null;

    await note.save();

    const updatedNote = await Note.findById(note._id)
      .populate('customer', 'name phone email')
      .populate('department', 'title')
      .populate('createdBy', 'name');

    res.json({
      success: true,
      message: 'تم تحديث المسودة بنجاح',
      data: { note: updatedNote }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    حذف مسودة
// @route   DELETE /api/notes/:id
// @access  Private
exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'المسودة غير موجودة'
      });
    }

    // التحقق من صلاحية الحذف
    if (note.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بحذف هذه المسودة'
      });
    }

    await Note.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'تم حذف المسودة بنجاح'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تحويل مسودة لموعد
// @route   POST /api/notes/:id/convert
// @access  Private
exports.convertToAppointment = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'المسودة غير موجودة'
      });
    }

    const {
      type,
      appointmentDate,
      appointmentTime,
      duration,
      dateFrom,
      dateTo,
      department,
      city
    } = req.body;

    // إنشاء الموعد
    const appointmentData = {
      type: type || 'confirmed',
      customerName: note.customerName,
      customer: note.customer,
      phone: note.phone,
      notes: note.notes,
      department,
      city: city || 'الرياض',
      createdBy: req.user.id
    };

    if (type === 'confirmed') {
      appointmentData.appointmentDate = appointmentDate;
      appointmentData.appointmentTime = appointmentTime || '08:00';
      appointmentData.duration = duration || 5;
    } else if (type === 'unconfirmed') {
      appointmentData.dateFrom = dateFrom;
      appointmentData.dateTo = dateTo;
    }

    const appointment = await Appointment.create(appointmentData);

    // تحديث حالة المسودة
    note.status = 'completed';
    note.action = 'converted';
    note.actionNotes = `تم التحويل لموعد: ${appointment._id}`;
    await note.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('department', 'title cities')
      .populate('customer', 'name phone email')
      .populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'تم تحويل المسودة لموعد بنجاح',
      data: { appointment: populatedAppointment }
    });
  } catch (error) {
    console.error('Error converting note to appointment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'حدث خطأ أثناء تحويل المسودة'
    });
  }
};

// @desc    تغيير حالة المسودة
// @route   PUT /api/notes/:id/status
// @access  Private
exports.changeStatus = async (req, res, next) => {
  try {
    const { status, action, actionNotes } = req.body;
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'المسودة غير موجودة'
      });
    }

    if (status) note.status = status;
    if (action) note.action = action;
    if (actionNotes !== undefined) note.actionNotes = actionNotes;

    await note.save();

    res.json({
      success: true,
      message: 'تم تغيير حالة المسودة',
      data: { note }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على تذكيرات اليوم
// @route   GET /api/notes/today
// @access  Private
exports.getTodayReminders = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const notes = await Note.find({
      reminderEnabled: true,
      reminderDate: { $gte: today, $lt: tomorrow },
      status: 'active',
      isActive: true,
      $or: [
        { visibility: 'public' },
        { createdBy: req.user.id }
      ]
    })
      .populate('customer', 'name phone')
      .populate('createdBy', 'name')
      .sort({ reminderTime: 1 });

    res.json({
      success: true,
      data: { notes, count: notes.length }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إحصائيات المسودات
// @route   GET /api/notes/stats
// @access  Private
exports.getStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const baseQuery = {
      isActive: true,
      $or: [
        { visibility: 'public' },
        { createdBy: req.user.id }
      ]
    };

    const [total, active, completed, todayReminders, publicCount, privateCount] = await Promise.all([
      Note.countDocuments(baseQuery),
      Note.countDocuments({ ...baseQuery, status: 'active' }),
      Note.countDocuments({ ...baseQuery, status: 'completed' }),
      Note.countDocuments({
        ...baseQuery,
        reminderEnabled: true,
        reminderDate: { $gte: today, $lt: tomorrow },
        status: 'active'
      }),
      Note.countDocuments({ ...baseQuery, visibility: 'public' }),
      Note.countDocuments({ ...baseQuery, visibility: 'private' })
    ]);

    res.json({
      success: true,
      data: {
        total,
        active,
        completed,
        todayReminders,
        byVisibility: {
          public: publicCount,
          private: privateCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
