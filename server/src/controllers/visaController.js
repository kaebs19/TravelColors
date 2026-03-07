const { VisaApplication, AuditLog } = require('../models');
const path = require('path');
const fs = require('fs');
const { parsePassport } = require('../services/mindeeService');
const { sendEmailSilent } = require('../utils/sendEmail');
const { applicationSubmittedEmail, statusUpdateEmail } = require('../utils/emailTemplates');
const WebsiteContent = require('../models/WebsiteContent');

// جلب إعدادات البريد من قاعدة البيانات
const getEmailOverrides = async (templateKey) => {
  try {
    const content = await WebsiteContent.getContent();
    return content.emailSettings?.[templateKey] || {};
  } catch (e) {
    return {};
  }
};

// @desc    إنشاء طلب تأشيرة جديد
// @route   POST /api/visa/applications
// @access  Public
exports.createApplication = async (req, res, next) => {
  try {
    const application = await VisaApplication.create({
      visaType: req.body.visaType || 'tourism',
      status: 'draft',
      currentStep: 1
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

// @desc    تحديث طلب (حفظ تلقائي)
// @route   PUT /api/visa/applications/:id
// @access  Public
exports.updateApplication = async (req, res, next) => {
  try {
    const application = await VisaApplication.findById(req.params.id);

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

    // تنظيف القيم الفارغة لحقول enum قبل الحفظ
    const cleanEnumFields = (data) => {
      if (data.personalInfo && data.personalInfo.maritalStatus === '') delete data.personalInfo.maritalStatus;
      if (data.travelInfo && data.travelInfo.travelPurpose === '') delete data.travelInfo.travelPurpose;
      if (data.visaType === '') delete data.visaType;
      if (data.spouseInfo && data.spouseInfo.spouseGender === '') delete data.spouseInfo.spouseGender;
      if (data.interviewSocialMedia && data.interviewSocialMedia.interviewLanguage === '') delete data.interviewSocialMedia.interviewLanguage;
      if (data.travelInfo && data.travelInfo.stayDurationType === '') delete data.travelInfo.stayDurationType;
      return data;
    };
    const body = cleanEnumFields({ ...req.body });

    // تحديث الحقول
    const allowedFields = [
      'visaType', 'currentStep', 'passportImage',
      'personalInfo', 'passportDetails', 'contactInfo',
      'travelInfo', 'financialInfo',
      'hostInfo', 'travelCompanions', 'previousUSTravel',
      'familyInfo', 'spouseInfo', 'employmentInfo',
      'educationInfo', 'travelHistoryMilitary', 'studentAdditionalInfo',
      'interviewSocialMedia', 'personalPhoto', 'declaration'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        application[field] = body[field];
      }
    });

    await application.save();

    // تسجيل التحديث في سجل التدقيق
    if (application.clientId) {
      try {
        await AuditLog.create({
          action: 'client_update',
          entityType: 'visa_application',
          entityId: application._id,
          entityNumber: application.applicationNumber,
          userId: application.clientId,
          userName: application.personalInfo?.fullName || 'عميل',
          userRole: 'client',
          description: 'قام العميل بتحديث بيانات طلب التأشيرة الأمريكية',
          changes: { after: { updatedFields: Object.keys(req.body) } }
        });
      } catch (e) {
        console.error('Error creating audit log for client update:', e.message);
      }
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

// @desc    عرض طلب واحد
// @route   GET /api/visa/applications/:id
// @access  Public (by id)
exports.getApplication = async (req, res, next) => {
  try {
    const application = await VisaApplication.findById(req.params.id);

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

// @desc    تقديم الطلب نهائياً
// @route   POST /api/visa/applications/:id/submit
// @access  Public
exports.submitApplication = async (req, res, next) => {
  try {
    const application = await VisaApplication.findById(req.params.id);

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
    if (!application.personalInfo?.fullName) missing.push('الاسم');
    if (!application.personalInfo?.maritalStatus) missing.push('الحالة الاجتماعية');
    if (!application.personalInfo?.dateOfBirth) missing.push('تاريخ الميلاد');
    if (!application.personalInfo?.nationality) missing.push('الجنسية');
    if (!application.personalInfo?.nationalId) missing.push('رقم الهوية');
    if (!application.passportDetails?.passportNumber) missing.push('رقم الجواز');
    if (!application.passportDetails?.passportIssueDate) missing.push('تاريخ إصدار الجواز');
    if (!application.passportDetails?.passportExpiryDate) missing.push('تاريخ انتهاء الجواز');

    // Contact: check arrays first, fallback to old fields
    const primaryEmail = application.contactInfo?.emails?.[0] || application.contactInfo?.email;
    const primaryPhone = application.contactInfo?.phones?.[0] || application.contactInfo?.mobilePhone;
    if (!primaryEmail) missing.push('البريد الإلكتروني');
    if (!primaryPhone) missing.push('رقم الجوال');

    if (!application.travelInfo?.expectedArrivalDate) missing.push('تاريخ الوصول');
    if (!application.travelInfo?.stayDurationNumber && !application.travelInfo?.stayDuration) missing.push('فترة الإقامة');

    // Phase 2 validations
    if (application.travelCompanions?.hasCompanions === null || application.travelCompanions?.hasCompanions === undefined) {
      missing.push('هل لديك مرافقون في السفر');
    }
    if (application.previousUSTravel?.beenToUS === null || application.previousUSTravel?.beenToUS === undefined) {
      missing.push('هل سبق لك السفر لأمريكا');
    }

    // Family: check new split fields, fallback to old fullName
    if (!application.familyInfo?.fatherFirstName && !application.familyInfo?.fatherFullName) missing.push('اسم الأب');
    if (!application.familyInfo?.motherFirstName && !application.familyInfo?.motherFullName) missing.push('اسم الأم');

    if (application.personalInfo?.maritalStatus === 'married') {
      if (!application.spouseInfo?.spouseFullName) missing.push('اسم الزوج/ة');
      if (!application.spouseInfo?.spouseDOB) missing.push('تاريخ ميلاد الزوج/ة');
      if (!application.spouseInfo?.spouseNationality) missing.push('جنسية الزوج/ة');
    }

    // Employment: conditional on isEmployed
    if (application.employmentInfo?.isEmployed === true) {
      if (!application.employmentInfo?.currentJobTitle) missing.push('المسمى الوظيفي');
      if (!application.employmentInfo?.currentEmployer) missing.push('جهة العمل');
      if (!application.employmentInfo?.employerAddress) missing.push('عنوان جهة العمل');
      if (!application.employmentInfo?.monthlySalary) missing.push('الراتب الشهري');
      if (!application.employmentInfo?.jobDescription) missing.push('وصف العمل');
      if (!application.employmentInfo?.currentJobStartDate) missing.push('تاريخ بدء العمل');
    }

    // Education: optional now
    // Countries visited: optional now

    if (!application.interviewSocialMedia?.interviewLanguage) missing.push('لغة المقابلة');
    if (!application.declaration?.declarationAccepted) missing.push('الموافقة على الإقرار');

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `يجب إكمال الحقول التالية قبل التقديم: ${missing.join('، ')}`
      });
    }

    // التحقق من صيغة البريد
    if (primaryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primaryEmail)) {
      return res.status(400).json({
        success: false,
        message: 'صيغة البريد الإلكتروني غير صحيحة'
      });
    }

    // التحقق من عدم انتهاء الجواز
    if (new Date(application.passportDetails.passportExpiryDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'جواز السفر منتهي الصلاحية'
      });
    }

    application.status = 'submitted';
    application.submittedAt = new Date();
    await application.save();

    // تسجيل التقديم في سجل التدقيق
    if (application.clientId) {
      try {
        await AuditLog.create({
          action: 'client_update',
          entityType: 'visa_application',
          entityId: application._id,
          entityNumber: application.applicationNumber,
          userId: application.clientId,
          userName: application.personalInfo?.fullName || 'عميل',
          userRole: 'client',
          description: 'قام العميل بتقديم طلب التأشيرة الأمريكية',
          changes: { after: { status: 'submitted' } }
        });
      } catch (e) {
        console.error('Error creating audit log for client submit:', e.message);
      }
    }

    // إرسال إشعار بريدي للعميل
    const clientEmail = application.contactInfo?.email || (application.contactInfo?.emails && application.contactInfo.emails[0]);
    const clientName = application.personalInfo?.fullNameEn || application.personalInfo?.fullNameAr || 'عميل';
    if (clientEmail) {
      getEmailOverrides('applicationSubmitted').then(overrides => {
        const emailData = applicationSubmittedEmail(clientName, application.applicationNumber, 'visa', overrides);
        sendEmailSilent({ email: clientEmail, subject: emailData.subject, html: emailData.html });
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

// @desc    رفع صورة الجواز
// @route   POST /api/visa/upload-passport
// @access  Public
exports.uploadPassport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'يرجى رفع صورة الجواز'
      });
    }

    // فحص MIME type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      // حذف الملف غير المسموح
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        success: false,
        message: 'نوع الملف غير مدعوم. يرجى رفع صورة أو ملف PDF (JPG, PNG, WebP, PDF)'
      });
    }

    const filePath = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'تم رفع صورة الجواز بنجاح',
      data: { path: filePath }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    رفع الصورة الشخصية
// @route   POST /api/visa/upload-photo
// @access  Public
exports.uploadPersonalPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'يرجى رفع الصورة الشخصية'
      });
    }

    const allowedMimes = ['image/jpeg', 'image/png'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        success: false,
        message: 'نوع الملف غير مدعوم. يرجى رفع صورة (JPG, PNG)'
      });
    }

    if (req.file.size > 240 * 1024) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        success: false,
        message: 'حجم الصورة يجب أن لا يتجاوز 240 كيلوبايت'
      });
    }

    const filePath = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'تم رفع الصورة الشخصية بنجاح',
      data: { path: filePath }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    قراءة بيانات الجواز بـ OCR (Mindee)
// @route   POST /api/visa/ocr-passport
// @access  Public
exports.ocrPassport = async (req, res, next) => {
  try {
    // التحقق من وجود مفتاح Mindee
    if (!process.env.MINDEE_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'خدمة قراءة الجواز غير مفعّلة حالياً'
      });
    }

    // يمكن استقبال ملف جديد أو مسار ملف موجود
    let filePath;

    if (req.file) {
      // ملف مرفوع مباشرة
      filePath = req.file.path;
    } else if (req.body.filePath) {
      // مسار ملف موجود (من رفع سابق)
      const relativePath = req.body.filePath.replace(/^\//, '');
      filePath = path.join(__dirname, '../../', relativePath);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'الملف غير موجود'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'يرجى رفع صورة الجواز أو تحديد مسار الملف'
      });
    }

    // فحص MIME type إذا ملف جديد
    if (req.file) {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedMimes.includes(req.file.mimetype)) {
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({
          success: false,
          message: 'نوع الملف غير مدعوم. يرجى رفع صورة أو PDF'
        });
      }
    }

    // استخراج البيانات عبر Mindee
    const extractedData = await parsePassport(filePath);

    res.json({
      success: true,
      message: 'تم قراءة بيانات الجواز بنجاح',
      data: extractedData
    });
  } catch (error) {
    console.error('OCR Error:', error.message);

    // أخطاء Mindee المحددة
    if (error.message?.includes('MINDEE_API_KEY')) {
      return res.status(503).json({
        success: false,
        message: 'خدمة قراءة الجواز غير مهيأة'
      });
    }

    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      return res.status(503).json({
        success: false,
        message: 'مفتاح API غير صالح'
      });
    }

    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء قراءة بيانات الجواز. يمكنك إدخال البيانات يدوياً'
    });
  }
};

// ==================== Admin Endpoints ====================

// @desc    قائمة كل الطلبات (مع فلترة)
// @route   GET /api/visa/applications
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
      query.$or = [
        { applicationNumber: { $regex: search, $options: 'i' } },
        { 'personalInfo.fullName': { $regex: search, $options: 'i' } },
        { 'passportDetails.passportNumber': { $regex: search, $options: 'i' } },
        { 'contactInfo.mobilePhone': { $regex: search, $options: 'i' } },
        { 'contactInfo.phones': { $regex: search, $options: 'i' } }
      ];
    }

    const [applications, total] = await Promise.all([
      VisaApplication.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      VisaApplication.countDocuments(query)
    ]);

    // إحصائيات سريعة
    const stats = await VisaApplication.aggregate([
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
          rejected: statsMap.rejected || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث حالة الطلب
// @route   PUT /api/visa/applications/:id/status
// @access  Private (Admin/Employee)
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    const validStatuses = ['draft', 'submitted', 'under_review', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة غير صالحة'
      });
    }

    const application = await VisaApplication.findById(req.params.id).populate('clientId', 'name email');

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
    const clientEmail = application.clientId?.email || application.contactInfo?.email || (application.contactInfo?.emails && application.contactInfo.emails[0]);
    const clientName = application.clientId?.name || application.personalInfo?.fullNameEn || 'عميل';
    if (clientEmail) {
      getEmailOverrides('statusUpdate').then(overrides => {
        const emailData = statusUpdateEmail(clientName, application.applicationNumber, status, 'visa', overrides);
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

// @desc    حذف طلب
// @route   DELETE /api/visa/applications/:id
// @access  Private (Admin)
exports.deleteApplication = async (req, res, next) => {
  try {
    const application = await VisaApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    await application.deleteOne();

    res.json({
      success: true,
      message: 'تم حذف الطلب بنجاح'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    ربط/إلغاء ربط عميل بطلب تأشيرة
// @route   PUT /api/visa/applications/:id/link-customer
// @access  Private (Admin/Employee)
exports.linkCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.body;
    const application = await VisaApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    const previousCustomer = application.customer;
    application.customer = customerId || null;
    await application.save();

    await AuditLog.create({
      action: 'link_customer',
      entityType: 'visa_application',
      entityId: application._id,
      entityNumber: application.applicationNumber,
      userId: req.user._id || req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      description: customerId ? 'تم ربط طلب التأشيرة الأمريكية بعميل' : 'تم إلغاء ربط طلب التأشيرة بالعميل',
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
