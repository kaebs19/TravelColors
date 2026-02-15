const { CashRegister, Invoice, User } = require('../models');

// @desc    الحصول على بيانات الصندوق
// @route   GET /api/cash-register
// @access  Private
exports.getCashRegister = async (req, res, next) => {
  try {
    const cashRegister = await CashRegister.getOrCreate();

    // جلب آخر 50 حركة
    const recentTransactions = cashRegister.transactions
      .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
      .slice(0, 50);

    // جلب أسماء الموظفين
    const userIds = [...new Set(recentTransactions.map(t => t.createdBy))];
    const users = await User.find({ _id: { $in: userIds } }).select('name');
    const userMap = {};
    users.forEach(u => userMap[u._id.toString()] = u.name);

    const transactionsWithNames = recentTransactions.map(t => ({
      ...t.toObject(),
      employeeName: userMap[t.createdBy?.toString()] || 'غير معروف'
    }));

    res.json({
      success: true,
      data: {
        balance: {
          total: cashRegister.currentBalance,
          cash: cashRegister.cashBalance,
          card: cashRegister.cardBalance,
          transfer: cashRegister.transferBalance
        },
        isOpen: cashRegister.isOpen,
        lastOpenedAt: cashRegister.lastOpenedAt,
        transactions: transactionsWithNames
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على الحركات المالية
// @route   GET /api/cash-register/transactions
// @access  Private
exports.getTransactions = async (req, res, next) => {
  try {
    const { type, category, paymentMethod, startDate, endDate, page = 1, limit = 50 } = req.query;

    const cashRegister = await CashRegister.getOrCreate();

    let transactions = cashRegister.transactions;

    // تطبيق الفلاتر
    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }
    if (category) {
      transactions = transactions.filter(t => t.category === category);
    }
    if (paymentMethod) {
      transactions = transactions.filter(t => t.paymentMethod === paymentMethod);
    }
    if (startDate || endDate) {
      transactions = transactions.filter(t => {
        const date = new Date(t.transactionDate);
        if (startDate && date < new Date(startDate)) return false;
        if (endDate && date > new Date(endDate)) return false;
        return true;
      });
    }

    // ترتيب حسب التاريخ
    transactions.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));

    // تقسيم الصفحات
    const total = transactions.length;
    const skip = (page - 1) * limit;
    const paginatedTransactions = transactions.slice(skip, skip + parseInt(limit));

    // جلب أسماء الموظفين
    const userIds = [...new Set(paginatedTransactions.map(t => t.createdBy))];
    const users = await User.find({ _id: { $in: userIds } }).select('name');
    const userMap = {};
    users.forEach(u => userMap[u._id.toString()] = u.name);

    const transactionsWithNames = paginatedTransactions.map(t => ({
      ...t.toObject(),
      employeeName: userMap[t.createdBy?.toString()] || 'غير معروف'
    }));

    // إحصائيات الفترة
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      data: {
        transactions: transactionsWithNames,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        },
        summary: {
          totalIncome: income,
          totalExpense: expense,
          netAmount: income - expense
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إضافة حركة مالية
// @route   POST /api/cash-register/transaction
// @access  Private
exports.addTransaction = async (req, res, next) => {
  try {
    const { type, amount, description, category, paymentMethod = 'cash', notes, invoice, customer } = req.body;

    if (!type || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال جميع البيانات المطلوبة'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'المبلغ يجب أن يكون أكبر من صفر'
      });
    }

    const cashRegister = await CashRegister.getOrCreate();

    // التحقق من الرصيد في حالة السحب
    if (type === 'expense') {
      if (paymentMethod === 'cash' && amount > cashRegister.cashBalance) {
        return res.status(400).json({
          success: false,
          message: 'الرصيد النقدي غير كافي'
        });
      }
    }

    const transaction = await cashRegister.addTransaction({
      type,
      amount,
      description,
      category: category || 'other',
      paymentMethod,
      notes,
      invoice,
      customer,
      createdBy: req.user.id,
      transactionDate: new Date()
    });

    // جلب اسم الموظف
    const user = await User.findById(req.user.id).select('name');

    res.status(201).json({
      success: true,
      message: type === 'income' ? 'تم إضافة الإيراد بنجاح' : 'تم تسجيل المصروف بنجاح',
      data: {
        transaction: {
          ...transaction.toObject(),
          employeeName: user?.name || 'غير معروف'
        },
        newBalance: {
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

// @desc    الحصول على تقرير الصندوق
// @route   GET /api/cash-register/report
// @access  Private (Admin)
exports.getCashReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const cashRegister = await CashRegister.getOrCreate();

    // فلترة الحركات حسب الفترة
    const periodTransactions = cashRegister.transactions.filter(t => {
      const date = new Date(t.transactionDate);
      return date >= start && date <= end;
    });

    // تجميع حسب الموظف
    const employeeStats = {};
    periodTransactions.forEach(t => {
      const empId = t.createdBy?.toString() || 'unknown';
      if (!employeeStats[empId]) {
        employeeStats[empId] = {
          income: 0,
          expense: 0,
          transactionCount: 0
        };
      }
      if (t.type === 'income') {
        employeeStats[empId].income += t.amount;
      } else {
        employeeStats[empId].expense += t.amount;
      }
      employeeStats[empId].transactionCount++;
    });

    // جلب أسماء الموظفين
    const userIds = Object.keys(employeeStats).filter(id => id !== 'unknown');
    const users = await User.find({ _id: { $in: userIds } }).select('name');
    const userMap = {};
    users.forEach(u => userMap[u._id.toString()] = u.name);

    const employeeReport = Object.entries(employeeStats).map(([id, stats]) => ({
      employeeId: id,
      employeeName: userMap[id] || 'غير معروف',
      ...stats,
      netAmount: stats.income - stats.expense
    }));

    // تجميع حسب طريقة الدفع
    const paymentMethodStats = {
      cash: { income: 0, expense: 0 },
      card: { income: 0, expense: 0 },
      transfer: { income: 0, expense: 0 }
    };

    periodTransactions.forEach(t => {
      const method = t.paymentMethod || 'cash';
      if (paymentMethodStats[method]) {
        if (t.type === 'income') {
          paymentMethodStats[method].income += t.amount;
        } else {
          paymentMethodStats[method].expense += t.amount;
        }
      }
    });

    // تجميع حسب التصنيف
    const categoryStats = {};
    periodTransactions.forEach(t => {
      const cat = t.category || 'other';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { income: 0, expense: 0, count: 0 };
      }
      if (t.type === 'income') {
        categoryStats[cat].income += t.amount;
      } else {
        categoryStats[cat].expense += t.amount;
      }
      categoryStats[cat].count++;
    });

    // تجميع حسب اليوم
    const dailyStats = {};
    periodTransactions.forEach(t => {
      const dateKey = new Date(t.transactionDate).toISOString().split('T')[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { income: 0, expense: 0, count: 0 };
      }
      if (t.type === 'income') {
        dailyStats[dateKey].income += t.amount;
      } else {
        dailyStats[dateKey].expense += t.amount;
      }
      dailyStats[dateKey].count++;
    });

    const totalIncome = periodTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = periodTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      data: {
        period: { start, end },
        summary: {
          totalIncome,
          totalExpense,
          netAmount: totalIncome - totalExpense,
          transactionCount: periodTransactions.length
        },
        currentBalance: {
          total: cashRegister.currentBalance,
          cash: cashRegister.cashBalance,
          card: cashRegister.cardBalance,
          transfer: cashRegister.transferBalance
        },
        byEmployee: employeeReport,
        byPaymentMethod: paymentMethodStats,
        byCategory: categoryStats,
        byDay: dailyStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على ملخص اليوم
// @route   GET /api/cash-register/today
// @access  Private
exports.getTodaySummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const cashRegister = await CashRegister.getOrCreate();

    const todayTransactions = cashRegister.transactions.filter(t => {
      const date = new Date(t.transactionDate);
      return date >= today && date < tomorrow;
    });

    const income = todayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = todayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    // عدد الفواتير اليوم
    const todayInvoices = await Invoice.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    res.json({
      success: true,
      data: {
        date: today,
        income,
        expense,
        netAmount: income - expense,
        transactionCount: todayTransactions.length,
        invoiceCount: todayInvoices,
        currentBalance: cashRegister.currentBalance
      }
    });
  } catch (error) {
    next(error);
  }
};
