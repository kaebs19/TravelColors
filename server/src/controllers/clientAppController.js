const { VisaApplication } = require('../models');

// الحقول المشتركة التي تُنسخ عند إضافة فرد عائلة
const SHARED_FIELDS = [
  'visaType',
  'contactInfo',
  'travelInfo',
  'financialInfo',
  'hostInfo',
  'familyInfo',
  'interviewSocialMedia'
];

// الحقول الشخصية التي لا تُنسخ
const PERSONAL_FIELDS_TO_CLEAR = {
  personalInfo: {},
  passportDetails: {},
  passportImage: null,
  personalPhoto: null,
  spouseInfo: {},
  employmentInfo: {},
  educationInfo: {},
  travelHistoryMilitary: {},
  studentAdditionalInfo: {},
  declaration: {},
  travelCompanions: {}
};

// @desc    قائمة طلبات العميل
// @route   GET /api/client/applications
// @access  Private (Client)
exports.getMyApplications = async (req, res, next) => {
  try {
    const applications = await VisaApplication.find({ clientId: req.client._id })
      .sort('-updatedAt')
      .lean();

    // إحصائيات سريعة
    const stats = {
      total: applications.length,
      draft: 0,
      submitted: 0,
      under_review: 0,
      approved: 0,
      rejected: 0
    };

    applications.forEach(app => {
      if (stats[app.status] !== undefined) {
        stats[app.status]++;
      }
    });

    res.json({
      success: true,
      data: { applications, stats }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    عرض طلب واحد (خاص بالعميل)
// @route   GET /api/client/applications/:id
// @access  Private (Client)
exports.getMyApplication = async (req, res, next) => {
  try {
    const application = await VisaApplication.findOne({
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

// @desc    إنشاء طلب جديد
// @route   POST /api/client/applications
// @access  Private (Client)
exports.createApplication = async (req, res, next) => {
  try {
    const { visaType, copyFrom } = req.body;

    let applicationData = {
      clientId: req.client._id,
      visaType: visaType || 'tourism',
      status: 'draft',
      currentStep: 1
    };

    // نسخ بيانات من طلب سابق (إضافة فرد عائلة)
    if (copyFrom) {
      const sourceApp = await VisaApplication.findOne({
        _id: copyFrom,
        clientId: req.client._id
      }).lean();

      if (sourceApp) {
        // نسخ الحقول المشتركة
        SHARED_FIELDS.forEach(field => {
          if (sourceApp[field]) {
            applicationData[field] = sourceApp[field];
          }
        });

        // تفريغ الحقول الشخصية
        Object.entries(PERSONAL_FIELDS_TO_CLEAR).forEach(([field, defaultVal]) => {
          applicationData[field] = defaultVal;
        });

        // البدء من الخطوة 2 (تخطي صورة الجواز لأنها شخصية)
        applicationData.currentStep = 2;
      }
    }

    const application = await VisaApplication.create(applicationData);

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
// @route   PUT /api/client/applications/:id
// @access  Private (Client)
exports.updateApplication = async (req, res, next) => {
  try {
    const application = await VisaApplication.findOne({
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

    // تنظيف القيم الفارغة لحقول enum
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

    // تحديث الحقول المسموحة
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

    res.json({
      success: true,
      message: 'تم حفظ التغييرات',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تقديم الطلب نهائياً
// @route   POST /api/client/applications/:id/submit
// @access  Private (Client)
exports.submitApplication = async (req, res, next) => {
  try {
    const application = await VisaApplication.findOne({
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
    if (!application.personalInfo?.fullName) missing.push('الاسم');
    if (!application.personalInfo?.maritalStatus) missing.push('الحالة الاجتماعية');
    if (!application.personalInfo?.dateOfBirth) missing.push('تاريخ الميلاد');
    if (!application.personalInfo?.nationality) missing.push('الجنسية');
    if (!application.personalInfo?.nationalId) missing.push('رقم الهوية');
    if (!application.passportDetails?.passportNumber) missing.push('رقم الجواز');
    if (!application.passportDetails?.passportIssueDate) missing.push('تاريخ إصدار الجواز');
    if (!application.passportDetails?.passportExpiryDate) missing.push('تاريخ انتهاء الجواز');

    const primaryEmail = application.contactInfo?.emails?.[0] || application.contactInfo?.email;
    const primaryPhone = application.contactInfo?.phones?.[0] || application.contactInfo?.mobilePhone;
    if (!primaryEmail) missing.push('البريد الإلكتروني');
    if (!primaryPhone) missing.push('رقم الجوال');

    if (!application.travelInfo?.expectedArrivalDate) missing.push('تاريخ الوصول');
    if (!application.travelInfo?.stayDurationNumber && !application.travelInfo?.stayDuration) missing.push('فترة الإقامة');

    if (application.travelCompanions?.hasCompanions === null || application.travelCompanions?.hasCompanions === undefined) {
      missing.push('هل لديك مرافقون في السفر');
    }
    if (application.previousUSTravel?.beenToUS === null || application.previousUSTravel?.beenToUS === undefined) {
      missing.push('هل سبق لك السفر لأمريكا');
    }

    if (!application.familyInfo?.fatherFirstName && !application.familyInfo?.fatherFullName) missing.push('اسم الأب');
    if (!application.familyInfo?.motherFirstName && !application.familyInfo?.motherFullName) missing.push('اسم الأم');

    if (application.personalInfo?.maritalStatus === 'married') {
      if (!application.spouseInfo?.spouseFullName) missing.push('اسم الزوج/ة');
      if (!application.spouseInfo?.spouseDOB) missing.push('تاريخ ميلاد الزوج/ة');
      if (!application.spouseInfo?.spouseNationality) missing.push('جنسية الزوج/ة');
    }

    if (application.employmentInfo?.isEmployed === true) {
      if (!application.employmentInfo?.currentJobTitle) missing.push('المسمى الوظيفي');
      if (!application.employmentInfo?.currentEmployer) missing.push('جهة العمل');
      if (!application.employmentInfo?.employerAddress) missing.push('عنوان جهة العمل');
      if (!application.employmentInfo?.monthlySalary) missing.push('الراتب الشهري');
      if (!application.employmentInfo?.jobDescription) missing.push('وصف العمل');
      if (!application.employmentInfo?.currentJobStartDate) missing.push('تاريخ بدء العمل');
    }

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

    res.json({
      success: true,
      message: 'تم تقديم الطلب بنجاح',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    حذف مسودة (draft فقط)
// @route   DELETE /api/client/applications/:id
// @access  Private (Client)
exports.deleteApplication = async (req, res, next) => {
  try {
    const application = await VisaApplication.findOne({
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
        message: 'لا يمكن حذف طلب تم تقديمه'
      });
    }

    await application.deleteOne();

    res.json({
      success: true,
      message: 'تم حذف المسودة بنجاح'
    });
  } catch (error) {
    next(error);
  }
};
