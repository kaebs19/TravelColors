const mongoose = require('mongoose');
const Receipt = require('../models/Receipt');
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const InvoicePayment = require('../models/InvoicePayment');
const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const Settings = require('../models/Settings');
const {
  updateCashRegisterBalance,
  createAuditLog,
  getOrCreateCashRegister,
  getDayBounds,
  getMonthBounds
} = require('../utils/financialUtils');
const { calculatePagination } = require('../utils/paginationHelper');
const { buildSearchQuery, buildDateRangeQuery } = require('../utils/queryBuilder');
const { checkExists } = require('../utils/responseHelper');
const { checkAuthorization } = require('../utils/authorizationHelper');

/**
 * @desc    الحصول على جميع الإيصالات
 * @route   GET /api/receipts
 * @access  Private
 */
exports.getReceipts = async (req, res, next) => {
  try {
    const {
      status,
      paymentMethod,
      startDate,
      endDate,
      search,
      customer,
      page,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const { skip, page: pageNum, limit: limitNum } = calculatePagination(page, limit);

    const query = {
      ...buildDateRangeQuery(startDate, endDate),
      ...buildSearchQuery(['receiptNumber', 'customerName', 'customerPhone', 'description'], search)
    };

    // فلتر الحالة
    if (status) {
      query.status = status;
    }

    // فلتر طريقة الدفع
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    // فلتر العميل
    if (customer) {
      query.customer = customer;
    }

    // إذا كان الموظف عادي يرى إيصالاته فقط
    if (req.user.role === 'employee') {
      query.createdBy = req.user.id;
    }

    // الترتيب
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [receipts, total] = await Promise.all([
      Receipt.find(query)
        .populate('createdBy', 'name')
        .populate('customer', 'name phone')
        .populate('appointment', 'customerName appointmentDate')
        .populate('transaction', 'transactionNumber')
        .populate('convertedToInvoice', 'invoiceNumber')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Receipt.countDocuments(query)
    ]);

    // حساب الإحصائيات
    const stats = await Receipt.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          convertedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        receipts,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum
        },
        stats: stats[0] || {
          totalAmount: 0,
          count: 0,
          activeCount: 0,
          convertedCount: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    الحصول على إيصال واحد
 * @route   GET /api/receipts/:id
 * @access  Private
 */
exports.getReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('customer', 'name phone email')
      .populate('appointment', 'customerName appointmentDate status totalAmount paidAmount')
      .populate('transaction', 'transactionNumber type amount balanceAfter')
      .populate('convertedToInvoice', 'invoiceNumber total status')
      .populate('cancelledBy', 'name');

    if (!checkExists(res, receipt, 'الإيصال')) return;

    // التحقق من الصلاحية
    if (!checkAuthorization(res, req.user, receipt)) return;

    res.json({
      success: true,
      data: { receipt }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    إنشاء إيصال جديد (مع معاملة تلقائية)
 * @route   POST /api/receipts
 * @access  Private
 */
exports.createReceipt = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      appointment: appointmentId,
      customer: customerId,
      customerName,
      customerPhone,
      amount,
      paymentMethod = 'cash',
      description,
      notes
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!customerName || !amount) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تقديم اسم العميل والمبلغ'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'المبلغ يجب أن يكون أكبر من صفر'
      });
    }

    // الحصول على إعدادات الشركة
    let settings;
    try {
      settings = await Settings.findOne();
    } catch (e) {
      settings = {};
    }

    // الحصول على الصندوق
    const cashRegister = await getOrCreateCashRegister();
    const balanceBefore = cashRegister.currentBalance;
    const balanceAfter = balanceBefore + amount;

    // توليد أرقام المستندات
    const [receiptNumber, transactionNumber] = await Promise.all([
      Receipt.generateReceiptNumber(),
      Transaction.generateTransactionNumber()
    ]);

    // إنشاء المعاملة أولاً
    const transaction = await Transaction.create([{
      transactionNumber,
      type: 'income',
      amount,
      description: description || `إيصال دفعة - ${customerName}`,
      category: appointmentId ? 'appointment_payment' : 'other',
      paymentMethod,
      source: 'automatic',
      sourceType: 'receipt',
      appointment: appointmentId,
      customer: customerId,
      balanceBefore,
      balanceAfter,
      createdBy: req.user.id,
      notes
    }], { session });

    // إنشاء الإيصال
    const receipt = await Receipt.create([{
      receiptNumber,
      appointment: appointmentId,
      customer: customerId,
      customerName,
      customerPhone,
      amount,
      paymentMethod,
      description,
      transaction: transaction[0]._id,
      companyInfo: {
        name: settings?.companyName || '',
        nameEn: settings?.companyNameEn || '',
        address: settings?.address || '',
        phone: settings?.phone || '',
        email: settings?.email || '',
        logo: settings?.logo || '',
        taxNumber: settings?.tax?.number || ''
      },
      createdBy: req.user.id,
      notes
    }], { session });

    // تحديث المعاملة بمرجع الإيصال
    await Transaction.findByIdAndUpdate(
      transaction[0]._id,
      { receipt: receipt[0]._id, sourceId: receipt[0]._id },
      { session }
    );

    // تحديث الصندوق
    await updateCashRegisterBalance(cashRegister, 'income', amount, paymentMethod, session);

    // تحديث الموعد إذا كان مرتبطاً
    if (appointmentId) {
      await Appointment.findByIdAndUpdate(
        appointmentId,
        {
          $inc: { paidAmount: amount },
          paymentType: paymentMethod
        },
        { session }
      );
    }

    // تحديث إجمالي مصروفات العميل
    if (customerId) {
      await Customer.findByIdAndUpdate(
        customerId,
        { $inc: { totalSpent: amount } },
        { session }
      );
    }

    // إنشاء سجل التدقيق
    await createAuditLog(
      'create',
      'receipt',
      receipt[0]._id,
      receiptNumber,
      req.user,
      null,
      { amount, paymentMethod, customerName },
      req,
      `إنشاء إيصال رقم ${receiptNumber} بمبلغ ${amount}`
    );

    await session.commitTransaction();

    // جلب الإيصال مع البيانات المرتبطة
    const populatedReceipt = await Receipt.findById(receipt[0]._id)
      .populate('createdBy', 'name')
      .populate('customer', 'name phone')
      .populate('appointment', 'customerName appointmentDate')
      .populate('transaction', 'transactionNumber');

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الإيصال بنجاح',
      data: {
        receipt: populatedReceipt,
        currentBalance: balanceAfter
      }
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

/**
 * @desc    إنشاء إيصال من موعد
 * @route   POST /api/receipts/from-appointment/:appointmentId
 * @access  Private
 */
exports.createReceiptFromAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('customer', 'name phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'الموعد غير موجود'
      });
    }

    // استخدام بيانات الموعد
    req.body.appointment = appointment._id;
    req.body.customer = appointment.customer?._id;
    req.body.customerName = req.body.customerName || appointment.customerName;
    req.body.customerPhone = req.body.customerPhone || appointment.phone;

    // استدعاء createReceipt
    return exports.createReceipt(req, res, next);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    تحويل إيصال إلى فاتورة
 * @route   POST /api/receipts/:id/convert-to-invoice
 * @access  Private
 */
exports.convertToInvoice = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, taxRate = 0, discount = 0, notes } = req.body;

    const receipt = await Receipt.findById(req.params.id)
      .populate('customer')
      .populate('appointment');

    if (!checkExists(res, receipt, 'الإيصال')) return;

    if (receipt.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تحويل هذا الإيصال. الحالة الحالية: ' + receipt.status
      });
    }

    // الحصول على إعدادات الشركة
    let settings;
    try {
      settings = await Settings.findOne();
    } catch (e) {
      settings = {};
    }

    // إعداد عناصر الفاتورة
    const invoiceItems = items || [{
      product: 'خدمة',
      description: receipt.description || 'خدمة مقدمة',
      quantity: 1,
      persons: 1,
      unitPrice: receipt.amount,
      total: receipt.amount
    }];

    // حساب المجاميع
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount - discount;

    // توليد رقم الفاتورة
    const invoiceNumber = await Invoice.generateInvoiceNumber('invoice');

    // إنشاء الفاتورة
    const invoice = await Invoice.create([{
      invoiceNumber,
      type: 'invoice',
      prefix: 'INV',
      customer: receipt.customer?._id,
      customerName: receipt.customerName,
      customerPhone: receipt.customerPhone,
      items: invoiceItems,
      subtotal,
      taxRate,
      taxAmount,
      discount,
      total,
      paidAmount: receipt.amount,
      remainingAmount: Math.max(0, total - receipt.amount),
      paymentMethod: receipt.paymentMethod,
      status: receipt.amount >= total ? 'paid' : 'partial',
      issueDate: new Date(),
      companyInfo: receipt.companyInfo,
      notes: notes || receipt.notes,
      createdBy: req.user.id,
      appointment: receipt.appointment?._id,
      originalReceipt: receipt._id
    }], { session });

    // إنشاء سجل الدفعة
    const invoicePayment = await InvoicePayment.create([{
      invoice: invoice[0]._id,
      amount: receipt.amount,
      paymentMethod: receipt.paymentMethod,
      transaction: receipt.transaction,
      createdBy: req.user.id,
      notes: `دفعة محولة من إيصال رقم ${receipt.receiptNumber}`
    }], { session });

    // تحديث الفاتورة بمرجع الدفعة
    await Invoice.findByIdAndUpdate(
      invoice[0]._id,
      { $push: { payments: invoicePayment[0]._id } },
      { session }
    );

    // تحديث الإيصال
    receipt.status = 'converted';
    receipt.convertedToInvoice = invoice[0]._id;
    receipt.convertedAt = new Date();
    await receipt.save({ session });

    // تحديث المعاملة لتربطها بالفاتورة أيضاً
    if (receipt.transaction) {
      await Transaction.findByIdAndUpdate(
        receipt.transaction,
        {
          invoice: invoice[0]._id,
          category: 'invoice_payment'
        },
        { session }
      );
    }

    // إنشاء سجل التدقيق
    await createAuditLog(
      'convert',
      'receipt',
      receipt._id,
      receipt.receiptNumber,
      req.user,
      { status: 'active' },
      { status: 'converted', convertedToInvoice: invoice[0]._id },
      req,
      `تحويل إيصال رقم ${receipt.receiptNumber} إلى فاتورة رقم ${invoiceNumber}`
    );

    await session.commitTransaction();

    // جلب الفاتورة مع البيانات المرتبطة
    const populatedInvoice = await Invoice.findById(invoice[0]._id)
      .populate('createdBy', 'name')
      .populate('customer', 'name phone')
      .populate('payments')
      .populate('originalReceipt', 'receiptNumber');

    res.json({
      success: true,
      message: 'تم تحويل الإيصال إلى فاتورة بنجاح',
      data: {
        invoice: populatedInvoice,
        receipt
      }
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

/**
 * @desc    إلغاء إيصال
 * @route   PUT /api/receipts/:id/cancel
 * @access  Private (Admin only)
 */
exports.cancelReceipt = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reason } = req.body;

    const receipt = await Receipt.findById(req.params.id);

    if (!checkExists(res, receipt, 'الإيصال')) return;

    if (receipt.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن إلغاء هذا الإيصال. الحالة الحالية: ' + receipt.status
      });
    }

    // الحصول على الصندوق
    const cashRegister = await getOrCreateCashRegister();

    // التحقق من كفاية الرصيد للعكس
    if (receipt.paymentMethod === 'cash' && receipt.amount > cashRegister.cashBalance) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن إلغاء الإيصال. الرصيد النقدي غير كافي'
      });
    }

    // إلغاء المعاملة المرتبطة
    if (receipt.transaction) {
      const transaction = await Transaction.findById(receipt.transaction);
      if (transaction && transaction.isActive) {
        transaction.isActive = false;
        transaction.cancelledAt = new Date();
        transaction.cancelledBy = req.user.id;
        transaction.cancellationReason = reason || 'إلغاء الإيصال';
        await transaction.save({ session });
      }
    }

    // عكس الرصيد
    await updateCashRegisterBalance(
      cashRegister,
      'expense',
      receipt.amount,
      receipt.paymentMethod,
      session
    );

    // عكس الدفعة من الموعد
    if (receipt.appointment) {
      await Appointment.findByIdAndUpdate(
        receipt.appointment,
        { $inc: { paidAmount: -receipt.amount } },
        { session }
      );
    }

    // عكس من إجمالي مصروفات العميل
    if (receipt.customer) {
      await Customer.findByIdAndUpdate(
        receipt.customer,
        { $inc: { totalSpent: -receipt.amount } },
        { session }
      );
    }

    // تحديث الإيصال
    receipt.status = 'cancelled';
    receipt.cancelledAt = new Date();
    receipt.cancelledBy = req.user.id;
    receipt.cancellationReason = reason || 'تم الإلغاء بواسطة المدير';
    await receipt.save({ session });

    // إنشاء سجل التدقيق
    await createAuditLog(
      'cancel',
      'receipt',
      receipt._id,
      receipt.receiptNumber,
      req.user,
      { status: 'active' },
      { status: 'cancelled', cancellationReason: receipt.cancellationReason },
      req,
      `إلغاء إيصال رقم ${receipt.receiptNumber}`
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'تم إلغاء الإيصال بنجاح',
      data: {
        receipt,
        currentBalance: cashRegister.currentBalance
      }
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

/**
 * @desc    الحصول على إيصال للطباعة
 * @route   GET /api/receipts/:id/print
 * @access  Private
 */
exports.getReceiptForPrint = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('customer', 'name phone email address')
      .populate('appointment', 'customerName appointmentDate department')
      .populate('transaction', 'transactionNumber');

    if (!checkExists(res, receipt, 'الإيصال')) return;

    res.json({
      success: true,
      data: { receipt }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    الحصول على إحصائيات الإيصالات
 * @route   GET /api/receipts/stats
 * @access  Private
 */
exports.getReceiptStats = async (req, res, next) => {
  try {
    const { startDate, endDate, period = 'month' } = req.query;

    let start, end;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      const bounds = period === 'day' ? getDayBounds() : getMonthBounds();
      start = bounds.start;
      end = bounds.end;
    }

    const stats = await Receipt.getStats(start, end);
    const byPaymentMethod = await Receipt.getStatsByPaymentMethod(start, end);
    const byEmployee = await Receipt.getStatsByEmployee(start, end);

    res.json({
      success: true,
      data: {
        period: { start, end },
        stats,
        byPaymentMethod,
        byEmployee
      }
    });
  } catch (error) {
    next(error);
  }
};
