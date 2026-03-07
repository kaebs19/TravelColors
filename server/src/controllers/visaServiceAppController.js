const AuditLog = require('../models/AuditLog');
const VisaServiceApplication = require('../models/VisaServiceApplication');
const Visa = require('../models/Visa');
const ClientProfile = require('../models/ClientProfile');
const WebsiteContent = require('../models/WebsiteContent');
const { validateCoupon } = require('../utils/couponValidator');
const { sendEmailSilent } = require('../utils/sendEmail');
const { applicationSubmittedEmail, statusUpdateEmail } = require('../utils/emailTemplates');
const { escapeRegex } = require('../utils/sanitize');

// جلب إعدادات البريد من قاعدة البيانات
const getEmailOverrides = async (templateKey) => {
  try {
    const content = await WebsiteContent.getContent();
    return content.emailSettings?.[templateKey] || {};
  } catch (e) {
    return {};
  }
};

// ============================================================
//  Client endpoints
// ============================================================

// @desc    إنشاء طلب تأشيرة إلكترونية جديد
// @route   POST /api/visa-service/applications
// @access  Private (Client)
exports.createApplication = async (req, res, next) => {
  try {
    const { visaId } = req.body;

    // التحقق من أن التأشيرة موجودة وإلكترونية
    const visa = await Visa.findById(visaId);
    if (!visa) {
      return res.status(404).json({
        success: false,
        message: 'التأشيرة غير موجودة'
      });
    }
    if (visa.visaType !== 'إلكترونية') {
      return res.status(400).json({
        success: false,
        message: 'هذه التأشيرة لا تدعم التقديم الإلكتروني'
      });
    }

    const application = await VisaServiceApplication.create({
      clientId: req.client._id,
      visaId: visa._id,
      basePrice: parseFloat(visa.offerEnabled && visa.offerPrice ? visa.offerPrice : visa.price) || 0,
      status: 'draft'
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الطلب بنجاح',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    جلب طلبات العميل
// @route   GET /api/visa-service/my-applications
// @access  Private (Client)
exports.getMyApplications = async (req, res, next) => {
  try {
    const applications = await VisaServiceApplication.find({ clientId: req.client._id })
      .populate('visaId', 'countryName countryNameEn flagImage visaType')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { applications }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    جلب طلب واحد للعميل
// @route   GET /api/visa-service/applications/:id
// @access  Private (Client)
exports.getMyApplication = async (req, res, next) => {
  try {
    const application = await VisaServiceApplication.findOne({
      _id: req.params.id,
      clientId: req.client._id
    }).populate('visaId', 'countryName countryNameEn flagImage visaType price offerEnabled offerPrice currency addons coupons requiredDocuments');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    res.json({
      success: true,
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث طلب (مسودة فقط)
// @route   PUT /api/visa-service/applications/:id
// @access  Private (Client)
exports.updateApplication = async (req, res, next) => {
  try {
    const application = await VisaServiceApplication.findOne({
      _id: req.params.id,
      clientId: req.client._id
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    if (application.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تعديل طلب تم تقديمه'
      });
    }

    // تحديث الحقول المسموحة
    const allowedFields = [
      'personalInfo', 'passportImage', 'personalPhoto',
      'documents', 'clientNotes',
      'selectedAddons', 'couponCode', 'couponDiscount',
      'basePrice', 'addonsTotal', 'totalPrice'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        application[field] = req.body[field];
      }
    });

    await application.save();

    // تسجيل التحديث في سجل التدقيق
    try {
      await AuditLog.create({
        action: 'client_update',
        entityType: 'visa_service_application',
        entityId: application._id,
        entityNumber: application.applicationNumber,
        userId: req.client._id,
        userName: req.client.name || 'عميل',
        userRole: 'client',
        description: 'قام العميل بتحديث بيانات طلب التأشيرة الإلكترونية',
        changes: { after: { updatedFields: Object.keys(req.body) } }
      });
    } catch (e) {
      console.error('Error creating audit log for client update:', e.message);
    }

    res.json({
      success: true,
      message: 'تم حفظ البيانات',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تقديم الطلب نهائياً
// @route   POST /api/visa-service/applications/:id/submit
// @access  Private (Client)
exports.submitApplication = async (req, res, next) => {
  try {
    const application = await VisaServiceApplication.findOne({
      _id: req.params.id,
      clientId: req.client._id
    }).populate('visaId', 'countryName coupons requiredDocuments');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    if (application.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'تم تقديم هذا الطلب مسبقاً'
      });
    }

    // التحقق من البيانات المطلوبة
    const info = application.personalInfo;
    if (!info.fullName || !info.phone) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إكمال البيانات الشخصية (الاسم ورقم الجوال مطلوبين)'
      });
    }

    // التحقق من المستندات المطلوبة (ديناميكي)
    const visa = await Visa.findById(application.visaId._id || application.visaId);
    if (visa && visa.requiredDocuments && visa.requiredDocuments.length > 0) {
      const requiredKeys = visa.requiredDocuments
        .filter(doc => doc.isRequired)
        .map(doc => doc.key);
      const uploadedKeys = (application.documents || [])
        .filter(doc => doc.fileUrl)
        .map(doc => doc.key);
      const missingKeys = requiredKeys.filter(key => !uploadedKeys.includes(key));
      if (missingKeys.length > 0) {
        const missingLabels = missingKeys.map(key => {
          const docDef = visa.requiredDocuments.find(d => d.key === key);
          return docDef ? docDef.label : key;
        });
        return res.status(400).json({
          success: false,
          message: `يرجى رفع المستندات المطلوبة: ${missingLabels.join('، ')}`
        });
      }
    } else {
      // Fallback للتأشيرات القديمة بدون requiredDocuments
      if (!application.passportImage) {
        return res.status(400).json({
          success: false,
          message: 'يرجى رفع صورة الجواز'
        });
      }
      if (!application.personalPhoto) {
        return res.status(400).json({
          success: false,
          message: 'يرجى رفع الصورة الشخصية'
        });
      }
    }

    // زيادة عداد استخدام الكوبون
    if (application.couponCode && application.visaId?.coupons) {
      const visa = await Visa.findById(application.visaId._id || application.visaId);
      if (visa) {
        const coupon = visa.coupons.find(c =>
          c.code.toLowerCase() === application.couponCode.toLowerCase()
        );
        if (coupon) {
          coupon.usedCount = (coupon.usedCount || 0) + 1;
          await visa.save();
        }
      }
    }

    application.status = 'submitted';
    application.submittedAt = new Date();
    await application.save();

    // تسجيل التقديم في سجل التدقيق
    try {
      await AuditLog.create({
        action: 'client_update',
        entityType: 'visa_service_application',
        entityId: application._id,
        entityNumber: application.applicationNumber,
        userId: req.client._id,
        userName: req.client.name || 'عميل',
        userRole: 'client',
        description: 'قام العميل بتقديم طلب التأشيرة الإلكترونية',
        changes: { after: { status: 'submitted' } }
      });
    } catch (e) {
      console.error('Error creating audit log for client submit:', e.message);
    }

    // إرسال بريد تأكيد التقديم
    const clientEmail = info.email || '';
    const clientName = info.fullName;
    if (clientEmail) {
      getEmailOverrides('applicationSubmitted').then(overrides => {
        const emailData = applicationSubmittedEmail(
          clientName,
          application.applicationNumber,
          'visa-service',
          overrides
        );
        sendEmailSilent({
          email: clientEmail,
          subject: emailData.subject,
          html: emailData.html
        });
      });
    }

    res.json({
      success: true,
      message: 'تم تقديم الطلب بنجاح',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    رفع ملف (جواز / صورة شخصية)
// @route   POST /api/visa-service/upload
// @access  Private (Client)
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'يرجى رفع ملف'
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'تم رفع الملف بنجاح',
      data: {
        url: fileUrl,
        fileType: req.file.mimetype,
        originalName: req.file.originalname
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  Admin endpoints
// ============================================================

// @desc    جلب جميع طلبات التأشيرة الإلكترونية
// @route   GET /api/visa-service/admin/applications
// @access  Private (Admin)
exports.getApplications = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      const escaped = escapeRegex(search);
      filter.$or = [
        { applicationNumber: { $regex: escaped, $options: 'i' } },
        { 'personalInfo.fullName': { $regex: escaped, $options: 'i' } },
        { 'personalInfo.phone': { $regex: escaped, $options: 'i' } },
        { 'personalInfo.email': { $regex: escaped, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await VisaServiceApplication.countDocuments(filter);

    const applications = await VisaServiceApplication.find(filter)
      .populate('visaId', 'countryName countryNameEn flagImage visaType')
      .populate('clientId', 'fullName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // إحصائيات
    const stats = await VisaServiceApplication.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusCounts = {};
    stats.forEach(s => { statusCounts[s._id] = s.count; });

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        },
        stats: statusCounts
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    جلب طلب واحد (أدمن)
// @route   GET /api/visa-service/admin/applications/:id
// @access  Private (Admin)
exports.getApplication = async (req, res, next) => {
  try {
    const application = await VisaServiceApplication.findById(req.params.id)
      .populate('visaId', 'countryName countryNameEn flagImage visaType price currency')
      .populate('clientId', 'fullName email phone');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    res.json({
      success: true,
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث حالة طلب
// @route   PUT /api/visa-service/admin/applications/:id/status
// @access  Private (Admin)
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    const validStatuses = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة غير صالحة'
      });
    }

    const application = await VisaServiceApplication.findById(req.params.id)
      .populate('clientId', 'fullName email phone');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    application.status = status;
    if (adminNotes !== undefined) {
      application.adminNotes = adminNotes;
    }
    await application.save();

    // إرسال بريد تحديث الحالة
    const clientEmail = application.personalInfo?.email || application.clientId?.email || '';
    const clientName = application.personalInfo?.fullName || application.clientId?.fullName || '';
    if (clientEmail) {
      getEmailOverrides('statusUpdate').then(overrides => {
        const emailData = statusUpdateEmail(
          clientName,
          application.applicationNumber,
          status,
          'visa-service',
          overrides
        );
        sendEmailSilent({
          email: clientEmail,
          subject: emailData.subject,
          html: emailData.html
        });
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث حالة الطلب',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    ربط/إلغاء ربط عميل بطلب تأشيرة إلكترونية
// @route   PUT /api/visa-service/applications/:id/link-customer
// @access  Private (Admin/Employee)
exports.linkCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.body;
    const application = await VisaServiceApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    const previousCustomer = application.customer;
    application.customer = customerId || null;
    await application.save();

    await AuditLog.create({
      action: 'link_customer',
      entityType: 'visa_service_application',
      entityId: application._id,
      entityNumber: application.applicationNumber,
      userId: req.user._id || req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      description: customerId ? 'تم ربط طلب التأشيرة الإلكترونية بعميل' : 'تم إلغاء ربط طلب التأشيرة الإلكترونية بالعميل',
      changes: { before: { customer: previousCustomer }, after: { customer: customerId || null } }
    });

    res.json({
      success: true,
      message: customerId ? 'تم ربط العميل بالطلب بنجاح' : 'تم إلغاء ربط العميل',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    حذف طلب تأشيرة إلكترونية
// @route   DELETE /api/visa-service/admin/applications/:id
// @access  Private (Admin)
exports.deleteApplication = async (req, res, next) => {
  try {
    const application = await VisaServiceApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    await AuditLog.create({
      action: 'delete',
      entityType: 'visa_service_application',
      entityId: application._id,
      entityNumber: application.applicationNumber,
      userId: req.user._id || req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      description: `تم حذف طلب التأشيرة الإلكترونية ${application.applicationNumber}`
    });

    await application.deleteOne();

    res.json({ success: true, message: 'تم حذف الطلب بنجاح' });
  } catch (error) {
    next(error);
  }
};
