const AuditLog = require('../models/AuditLog');
const LicenseApplication = require('../models/LicenseApplication');
const WebsiteContent = require('../models/WebsiteContent');
const ClientProfile = require('../models/ClientProfile');
const fs = require('fs');
const path = require('path');
const { sendEmailSilent } = require('../utils/sendEmail');
const { applicationSubmittedEmail, statusUpdateEmail } = require('../utils/emailTemplates');
const { parsePassport } = require('../services/mindeeService');
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

// @desc    إنشاء طلب رخصة دولية جديد
// @route   POST /api/license/applications
// @access  Private (Client)
exports.createApplication = async (req, res, next) => {
  try {
    const application = await LicenseApplication.create({
      clientId: req.client._id,
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

// @desc    جلب جميع طلبات الرخصة للعميل
// @route   GET /api/license/my-applications
// @access  Private (Client)
exports.getMyApplications = async (req, res, next) => {
  try {
    const applications = await LicenseApplication.find({ clientId: req.client._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { applications }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    جلب طلب رخصة واحد للعميل
// @route   GET /api/license/applications/:id
// @access  Private (Client)
exports.getMyApplication = async (req, res, next) => {
  try {
    const application = await LicenseApplication.findOne({
      _id: req.params.id,
      clientId: req.client._id
    });

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

// @desc    تحديث طلب رخصة (مسودة فقط)
// @route   PUT /api/license/applications/:id
// @access  Private (Client)
exports.updateApplication = async (req, res, next) => {
  try {
    const application = await LicenseApplication.findOne({
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

    const allowedFields = ['personalInfo', 'licenseImage', 'passportImage', 'personalPhoto', 'selectedAddons', 'couponCode', 'couponDiscount', 'basePrice', 'addonsTotal', 'deliveryPrice', 'totalPrice', 'deliveryMethod', 'shippingAddress'];

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
        entityType: 'license_application',
        entityId: application._id,
        entityNumber: application.applicationNumber,
        userId: req.client._id,
        userName: req.client.name || 'عميل',
        userRole: 'client',
        description: 'قام العميل بتحديث بيانات طلب الرخصة الدولية',
        changes: { after: { updatedFields: Object.keys(req.body) } }
      });
    } catch (e) {
      console.error('Error creating audit log for client update:', e.message);
    }

    res.json({
      success: true,
      message: 'تم حفظ التغييرات',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تقديم طلب الرخصة نهائياً
// @route   POST /api/license/applications/:id/submit
// @access  Private (Client)
exports.submitApplication = async (req, res, next) => {
  try {
    const application = await LicenseApplication.findOne({
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
        message: 'تم تقديم هذا الطلب مسبقاً'
      });
    }

    // التحقق من اكتمال البيانات الأساسية
    const missing = [];
    if (!application.personalInfo?.familyName) missing.push('اسم العائلة');
    if (!application.personalInfo?.givenName) missing.push('الاسم الأول');
    if (!application.personalInfo?.nationalId) missing.push('رقم الهوية');
    if (!application.personalInfo?.phone) missing.push('رقم الجوال');
    if (!application.licenseImage) missing.push('صورة رخصة القيادة');
    if (!application.passportImage) missing.push('صورة الجواز');
    if (!application.personalPhoto) missing.push('الصورة الشخصية');
    if (!application.deliveryMethod) missing.push('طريقة التسليم');

    // التحقق من بيانات الشحن
    if (application.deliveryMethod === 'shipping') {
      const addr = application.shippingAddress;
      if (!addr?.city) missing.push('المدينة (العنوان الوطني)');
      if (!addr?.district) missing.push('الحي (العنوان الوطني)');
      if (!addr?.streetName) missing.push('الشارع (العنوان الوطني)');
    }

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `يجب إكمال الحقول التالية قبل التقديم: ${missing.join('، ')}`
      });
    }

    // التحقق من تفرد رقم الجوال (عميل مختلف لا يمكنه استخدام نفس الرقم)
    if (application.personalInfo?.phone) {
      const existingApp = await LicenseApplication.findOne({
        'personalInfo.phone': application.personalInfo.phone,
        clientId: { $ne: req.client._id },
        status: { $nin: ['draft'] }
      });
      if (existingApp) {
        return res.status(400).json({
          success: false,
          message: 'رقم الجوال مستخدم في طلب لعميل آخر. يرجى استخدام رقم مختلف'
        });
      }
    }

    application.status = 'submitted';
    await application.save();

    // تسجيل التقديم في سجل التدقيق
    try {
      await AuditLog.create({
        action: 'client_update',
        entityType: 'license_application',
        entityId: application._id,
        entityNumber: application.applicationNumber,
        userId: req.client._id,
        userName: req.client.name || 'عميل',
        userRole: 'client',
        description: 'قام العميل بتقديم طلب الرخصة الدولية',
        changes: { after: { status: 'submitted' } }
      });
    } catch (e) {
      console.error('Error creating audit log for client submit:', e.message);
    }

    // حفظ البيانات الشخصية في حساب العميل تلقائياً
    try {
      const profileUpdates = {};
      if (application.personalInfo?.address && !req.client.address) {
        profileUpdates.address = application.personalInfo.address;
      }
      if (application.personalInfo?.nationalId && !req.client.nationalId) {
        profileUpdates.nationalId = application.personalInfo.nationalId;
      }
      if (application.shippingAddress?.city && !req.client.shippingAddress?.city) {
        profileUpdates.shippingAddress = application.shippingAddress;
      }
      if (application.personalInfo?.phone && !req.client.phone) {
        profileUpdates.phone = application.personalInfo.phone;
      }
      if (Object.keys(profileUpdates).length > 0) {
        await ClientProfile.findByIdAndUpdate(req.client._id, profileUpdates);
      }
    } catch (e) {
      console.error('Failed to save profile data from application:', e.message);
    }

    // إرسال إشعار بريدي للعميل
    const clientEmail = application.personalInfo?.email;
    const clientName = [application.personalInfo?.givenName, application.personalInfo?.familyName].filter(Boolean).join(' ') || 'عميل';
    if (clientEmail) {
      getEmailOverrides('applicationSubmitted').then(overrides => {
        const emailData = applicationSubmittedEmail(clientName, application.applicationNumber, 'license', overrides);
        sendEmailSilent({ email: clientEmail, subject: emailData.subject, html: emailData.html });
      });
    }

    // زيادة عداد استخدام الكوبون إذا تم استخدام كوبون
    if (application.couponCode) {
      try {
        await WebsiteContent.updateOne(
          { key: 'main', 'internationalLicense.coupons.code': application.couponCode },
          { $inc: { 'internationalLicense.coupons.$.usedCount': 1 } }
        );
      } catch (e) {
        // لا نوقف العملية لو فشل تحديث الكوبون
        console.error('Failed to increment coupon usage:', e);
      }
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

// @desc    رفع ملف (صورة رخصة / جواز / شخصية)
// @route   POST /api/license/upload
// @access  Private (Client)
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'يرجى رفع ملف'
      });
    }

    // فحص MIME type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        success: false,
        message: 'نوع الملف غير مدعوم. يرجى رفع صورة أو ملف PDF (JPG, PNG, WebP, PDF)'
      });
    }

    const filePath = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'تم رفع الملف بنجاح',
      data: { path: filePath }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    التحقق من كوبون الخصم
// @route   POST /api/license/validate-coupon
// @access  Private (Client)
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال كود الكوبون'
      });
    }

    const content = await WebsiteContent.getContent();
    const coupons = content.internationalLicense?.coupons || [];

    const coupon = coupons.find(c =>
      c.code.toLowerCase() === code.trim().toLowerCase() && c.enabled
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'كود الكوبون غير صالح'
      });
    }

    // فحص تاريخ الانتهاء
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'كود الكوبون منتهي الصلاحية'
      });
    }

    // فحص عدد الاستخدامات
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({
        success: false,
        message: 'تم استخدام هذا الكوبون الحد الأقصى من المرات'
      });
    }

    res.json({
      success: true,
      message: 'كود الكوبون صالح',
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    قراءة بيانات الجواز بالـ OCR
// @route   POST /api/license/ocr-passport
// @access  Private (Client)
exports.ocrPassport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'يرجى رفع صورة الجواز' });
    }

    const filePath = path.resolve(req.file.path);
    const extractedData = await parsePassport(filePath);

    res.json({
      success: true,
      message: 'تم قراءة بيانات الجواز بنجاح',
      data: {
        familyName: extractedData.personalInfo.lastName || '',
        givenName: extractedData.personalInfo.firstName || '',
        dateOfBirth: extractedData.personalInfo.dateOfBirth || '',
        nationality: extractedData.personalInfo.nationality || '',
        placeOfBirth: extractedData.personalInfo.birthPlace || '',
      }
    });
  } catch (error) {
    console.error('[License OCR] Error:', error.message);
    res.status(500).json({ success: false, message: 'فشل في قراءة بيانات الجواز' });
  }
};

// ==================== Admin Endpoints ====================

// @desc    جلب طلب رخصة واحد (أدمن)
// @route   GET /api/license/admin/applications/:id
// @access  Private (Admin/Employee)
exports.getApplication = async (req, res, next) => {
  try {
    const application = await LicenseApplication.findById(req.params.id)
      .populate('clientId', 'name email phone');

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

// @desc    قائمة كل طلبات الرخصة (مع فلترة وبحث)
// @route   GET /api/license/admin/applications
// @access  Private (Admin/Employee)
exports.getApplications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, sort = '-createdAt' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      const escaped = escapeRegex(search);
      query.$or = [
        { applicationNumber: { $regex: escaped, $options: 'i' } },
        { 'personalInfo.familyName': { $regex: escaped, $options: 'i' } },
        { 'personalInfo.givenName': { $regex: escaped, $options: 'i' } },
        { 'personalInfo.nationalId': { $regex: escaped, $options: 'i' } },
        { 'personalInfo.phone': { $regex: escaped, $options: 'i' } }
      ];
    }

    const [applications, total] = await Promise.all([
      LicenseApplication.find(query)
        .populate('clientId', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      LicenseApplication.countDocuments(query)
    ]);

    // إحصائيات سريعة
    const stats = await LicenseApplication.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsMap = {};
    stats.forEach(s => { statsMap[s._id] = s.count; });

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        },
        stats: {
          total: Object.values(statsMap).reduce((a, b) => a + b, 0),
          draft: statsMap.draft || 0,
          submitted: statsMap.submitted || 0,
          under_review: statsMap.under_review || 0,
          approved: statsMap.approved || 0,
          rejected: statsMap.rejected || 0,
          completed: statsMap.completed || 0,
          received: statsMap.received || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث حالة طلب الرخصة
// @route   PUT /api/license/admin/applications/:id/status
// @access  Private (Admin/Employee)
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    const validStatuses = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'completed', 'received'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة غير صالحة'
      });
    }

    const application = await LicenseApplication.findById(req.params.id).populate('clientId', 'name email');

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

    // إرسال إشعار تحديث الحالة للعميل
    const clientEmail = application.clientId?.email || application.personalInfo?.email;
    const clientName = application.clientId?.name || [application.personalInfo?.givenName, application.personalInfo?.familyName].filter(Boolean).join(' ') || 'عميل';
    if (clientEmail) {
      getEmailOverrides('statusUpdate').then(overrides => {
        const emailData = statusUpdateEmail(clientName, application.applicationNumber, status, 'license', overrides);
        sendEmailSilent({ email: clientEmail, subject: emailData.subject, html: emailData.html });
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

// @desc    ربط/إلغاء ربط عميل بطلب رخصة دولية
// @route   PUT /api/license/applications/:id/link-customer
// @access  Private (Admin/Employee)
exports.linkCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.body;
    const application = await LicenseApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    const previousCustomer = application.customer;
    application.customer = customerId || null;
    await application.save();

    await AuditLog.create({
      action: 'link_customer',
      entityType: 'license_application',
      entityId: application._id,
      entityNumber: application.applicationNumber,
      userId: req.user._id || req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      description: customerId ? 'تم ربط طلب الرخصة الدولية بعميل' : 'تم إلغاء ربط طلب الرخصة الدولية بالعميل',
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
