const mongoose = require('mongoose');
const { Invoice, Customer, Settings, CashRegister, AuditLog } = require('../models');
const Transaction = require('../models/Transaction');
const InvoicePayment = require('../models/InvoicePayment');
const {
  updateCashRegisterBalance,
  createAuditLog,
  getOrCreateCashRegister
} = require('../utils/financialUtils');

// @desc    الحصول على جميع الفواتير
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res, next) => {
  try {
    const { type, status, customer, startDate, endDate, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (customer) query.customer = customer;

    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) query.issueDate.$gte = new Date(startDate);
      if (endDate) query.issueDate.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('customer', 'name phone')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Invoice.countDocuments(query)
    ]);

    // إحصائيات سريعة
    const stats = await Invoice.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$total' },
          paidAmount: { $sum: '$paidAmount' },
          remainingAmount: { $sum: '$remainingAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        },
        stats: stats[0] || { totalAmount: 0, paidAmount: 0, remainingAmount: 0, count: 0 }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على فاتورة واحدة
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer')
      .populate('createdBy', 'name email')
      .populate('appointment');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'الفاتورة غير موجودة'
      });
    }

    res.json({
      success: true,
      data: { invoice }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إنشاء فاتورة جديدة
// @route   POST /api/invoices
// @access  Private
exports.createInvoice = async (req, res, next) => {
  try {
    const { type = 'invoice', customer: customerId, items, paymentMethod, paidAmount = 0, notes, dueDate, validUntil } = req.body;

    // جلب إعدادات الشركة
    const settings = await Settings.getSettings();

    // جلب بيانات العميل
    let customerData = {};
    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (customer) {
        customerData = {
          customer: customer._id,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerAddress: customer.address || '',
          customerCity: customer.city || ''
        };
      }
    } else if (req.body.customerName) {
      customerData = {
        customerName: req.body.customerName,
        customerPhone: req.body.customerPhone || '',
        customerAddress: req.body.customerAddress || '',
        customerCity: req.body.customerCity || ''
      };
    }

    // حساب المجاميع
    const processedItems = items.map(item => ({
      ...item,
      total: item.quantity * item.unitPrice
    }));

    const subtotal = processedItems.reduce((sum, item) => sum + item.total, 0);
    const taxRate = settings.tax?.enabled ? settings.tax.rate : 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const discount = req.body.discount || 0;
    const total = subtotal + taxAmount - discount;

    // إنشاء رقم الفاتورة
    const invoiceNumber = await Invoice.generateInvoiceNumber(type);

    // تحديد البادئة
    const prefixes = { invoice: 'INV', quote: 'EST', receipt: 'REC' };

    const invoice = await Invoice.create({
      invoiceNumber,
      type,
      prefix: prefixes[type],
      ...customerData,
      items: processedItems,
      subtotal,
      taxRate,
      taxAmount,
      discount,
      total,
      paidAmount,
      remainingAmount: total - paidAmount,
      paymentMethod,
      status: paidAmount >= total ? 'paid' : (paidAmount > 0 ? 'partial' : 'draft'),
      issueDate: new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
      companyInfo: {
        name: settings.companyName,
        nameEn: settings.companyNameEn,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        logo: settings.logo,
        taxNumber: settings.tax?.number
      },
      terms: type === 'quote' ? settings.quoteTerms : settings.invoiceTerms,
      notes,
      createdBy: req.user.id,
      appointment: req.body.appointment
    });

    // إذا تم الدفع، أضف حركة للصندوق
    if (paidAmount > 0 && type !== 'quote') {
      const cashRegister = await CashRegister.getOrCreate();
      await cashRegister.addTransaction({
        type: 'income',
        amount: paidAmount,
        description: `دفعة فاتورة رقم ${invoiceNumber}`,
        category: 'invoice_payment',
        paymentMethod,
        invoice: invoice._id,
        customer: customerId,
        createdBy: req.user.id
      });
    }

    // تحديث إجمالي الصرف للعميل
    if (customerId && paidAmount > 0) {
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { totalSpent: paidAmount }
      });
    }

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customer', 'name phone')
      .populate('createdBy', 'name');

    // تسجيل في سجل التدقيق
    try {
      const typeLabels = { invoice: 'فاتورة', quote: 'عرض سعر', receipt: 'إيصال' };
      await AuditLog.log({
        action: 'create',
        entityType: 'invoice',
        entityId: invoice._id,
        entityNumber: invoiceNumber,
        user: req.user,
        changes: { after: invoice.toObject() },
        req,
        description: `إنشاء ${typeLabels[type] || type} رقم ${invoiceNumber} - ${customerData.customerName || 'عميل'}`
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الفاتورة بنجاح',
      data: { invoice: populatedInvoice }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث فاتورة
// @route   PUT /api/invoices/:id
// @access  Private
exports.updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'الفاتورة غير موجودة'
      });
    }

    // لا يمكن تعديل الفواتير المدفوعة بالكامل
    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تعديل فاتورة مدفوعة بالكامل'
      });
    }

    const { items, discount, notes, dueDate, validUntil, status } = req.body;

    if (items) {
      invoice.items = items.map(item => ({
        ...item,
        total: item.quantity * item.unitPrice
      }));
    }

    if (discount !== undefined) invoice.discount = discount;
    if (notes !== undefined) invoice.notes = notes;
    if (dueDate) invoice.dueDate = new Date(dueDate);
    if (validUntil) invoice.validUntil = new Date(validUntil);
    if (status) invoice.status = status;

    await invoice.save();

    const updatedInvoice = await Invoice.findById(invoice._id)
      .populate('customer', 'name phone')
      .populate('createdBy', 'name');

    res.json({
      success: true,
      message: 'تم تحديث الفاتورة بنجاح',
      data: { invoice: updatedInvoice }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تسجيل دفعة على فاتورة (النظام المالي الموحد)
// @route   POST /api/invoices/:id/payment
// @access  Private
exports.addPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, paymentMethod = 'cash', notes } = req.body;

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'الفاتورة غير موجودة'
      });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'الفاتورة مدفوعة بالكامل'
      });
    }

    if (invoice.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن إضافة دفعة لفاتورة ملغاة'
      });
    }

    if (amount > invoice.remainingAmount) {
      return res.status(400).json({
        success: false,
        message: 'المبلغ أكبر من المتبقي'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'المبلغ يجب أن يكون أكبر من صفر'
      });
    }

    // الحصول على الصندوق
    const cashRegister = await getOrCreateCashRegister();
    const balanceBefore = cashRegister.currentBalance;
    const balanceAfter = balanceBefore + amount;

    // توليد رقم المعاملة
    const transactionNumber = await Transaction.generateTransactionNumber();

    // إنشاء المعاملة
    const transaction = await Transaction.create([{
      transactionNumber,
      type: 'income',
      amount,
      description: `دفعة فاتورة رقم ${invoice.invoiceNumber}${notes ? ' - ' + notes : ''}`,
      category: 'invoice_payment',
      paymentMethod,
      source: 'automatic',
      sourceType: 'invoice',
      sourceId: invoice._id,
      invoice: invoice._id,
      customer: invoice.customer,
      balanceBefore,
      balanceAfter,
      createdBy: req.user.id,
      notes
    }], { session });

    // إنشاء سجل الدفعة
    const invoicePayment = await InvoicePayment.create([{
      invoice: invoice._id,
      amount,
      paymentMethod,
      transaction: transaction[0]._id,
      createdBy: req.user.id,
      notes
    }], { session });

    // حفظ المبلغ القديم للـ audit log
    const oldPaidAmount = invoice.paidAmount;

    // تحديث الفاتورة
    invoice.paidAmount += amount;
    invoice.remainingAmount = invoice.total - invoice.paidAmount;
    invoice.status = invoice.remainingAmount <= 0 ? 'paid' : 'partial';
    invoice.payments.push(invoicePayment[0]._id);
    await invoice.save({ session });

    // تحديث الصندوق
    await updateCashRegisterBalance(cashRegister, 'income', amount, paymentMethod, session);

    // تحديث إجمالي صرف العميل
    if (invoice.customer) {
      await Customer.findByIdAndUpdate(invoice.customer, {
        $inc: { totalSpent: amount }
      }, { session });
    }

    // إنشاء سجل التدقيق
    await createAuditLog(
      'payment',
      'invoice',
      invoice._id,
      invoice.invoiceNumber,
      req.user,
      { paidAmount: oldPaidAmount, status: oldPaidAmount > 0 ? 'partial' : 'draft' },
      { paidAmount: invoice.paidAmount, status: invoice.status },
      req,
      `تسجيل دفعة بمبلغ ${amount} على فاتورة رقم ${invoice.invoiceNumber}`
    );

    await session.commitTransaction();

    // جلب الفاتورة محدثة
    const updatedInvoice = await Invoice.findById(invoice._id)
      .populate('customer', 'name phone')
      .populate('createdBy', 'name')
      .populate('payments');

    res.json({
      success: true,
      message: 'تم تسجيل الدفعة بنجاح',
      data: {
        invoice: updatedInvoice,
        payment: invoicePayment[0],
        transaction: transaction[0],
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

// @desc    إلغاء فاتورة
// @route   DELETE /api/invoices/:id
// @access  Private (Admin)
exports.cancelInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'الفاتورة غير موجودة'
      });
    }

    invoice.status = 'cancelled';
    await invoice.save();

    res.json({
      success: true,
      message: 'تم إلغاء الفاتورة',
      data: { invoice }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تحويل عرض سعر إلى فاتورة
// @route   POST /api/invoices/:id/convert
// @access  Private
exports.convertQuoteToInvoice = async (req, res, next) => {
  try {
    const quote = await Invoice.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'عرض السعر غير موجود'
      });
    }

    if (quote.type !== 'quote') {
      return res.status(400).json({
        success: false,
        message: 'هذه ليست عرض سعر'
      });
    }

    // إنشاء فاتورة جديدة من عرض السعر
    const invoiceNumber = await Invoice.generateInvoiceNumber('invoice');
    const settings = await Settings.getSettings();

    const invoice = await Invoice.create({
      invoiceNumber,
      type: 'invoice',
      prefix: 'INV',
      customer: quote.customer,
      customerName: quote.customerName,
      customerPhone: quote.customerPhone,
      customerAddress: quote.customerAddress,
      customerCity: quote.customerCity,
      items: quote.items,
      subtotal: quote.subtotal,
      taxRate: quote.taxRate,
      taxAmount: quote.taxAmount,
      discount: quote.discount,
      total: quote.total,
      paidAmount: 0,
      remainingAmount: quote.total,
      companyInfo: quote.companyInfo,
      terms: settings.invoiceTerms,
      notes: `تم التحويل من عرض السعر رقم ${quote.invoiceNumber}`,
      createdBy: req.user.id
    });

    // تحديث حالة عرض السعر
    quote.status = 'sent';
    quote.notes = `تم تحويله إلى فاتورة رقم ${invoice.invoiceNumber}`;
    await quote.save();

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customer', 'name phone')
      .populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'تم تحويل عرض السعر إلى فاتورة',
      data: { invoice: populatedInvoice }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على إحصائيات الفواتير
// @route   GET /api/invoices/stats
// @access  Private
exports.getInvoiceStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = {};
    if (Object.keys(dateFilter).length > 0) {
      matchStage.issueDate = dateFilter;
    }

    const stats = await Invoice.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' },
          paidAmount: { $sum: '$paidAmount' },
          remainingAmount: { $sum: '$remainingAmount' }
        }
      }
    ]);

    const statusStats = await Invoice.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        byType: stats,
        byStatus: statusStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على سجل دفعات فاتورة
// @route   GET /api/invoices/:id/payments
// @access  Private
exports.getInvoicePayments = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'الفاتورة غير موجودة'
      });
    }

    const payments = await InvoicePayment.getPaymentHistory(req.params.id);

    res.json({
      success: true,
      data: {
        payments,
        summary: {
          totalPaid: invoice.paidAmount,
          remaining: invoice.remainingAmount,
          total: invoice.total,
          paymentCount: payments.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    استرداد دفعة
// @route   POST /api/invoices/:id/payments/:paymentId/refund
// @access  Private (Admin only)
exports.refundPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reason } = req.body;
    const { id: invoiceId, paymentId } = req.params;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'الفاتورة غير موجودة'
      });
    }

    const payment = await InvoicePayment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'الدفعة غير موجودة'
      });
    }

    if (payment.invoice.toString() !== invoiceId) {
      return res.status(400).json({
        success: false,
        message: 'الدفعة لا تنتمي لهذه الفاتورة'
      });
    }

    if (payment.isRefunded) {
      return res.status(400).json({
        success: false,
        message: 'تم استرداد هذه الدفعة مسبقاً'
      });
    }

    // الحصول على الصندوق
    const cashRegister = await getOrCreateCashRegister();

    // التحقق من كفاية الرصيد
    if (payment.paymentMethod === 'cash' && payment.amount > cashRegister.cashBalance) {
      return res.status(400).json({
        success: false,
        message: 'الرصيد النقدي غير كافي للاسترداد'
      });
    }

    const balanceBefore = cashRegister.currentBalance;
    const balanceAfter = balanceBefore - payment.amount;

    // إنشاء معاملة الاسترداد
    const transactionNumber = await Transaction.generateTransactionNumber();
    const refundTransaction = await Transaction.create([{
      transactionNumber,
      type: 'expense',
      amount: payment.amount,
      description: `استرداد دفعة من فاتورة رقم ${invoice.invoiceNumber}`,
      category: 'refund',
      paymentMethod: payment.paymentMethod,
      source: 'automatic',
      sourceType: 'invoice',
      sourceId: invoice._id,
      invoice: invoice._id,
      customer: invoice.customer,
      balanceBefore,
      balanceAfter,
      createdBy: req.user.id,
      notes: reason || 'استرداد دفعة'
    }], { session });

    // تحديث سجل الدفعة
    payment.isRefunded = true;
    payment.refundedAt = new Date();
    payment.refundTransaction = refundTransaction[0]._id;
    payment.refundReason = reason;
    payment.refundedBy = req.user.id;
    await payment.save({ session });

    // إلغاء المعاملة الأصلية
    if (payment.transaction) {
      await Transaction.findByIdAndUpdate(payment.transaction, {
        isActive: false,
        cancelledAt: new Date(),
        cancelledBy: req.user.id,
        cancellationReason: 'استرداد الدفعة'
      }, { session });
    }

    // تحديث الفاتورة
    const oldPaidAmount = invoice.paidAmount;
    invoice.paidAmount -= payment.amount;
    invoice.remainingAmount = invoice.total - invoice.paidAmount;
    invoice.status = invoice.paidAmount <= 0 ? 'draft' : 'partial';
    await invoice.save({ session });

    // تحديث الصندوق
    await updateCashRegisterBalance(cashRegister, 'expense', payment.amount, payment.paymentMethod, session);

    // عكس من إجمالي صرف العميل
    if (invoice.customer) {
      await Customer.findByIdAndUpdate(invoice.customer, {
        $inc: { totalSpent: -payment.amount }
      }, { session });
    }

    // إنشاء سجل التدقيق
    await createAuditLog(
      'refund',
      'invoice',
      invoice._id,
      invoice.invoiceNumber,
      req.user,
      { paidAmount: oldPaidAmount },
      { paidAmount: invoice.paidAmount, refundedPayment: paymentId },
      req,
      `استرداد دفعة بمبلغ ${payment.amount} من فاتورة رقم ${invoice.invoiceNumber}`
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'تم استرداد الدفعة بنجاح',
      data: {
        invoice,
        payment,
        refundTransaction: refundTransaction[0],
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
