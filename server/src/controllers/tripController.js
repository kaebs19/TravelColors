const { Trip } = require('../models');

// @desc    الحصول على كل الرحلات
// @route   GET /api/trips
// @access  Public
exports.getTrips = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      destination,
      minPrice,
      maxPrice,
      startDate,
      endDate,
      search,
      sort = '-createdAt',
      featured
    } = req.query;

    // بناء الاستعلام
    let query = { isActive: true };

    if (category) query.category = category;
    if (destination) query.destination = new RegExp(destination, 'i');
    if (featured === 'true') query.isFeatured = true;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (startDate) query.startDate = { $gte: new Date(startDate) };
    if (endDate) query.endDate = { $lte: new Date(endDate) };

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { destination: new RegExp(search, 'i') }
      ];
    }

    // التنفيذ مع pagination
    const skip = (Number(page) - 1) * Number(limit);

    const trips = await Trip.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'name');

    const total = await Trip.countDocuments(query);

    res.json({
      success: true,
      data: {
        trips,
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

// @desc    الحصول على رحلة واحدة
// @route   GET /api/trips/:id
// @access  Public
exports.getTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'الرحلة غير موجودة'
      });
    }

    res.json({
      success: true,
      data: { trip }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إنشاء رحلة جديدة
// @route   POST /api/trips
// @access  Private (Employee/Admin)
exports.createTrip = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    req.body.availableSeats = req.body.totalSeats;

    const trip = await Trip.create(req.body);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الرحلة بنجاح',
      data: { trip }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث رحلة
// @route   PUT /api/trips/:id
// @access  Private (Employee/Admin)
exports.updateTrip = async (req, res, next) => {
  try {
    let trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'الرحلة غير موجودة'
      });
    }

    trip = await Trip.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'تم تحديث الرحلة بنجاح',
      data: { trip }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    حذف رحلة
// @route   DELETE /api/trips/:id
// @access  Private (Admin)
exports.deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'الرحلة غير موجودة'
      });
    }

    await trip.deleteOne();

    res.json({
      success: true,
      message: 'تم حذف الرحلة بنجاح'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على الرحلات المميزة
// @route   GET /api/trips/featured
// @access  Public
exports.getFeaturedTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find({ isActive: true, isFeatured: true })
      .sort('-createdAt')
      .limit(6);

    res.json({
      success: true,
      data: { trips }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على التصنيفات مع العدد
// @route   GET /api/trips/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Trip.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
};
