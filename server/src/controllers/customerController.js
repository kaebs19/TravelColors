const { Customer, Booking, Appointment } = require('../models');
const { calculatePagination, formatPaginatedResponse } = require('../utils/paginationHelper');
const { buildSearchQuery } = require('../utils/queryBuilder');
const { checkExists } = require('../utils/responseHelper');

// @desc    الحصول على كل العملاء
// @route   GET /api/customers
// @access  Private (Employee/Admin)
exports.getCustomers = async (req, res, next) => {
  try {
    const { page, limit, search, isVIP, sort = '-createdAt' } = req.query;

    const { skip, page: pageNum, limit: limitNum } = calculatePagination(page, limit);

    const query = {
      ...buildSearchQuery(['name', 'phone', 'email', 'nationalId'], search),
      ...(isVIP === 'true' && { isVIP: true })
    };

    const customers = await Customer.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // حساب إجمالي الإنفاق وعدد الحجوزات لكل عميل
    const customerIds = customers.map(c => c._id);
    const customerPhones = customers.map(c => c.phone).filter(Boolean);

    // جلب إحصائيات المواعيد لكل عميل (بناءً على customer ObjectId أو رقم الهاتف)
    const appointmentStats = await Appointment.aggregate([
      {
        $match: {
          $or: [
            { customer: { $in: customerIds } },
            { phone: { $in: customerPhones } }
          ]
        }
      },
      {
        $group: {
          _id: { $ifNull: ['$customer', '$phone'] },
          phone: { $first: '$phone' },
          totalSpent: { $sum: { $ifNull: ['$paidAmount', 0] } },
          totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } },
          totalBookings: { $sum: 1 },
          lastBookingDate: { $max: '$createdAt' }
        }
      }
    ]);

    // إنشاء خريطة للإحصائيات (بناءً على customer ID أو رقم الهاتف)
    const statsMap = {};
    const phoneStatsMap = {};
    appointmentStats.forEach(stat => {
      if (stat._id && typeof stat._id === 'object') {
        // customer ObjectId
        statsMap[stat._id.toString()] = {
          totalSpent: stat.totalSpent,
          totalAmount: stat.totalAmount,
          totalBookings: stat.totalBookings,
          lastBookingDate: stat.lastBookingDate
        };
      }
      if (stat.phone) {
        // رقم الهاتف
        phoneStatsMap[stat.phone] = {
          totalSpent: stat.totalSpent,
          totalAmount: stat.totalAmount,
          totalBookings: stat.totalBookings,
          lastBookingDate: stat.lastBookingDate
        };
      }
    });

    // دمج الإحصائيات مع بيانات العملاء (أولوية لـ ObjectId ثم رقم الهاتف)
    const customersWithStats = customers.map(customer => {
      // البحث أولاً بـ customer ID ثم برقم الهاتف
      let stats = statsMap[customer._id.toString()];
      if (!stats && customer.phone) {
        stats = phoneStatsMap[customer.phone];
      }
      stats = stats || {
        totalSpent: 0,
        totalBookings: 0,
        lastBookingDate: null
      };
      return {
        ...customer,
        totalSpent: stats.totalSpent,
        totalBookings: stats.totalBookings,
        lastBookingDate: stats.lastBookingDate,
        city: customer.address?.city || customer.city || ''
      };
    });

    const total = await Customer.countDocuments(query);

    res.json(formatPaginatedResponse(customersWithStats, total, pageNum, limitNum, 'customers'));
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على عميل واحد
// @route   GET /api/customers/:id
// @access  Private (Employee/Admin)
exports.getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();

    if (!checkExists(res, customer, 'العميل')) return;

    // جلب حجوزات العميل
    const bookings = await Booking.find({ customer: req.params.id })
      .populate('trip', 'title destination startDate')
      .sort('-createdAt')
      .limit(10);

    // جلب إحصائيات المواعيد (بناءً على customer ObjectId أو رقم الهاتف)
    const matchQuery = { $or: [{ customer: customer._id }] };
    if (customer.phone) {
      matchQuery.$or.push({ phone: customer.phone });
    }

    const appointmentStats = await Appointment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: { $ifNull: ['$paidAmount', 0] } },
          totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } },
          totalBookings: { $sum: 1 },
          lastBookingDate: { $max: '$createdAt' }
        }
      }
    ]);

    const stats = appointmentStats[0] || {
      totalSpent: 0,
      totalBookings: 0,
      lastBookingDate: null
    };

    res.json({
      success: true,
      data: {
        customer: {
          ...customer,
          totalSpent: stats.totalSpent,
          totalBookings: stats.totalBookings,
          lastBookingDate: stats.lastBookingDate,
          city: customer.address?.city || customer.city || ''
        },
        bookings
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إنشاء عميل جديد
// @route   POST /api/customers
// @access  Private (Employee/Admin)
exports.createCustomer = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;

    const customer = await Customer.create(req.body);

    res.status(201).json({
      success: true,
      message: 'تم إضافة العميل بنجاح',
      data: { customer }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'رقم الهوية أو الجواز مسجل مسبقاً'
      });
    }
    next(error);
  }
};

// @desc    تحديث عميل
// @route   PUT /api/customers/:id
// @access  Private (Employee/Admin)
exports.updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!checkExists(res, customer, 'العميل')) return;

    res.json({
      success: true,
      message: 'تم تحديث بيانات العميل بنجاح',
      data: { customer }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    حذف عميل
// @route   DELETE /api/customers/:id
// @access  Private (Admin)
exports.deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!checkExists(res, customer, 'العميل')) return;

    // التحقق من وجود حجوزات
    const bookingsCount = await Booking.countDocuments({ customer: req.params.id });
    if (bookingsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف العميل لوجود حجوزات مرتبطة به'
      });
    }

    await customer.deleteOne();

    res.json({
      success: true,
      message: 'تم حذف العميل بنجاح'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    البحث السريع عن عميل
// @route   GET /api/customers/search
// @access  Private (Employee/Admin)
exports.searchCustomers = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json({
        success: true,
        data: { customers: [] }
      });
    }

    const customers = await Customer.find(
      buildSearchQuery(['name', 'phone', 'nationalId'], q)
    )
      .select('name phone nationalId')
      .limit(10);

    res.json({
      success: true,
      data: { customers }
    });
  } catch (error) {
    next(error);
  }
};
