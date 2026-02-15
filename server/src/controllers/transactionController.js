const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const CashRegister = require('../models/CashRegister');
const Customer = require('../models/Customer');
const {
  updateCashRegisterBalance,
  validateBalanceForExpense,
  createAuditLog,
  getOrCreateCashRegister,
  getDayBounds,
  getMonthBounds
} = require('../utils/financialUtils');
const { buildSearchQuery, buildDateRangeQuery } = require('../utils/queryBuilder');
const { checkExists, sendError, sendUnauthorized } = require('../utils/responseHelper');
const { checkAuthorization } = require('../utils/authorizationHelper');

/**
 * @desc    الحصول على جميع المعاملات مع الفلاتر (من النظام الجديد والقديم)
 * @route   GET /api/transactions
 * @access  Private
 */
exports.getTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      paymentMethod,
      source,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeOld = 'true' // إضافة خيار لتضمين البيانات القديمة
    } = req.query;

    // بناء query للنظام الجديد
    const query = { isActive: true };

    // فلتر النوع
    if (type) {
      query.type = type;
    }

    // فلتر التصنيف
    if (category) {
      query.category = category;
    }

    // فلتر طريقة الدفع
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    // فلتر المصدر
    if (source) {
      query.source = source;
    }

    // فلتر التاريخ
    Object.assign(query, buildDateRangeQuery(startDate, endDate));

    // البحث
    Object.assign(query, buildSearchQuery(['transactionNumber', 'description'], search));

    // إذا كان الموظف عادي يرى معاملاته فقط
    if (req.user.role === 'employee') {
      query.createdBy = req.user.id;
    }

    // الترتيب
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // جلب المعاملات من النظام الجديد
    let newTransactions = await Transaction.find(query)
      .populate('createdBy', 'name')
      .populate('customer', 'name phone')
      .populate('receipt', 'receiptNumber')
      .populate('invoice', 'invoiceNumber')
      .populate('appointment', 'customerName appointmentDate')
      .sort(sort);

    // جلب المعاملات من النظام القديم إذا طلب
    let oldTransactions = [];
    if (includeOld === 'true') {
      try {
        const cashRegister = await CashRegister.findOne({ name: 'الصندوق الرئيسي' });
        if (cashRegister && cashRegister.transactions) {
          // تحويل المعاملات القديمة لتتوافق مع الشكل الجديد
          const oldMigratedIds = new Set(
            await Transaction.find({ 'metadata.oldTransactionId': { $exists: true } })
              .distinct('metadata.oldTransactionId')
          );

          oldTransactions = cashRegister.transactions
            .filter(tx => {
              // استبعاد المعاملات المرحّلة
              if (oldMigratedIds.has(tx._id.toString())) return false;

              // تطبيق الفلاتر
              if (type && tx.type !== type) return false;
              if (category && tx.category !== category) return false;
              if (paymentMethod && tx.paymentMethod !== paymentMethod) return false;
              if (source === 'automatic' || source === 'manual') return false; // النظام القديم لا يدعم المصدر

              // فلتر التاريخ
              const txDate = new Date(tx.transactionDate || tx.createdAt);
              if (startDate && txDate < new Date(startDate)) return false;
              if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (txDate > end) return false;
              }

              // البحث
              if (search) {
                const searchLower = search.toLowerCase();
                if (!tx.description?.toLowerCase().includes(searchLower)) return false;
              }

              // فلتر الموظف
              if (req.user.role === 'employee' && tx.createdBy?.toString() !== req.user.id) return false;

              return true;
            })
            .map(tx => ({
              _id: tx._id,
              transactionNumber: `OLD-${tx._id.toString().slice(-8).toUpperCase()}`,
              type: tx.type,
              amount: tx.amount,
              description: tx.description,
              category: tx.category || 'other',
              paymentMethod: tx.paymentMethod || 'cash',
              source: 'legacy',
              sourceType: 'legacy',
              appointment: tx.appointment,
              customer: tx.customer,
              invoice: tx.invoice,
              balanceBefore: (tx.balanceAfter || 0) - (tx.type === 'income' ? tx.amount : -tx.amount),
              balanceAfter: tx.balanceAfter || 0,
              createdBy: tx.createdBy ? { _id: tx.createdBy, name: 'موظف' } : null,
              isActive: true,
              createdAt: tx.transactionDate || tx.createdAt,
              updatedAt: tx.updatedAt || tx.createdAt,
              isLegacy: true // علامة للتمييز
            }));
        }
      } catch (oldError) {
        console.error('Error fetching old transactions:', oldError);
      }
    }

    // دمج وترتيب المعاملات
    let allTransactions = [...newTransactions.map(t => t.toObject()), ...oldTransactions];

    // الترتيب
    allTransactions.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    // Pagination
    const total = allTransactions.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedTransactions = allTransactions.slice(skip, skip + parseInt(limit));

    // حساب الإحصائيات
    const totalIncome = allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        },
        stats: {
          totalIncome,
          totalExpense,
          count: total,
          netAmount: totalIncome - totalExpense
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    الحصول على معاملة واحدة
 * @route   GET /api/transactions/:id
 * @access  Private
 */
exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('customer', 'name phone email')
      .populate('receipt', 'receiptNumber amount status')
      .populate('invoice', 'invoiceNumber total status')
      .populate('appointment', 'customerName appointmentDate status')
      .populate('cancelledBy', 'name');

    if (!checkExists(res, transaction, 'المعاملة')) return;

    // التحقق من الصلاحية
    if (!checkAuthorization(res, req.user, transaction)) return;

    res.json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    إنشاء معاملة يدوية
 * @route   POST /api/transactions
 * @access  Private
 */
exports.createTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      type,
      amount,
      description,
      category = 'other',
      paymentMethod = 'cash',
      customer: customerId,
      notes
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!type || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تقديم جميع البيانات المطلوبة'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'المبلغ يجب أن يكون أكبر من صفر'
      });
    }

    // التحقق من صلاحية الموظف للمصروفات
    if (req.user.role === 'employee' && type === 'expense') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بإضافة مصروفات'
      });
    }

    // الحصول على الصندوق
    const cashRegister = await getOrCreateCashRegister();

    // التحقق من كفاية الرصيد للمصروفات
    if (type === 'expense') {
      const balanceCheck = validateBalanceForExpense(cashRegister, amount, paymentMethod);
      if (!balanceCheck.valid) {
        return res.status(400).json({
          success: false,
          message: balanceCheck.message
        });
      }
    }

    // حساب الرصيد
    const balanceBefore = cashRegister.currentBalance;
    const balanceAfter = type === 'income'
      ? balanceBefore + amount
      : balanceBefore - amount;

    // توليد رقم المعاملة
    const transactionNumber = await Transaction.generateTransactionNumber();

    // إنشاء المعاملة
    const transaction = await Transaction.create([{
      transactionNumber,
      type,
      amount,
      description,
      category,
      paymentMethod,
      source: 'manual',
      sourceType: 'manual',
      customer: customerId,
      balanceBefore,
      balanceAfter,
      createdBy: req.user.id,
      notes
    }], { session });

    // تحديث الصندوق
    await updateCashRegisterBalance(cashRegister, type, amount, paymentMethod, session);

    // إنشاء سجل التدقيق
    await createAuditLog(
      'create',
      'transaction',
      transaction[0]._id,
      transactionNumber,
      req.user,
      null,
      { type, amount, category, paymentMethod },
      req,
      `إنشاء معاملة ${type === 'income' ? 'إيراد' : 'مصروف'} بمبلغ ${amount}`
    );

    await session.commitTransaction();

    // جلب المعاملة مع البيانات المرتبطة
    const populatedTransaction = await Transaction.findById(transaction[0]._id)
      .populate('createdBy', 'name')
      .populate('customer', 'name phone');

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المعاملة بنجاح',
      data: {
        transaction: populatedTransaction,
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
 * @desc    إلغاء معاملة
 * @route   PUT /api/transactions/:id/cancel
 * @access  Private (Admin only)
 */
exports.cancelTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reason } = req.body;

    const transaction = await Transaction.findById(req.params.id);

    if (!checkExists(res, transaction, 'المعاملة')) return;

    if (!transaction.isActive) {
      return res.status(400).json({
        success: false,
        message: 'هذه المعاملة ملغاة مسبقاً'
      });
    }

    // التحقق من أن المعاملة يدوية (لا يمكن إلغاء المعاملات التلقائية مباشرة)
    if (transaction.source === 'automatic') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن إلغاء المعاملات التلقائية مباشرة. يرجى إلغاء المستند الأصلي'
      });
    }

    // الحصول على الصندوق
    const cashRegister = await getOrCreateCashRegister();

    // عكس المعاملة
    const reverseType = transaction.type === 'income' ? 'expense' : 'income';

    // التحقق من كفاية الرصيد إذا كانت المعاملة الأصلية إيراد
    if (transaction.type === 'income') {
      const balanceCheck = validateBalanceForExpense(
        cashRegister,
        transaction.amount,
        transaction.paymentMethod
      );
      if (!balanceCheck.valid) {
        return res.status(400).json({
          success: false,
          message: 'لا يمكن إلغاء المعاملة. الرصيد غير كافي للعكس'
        });
      }
    }

    // تحديث المعاملة
    transaction.isActive = false;
    transaction.cancelledAt = new Date();
    transaction.cancelledBy = req.user.id;
    transaction.cancellationReason = reason || 'تم الإلغاء بواسطة المدير';
    await transaction.save({ session });

    // عكس الرصيد
    await updateCashRegisterBalance(
      cashRegister,
      reverseType,
      transaction.amount,
      transaction.paymentMethod,
      session
    );

    // إنشاء سجل التدقيق
    await createAuditLog(
      'cancel',
      'transaction',
      transaction._id,
      transaction.transactionNumber,
      req.user,
      { isActive: true },
      { isActive: false, cancellationReason: transaction.cancellationReason },
      req,
      `إلغاء معاملة رقم ${transaction.transactionNumber}`
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'تم إلغاء المعاملة بنجاح',
      data: {
        transaction,
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
 * @desc    الحصول على إحصائيات المعاملات
 * @route   GET /api/transactions/stats/summary
 * @access  Private
 */
exports.getTransactionStats = async (req, res, next) => {
  try {
    const { startDate, endDate, period = 'month' } = req.query;

    let start, end;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // استخدام الفترة الافتراضية
      const bounds = period === 'day' ? getDayBounds() : getMonthBounds();
      start = bounds.start;
      end = bounds.end;
    }

    // إحصائيات عامة
    const generalStats = await Transaction.getStats(start, end);

    // إحصائيات حسب التصنيف
    const byCategory = await Transaction.getStatsByCategory(start, end);

    // إحصائيات حسب طريقة الدفع
    const byPaymentMethod = await Transaction.getStatsByPaymentMethod(start, end);

    // إحصائيات حسب الموظف (للمدير فقط)
    let byEmployee = [];
    if (req.user.role === 'admin') {
      byEmployee = await Transaction.getStatsByEmployee(start, end);
    }

    // الرصيد الحالي
    const cashRegister = await getOrCreateCashRegister();

    res.json({
      success: true,
      data: {
        period: { start, end },
        summary: generalStats,
        byCategory,
        byPaymentMethod,
        byEmployee,
        currentBalance: {
          total: cashRegister.currentBalance,
          cash: cashRegister.cashBalance,
          card: cashRegister.cardBalance,
          transfer: cashRegister.transferBalance
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    الحصول على ملخص الرصيد
 * @route   GET /api/transactions/balance/summary
 * @access  Private
 */
exports.getBalanceSummary = async (req, res, next) => {
  try {
    const cashRegister = await getOrCreateCashRegister();

    // إحصائيات اليوم من النظام الجديد
    const { start: todayStart, end: todayEnd } = getDayBounds();
    let todayStats = await Transaction.getStats(todayStart, todayEnd);

    // إحصائيات الشهر من النظام الجديد
    const { start: monthStart, end: monthEnd } = getMonthBounds();
    let monthStats = await Transaction.getStats(monthStart, monthEnd);

    // إضافة إحصائيات من النظام القديم
    if (cashRegister && cashRegister.transactions) {
      // معاملات اليوم من النظام القديم
      const oldTodayTransactions = cashRegister.transactions.filter(tx => {
        const txDate = new Date(tx.transactionDate || tx.createdAt);
        return txDate >= todayStart && txDate <= todayEnd;
      });

      const oldTodayIncome = oldTodayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const oldTodayExpense = oldTodayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      todayStats.totalIncome += oldTodayIncome;
      todayStats.totalExpense += oldTodayExpense;
      todayStats.transactionCount += oldTodayTransactions.length;

      // معاملات الشهر من النظام القديم
      const oldMonthTransactions = cashRegister.transactions.filter(tx => {
        const txDate = new Date(tx.transactionDate || tx.createdAt);
        return txDate >= monthStart && txDate <= monthEnd;
      });

      const oldMonthIncome = oldMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const oldMonthExpense = oldMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      monthStats.totalIncome += oldMonthIncome;
      monthStats.totalExpense += oldMonthExpense;
      monthStats.transactionCount += oldMonthTransactions.length;
    }

    res.json({
      success: true,
      data: {
        currentBalance: {
          total: cashRegister.currentBalance || cashRegister.totalBalance || 0,
          cash: cashRegister.cashBalance || 0,
          card: cashRegister.cardBalance || 0,
          transfer: cashRegister.transferBalance || 0
        },
        today: todayStats,
        month: monthStats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    الحصول على تقرير يومي
 * @route   GET /api/transactions/reports/daily
 * @access  Private (Admin)
 */
exports.getDailyReport = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const { start, end } = getDayBounds(targetDate);

    // المعاملات
    const transactions = await Transaction.find({
      isActive: true,
      createdAt: { $gte: start, $lte: end }
    })
      .populate('createdBy', 'name')
      .populate('customer', 'name')
      .sort({ createdAt: -1 });

    // الإحصائيات
    const stats = await Transaction.getStats(start, end);

    // حسب الموظف
    const byEmployee = await Transaction.getStatsByEmployee(start, end);

    // حسب طريقة الدفع
    const byPaymentMethod = await Transaction.getStatsByPaymentMethod(start, end);

    res.json({
      success: true,
      data: {
        date: targetDate,
        transactions,
        stats,
        byEmployee,
        byPaymentMethod
      }
    });
  } catch (error) {
    next(error);
  }
};
