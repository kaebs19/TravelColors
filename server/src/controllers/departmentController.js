const { Department } = require('../models');

// @desc    الحصول على كل الأقسام
// @route   GET /api/departments
// @access  Private (Employee/Admin)
exports.getDepartments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    let query = {};

    if (search) {
      query.title = new RegExp(search, 'i');
    }

    const skip = (Number(page) - 1) * Number(limit);

    const departments = await Department.find(query)
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await Department.countDocuments(query);

    res.json({
      success: true,
      data: {
        departments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على قسم واحد
// @route   GET /api/departments/:id
// @access  Private (Employee/Admin)
exports.getDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'القسم غير موجود'
      });
    }

    res.json({
      success: true,
      data: { department }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إنشاء قسم جديد
// @route   POST /api/departments
// @access  Private (Employee/Admin)
exports.createDepartment = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;

    const department = await Department.create(req.body);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء القسم بنجاح',
      data: { department }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث قسم
// @route   PUT /api/departments/:id
// @access  Private (Employee/Admin)
exports.updateDepartment = async (req, res, next) => {
  try {
    let department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'القسم غير موجود'
      });
    }

    department = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'تم تحديث القسم بنجاح',
      data: { department }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    حذف قسم
// @route   DELETE /api/departments/:id
// @access  Private (Admin)
exports.deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'القسم غير موجود'
      });
    }

    await department.deleteOne();

    res.json({
      success: true,
      message: 'تم حذف القسم بنجاح'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تبديل حالة القسم (تفعيل/إلغاء)
// @route   PUT /api/departments/:id/toggle
// @access  Private (Admin)
exports.toggleDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'القسم غير موجود'
      });
    }

    department.isActive = !department.isActive;
    await department.save();

    res.json({
      success: true,
      message: department.isActive ? 'تم تفعيل القسم' : 'تم إلغاء تفعيل القسم',
      data: { department }
    });
  } catch (error) {
    next(error);
  }
};
