const { Booking, Trip, Customer } = require('../models');

// @desc    الحصول على كل الحجوزات
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      search,
      startDate,
      endDate
    } = req.query;

    let query = {};

    // للمستخدم العادي: فقط حجوزاته
    if (req.user.role === 'user') {
      query.user = req.user.id;
    }

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('trip', 'title destination startDate endDate')
      .populate('customer', 'name phone')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: {
        bookings,
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

// @desc    الحصول على حجز واحد
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('trip')
      .populate('customer');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'الحجز غير موجود'
      });
    }

    // التحقق من الصلاحية
    if (req.user.role === 'user' && booking.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بالوصول لهذا الحجز'
      });
    }

    res.json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إنشاء حجز جديد
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
  try {
    const {
      tripId,
      customerId,
      passengers,
      numberOfPassengers,
      discount = 0,
      specialRequests,
      notes,
      paymentMethod
    } = req.body;

    // الحصول على الرحلة
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'الرحلة غير موجودة'
      });
    }

    // التحقق من توفر المقاعد
    if (trip.availableSeats < numberOfPassengers) {
      return res.status(400).json({
        success: false,
        message: `عدد المقاعد المتوفرة ${trip.availableSeats} فقط`
      });
    }

    // حساب السعر
    const pricePerPerson = trip.discountPrice > 0 ? trip.discountPrice : trip.price;
    const totalPrice = pricePerPerson * numberOfPassengers;
    const finalPrice = totalPrice - discount;

    // إنشاء الحجز
    const booking = await Booking.create({
      user: req.user.id,
      trip: tripId,
      customer: customerId,
      passengers,
      numberOfPassengers,
      pricePerPerson,
      totalPrice,
      discount,
      finalPrice,
      specialRequests,
      notes,
      paymentMethod,
      createdBy: req.user.id
    });

    // تحديث المقاعد المتوفرة
    trip.availableSeats -= numberOfPassengers;
    await trip.save();

    // تحديث إحصائيات العميل
    if (customerId) {
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { totalBookings: 1, totalSpent: finalPrice },
        lastBookingDate: new Date()
      });
    }

    // إرجاع الحجز مع البيانات الكاملة
    const populatedBooking = await Booking.findById(booking._id)
      .populate('trip', 'title destination startDate')
      .populate('customer', 'name phone');

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحجز بنجاح',
      data: { booking: populatedBooking }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث حالة الحجز
// @route   PUT /api/bookings/:id
// @access  Private (Employee/Admin)
exports.updateBooking = async (req, res, next) => {
  try {
    const { status, paymentStatus, paidAmount, notes } = req.body;

    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'الحجز غير موجود'
      });
    }

    // تحديث الحقول
    if (status) {
      booking.status = status;
      if (status === 'confirmed') booking.confirmedAt = new Date();
      if (status === 'completed') booking.completedAt = new Date();
      if (status === 'cancelled') booking.cancelledAt = new Date();
    }

    if (paymentStatus) booking.paymentStatus = paymentStatus;
    if (paidAmount !== undefined) booking.paidAmount = paidAmount;
    if (notes) booking.notes = notes;

    await booking.save();

    res.json({
      success: true,
      message: 'تم تحديث الحجز بنجاح',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إلغاء حجز
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res, next) => {
  try {
    const { cancelReason } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'الحجز غير موجود'
      });
    }

    // التحقق من الصلاحية
    if (req.user.role === 'user' && booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بإلغاء هذا الحجز'
      });
    }

    // التحقق من إمكانية الإلغاء
    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن إلغاء هذا الحجز'
      });
    }

    // إعادة المقاعد
    await Trip.findByIdAndUpdate(booking.trip, {
      $inc: { availableSeats: booking.numberOfPassengers }
    });

    // تحديث الحجز
    booking.status = 'cancelled';
    booking.cancelReason = cancelReason;
    booking.cancelledAt = new Date();
    await booking.save();

    res.json({
      success: true,
      message: 'تم إلغاء الحجز بنجاح',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إحصائيات الحجوزات
// @route   GET /api/bookings/stats
// @access  Private (Employee/Admin)
exports.getBookingStats = async (req, res, next) => {
  try {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$finalPrice' }
        }
      }
    ]);

    const todayBookings = await Booking.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });

    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().setDate(1)) },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$finalPrice' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        stats,
        todayBookings,
        monthlyRevenue: monthlyRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
};
