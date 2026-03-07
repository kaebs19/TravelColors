const mongoose = require('mongoose');
const Visa = require('../models/Visa');
const Department = require('../models/Department');
const { validateCoupon } = require('../utils/couponValidator');
const fs = require('fs');
const path = require('path');

// ============================================================
//  Public endpoints
// ============================================================

// @desc    جلب جميع التأشيرات النشطة
// @route   GET /api/visa-catalog
// @access  Public
exports.getVisas = async (req, res, next) => {
  try {
    const visas = await Visa.find({ isActive: true })
      .populate('department', 'title cities submissionType processingDays')
      .sort({ sortOrder: 1, createdAt: -1 });

    res.json({
      success: true,
      data: { visas }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    جلب تأشيرة واحدة بالـ slug
// @route   GET /api/visa-catalog/:slug
// @access  Public
exports.getVisaBySlug = async (req, res, next) => {
  try {
    const param = req.params.slug;
    const isObjectId = mongoose.Types.ObjectId.isValid(param) && /^[0-9a-fA-F]{24}$/.test(param);

    let visa;
    if (isObjectId) {
      // Try by _id first, then by slug as fallback
      visa = await Visa.findOne({ _id: param, isActive: true })
        .populate('department', 'title cities submissionType processingDays requirements');
      if (!visa) {
        visa = await Visa.findOne({ slug: param, isActive: true })
          .populate('department', 'title cities submissionType processingDays requirements');
      }
    } else {
      visa = await Visa.findOne({ slug: param, isActive: true })
        .populate('department', 'title cities submissionType processingDays requirements');
    }

    if (!visa) {
      return res.status(404).json({
        success: false,
        message: 'التأشيرة غير موجودة'
      });
    }

    res.json({
      success: true,
      data: { visa }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    التحقق من كوبون خصم لتأشيرة
// @route   POST /api/visa-catalog/validate-coupon
// @access  Public
exports.validateVisaCoupon = async (req, res, next) => {
  try {
    const { visaId, code } = req.body;

    if (!visaId) {
      return res.status(400).json({
        success: false,
        message: 'معرّف التأشيرة مطلوب'
      });
    }

    const visa = await Visa.findById(visaId);
    if (!visa) {
      return res.status(404).json({
        success: false,
        message: 'التأشيرة غير موجودة'
      });
    }

    const result = validateCoupon(visa.coupons, code);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      message: result.message,
      data: result.coupon
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  Admin endpoints
// ============================================================

// @desc    جلب جميع التأشيرات (بما فيها المعطلة)
// @route   GET /api/visa-catalog/admin/all
// @access  Private (Admin)
exports.getAllVisas = async (req, res, next) => {
  try {
    const visas = await Visa.find()
      .populate('department', 'title')
      .populate('createdBy', 'name')
      .sort({ sortOrder: 1, createdAt: -1 });

    res.json({
      success: true,
      data: { visas }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إنشاء تأشيرة جديدة
// @route   POST /api/visa-catalog/admin
// @access  Private (Admin)
exports.createVisa = async (req, res, next) => {
  try {
    const data = req.body;

    // Parse JSON fields sent from FormData
    if (typeof data.requirements === 'string') {
      try { data.requirements = JSON.parse(data.requirements); } catch(e) { data.requirements = []; }
    }
    if (typeof data.coupons === 'string') {
      try { data.coupons = JSON.parse(data.coupons); } catch(e) { data.coupons = []; }
    }
    if (typeof data.addons === 'string') {
      try { data.addons = JSON.parse(data.addons); } catch(e) { data.addons = []; }
    }
    if (typeof data.requiredDocuments === 'string') {
      try { data.requiredDocuments = JSON.parse(data.requiredDocuments); } catch(e) { data.requiredDocuments = []; }
    }
    if (typeof data.keywords === 'string') {
      try { data.keywords = JSON.parse(data.keywords); } catch(e) { data.keywords = []; }
    }

    // تنظيف department فارغ لتجنب خطأ BSONError
    if (!data.department || data.department === '') {
      delete data.department;
    }

    data.createdBy = req.user._id;

    const visa = await Visa.create(data);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء التأشيرة بنجاح',
      data: { visa }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'يوجد تأشيرة بنفس الاسم الإنجليزي (slug مكرر)'
      });
    }
    next(error);
  }
};

// @desc    تحديث تأشيرة
// @route   PUT /api/visa-catalog/admin/:id
// @access  Private (Admin)
exports.updateVisa = async (req, res, next) => {
  try {
    const data = req.body;

    // Parse JSON fields
    if (typeof data.requirements === 'string') {
      try { data.requirements = JSON.parse(data.requirements); } catch(e) {}
    }
    if (typeof data.coupons === 'string') {
      try { data.coupons = JSON.parse(data.coupons); } catch(e) {}
    }
    if (typeof data.addons === 'string') {
      try { data.addons = JSON.parse(data.addons); } catch(e) {}
    }
    if (typeof data.requiredDocuments === 'string') {
      try { data.requiredDocuments = JSON.parse(data.requiredDocuments); } catch(e) {}
    }
    if (typeof data.keywords === 'string') {
      try { data.keywords = JSON.parse(data.keywords); } catch(e) {}
    }

    // تنظيف department فارغ
    if (!data.department || data.department === '') {
      data.department = null;
    }

    const visa = await Visa.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: true }
    );

    if (!visa) {
      return res.status(404).json({
        success: false,
        message: 'التأشيرة غير موجودة'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث التأشيرة بنجاح',
      data: { visa }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'يوجد تأشيرة بنفس الاسم الإنجليزي (slug مكرر)'
      });
    }
    next(error);
  }
};

// @desc    حذف تأشيرة
// @route   DELETE /api/visa-catalog/admin/:id
// @access  Private (Admin)
exports.deleteVisa = async (req, res, next) => {
  try {
    const visa = await Visa.findById(req.params.id);

    if (!visa) {
      return res.status(404).json({
        success: false,
        message: 'التأشيرة غير موجودة'
      });
    }

    // حذف صور التأشيرة من السيرفر
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (visa.flagImage) {
      const flagPath = path.join(uploadsDir, path.basename(visa.flagImage));
      if (fs.existsSync(flagPath)) fs.unlinkSync(flagPath);
    }
    if (visa.coverImage) {
      const coverPath = path.join(uploadsDir, path.basename(visa.coverImage));
      if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
    }

    await visa.deleteOne();

    res.json({
      success: true,
      message: 'تم حذف التأشيرة بنجاح'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تفعيل / تعطيل تأشيرة
// @route   PUT /api/visa-catalog/admin/:id/toggle
// @access  Private (Admin)
exports.toggleVisa = async (req, res, next) => {
  try {
    const visa = await Visa.findById(req.params.id);

    if (!visa) {
      return res.status(404).json({
        success: false,
        message: 'التأشيرة غير موجودة'
      });
    }

    visa.isActive = !visa.isActive;
    await visa.save();

    res.json({
      success: true,
      message: visa.isActive ? 'تم تفعيل التأشيرة' : 'تم تعطيل التأشيرة',
      data: { visa }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    رفع صورة تأشيرة (علم أو معالم)
// @route   POST /api/visa-catalog/admin/upload-image
// @access  Private (Admin)
exports.uploadVisaImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'يرجى رفع صورة'
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'تم رفع الصورة بنجاح',
      data: { url: fileUrl }
    });
  } catch (error) {
    next(error);
  }
};
