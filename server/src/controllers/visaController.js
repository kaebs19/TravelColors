const { VisaApplication, AuditLog } = require('../models');
const path = require('path');
const fs = require('fs');
const { parsePassport } = require('../services/mindeeService');
const { sendEmailSilent } = require('../utils/sendEmail');
const { statusUpdateEmail } = require('../utils/emailTemplates');
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

// @desc    قراءة بيانات الجواز بـ OCR (Mindee V2)
// @route   POST /api/visa/ocr-passport
// @access  Private (Client)
exports.ocrPassport = async (req, res, next) => {
  try {
    // التحقق من إعدادات Mindee V2 (المفتاح + معرّف النموذج)
    if (!process.env.MINDEE_API_KEY || !process.env.MINDEE_MODEL_ID) {
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

// @desc    عرض طلب واحد (للإدارة)
// @route   GET /api/visa/applications/:id
// @access  Private (Admin/Employee)
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
