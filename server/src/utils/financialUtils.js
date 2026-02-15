const CashRegister = require('../models/CashRegister');
const AuditLog = require('../models/AuditLog');

/**
 * تحديث أرصدة الصندوق
 * @param {Object} cashRegister - كائن الصندوق
 * @param {String} type - نوع المعاملة (income/expense)
 * @param {Number} amount - المبلغ
 * @param {String} paymentMethod - طريقة الدفع (cash/card/transfer)
 * @param {Object} session - جلسة MongoDB (اختياري)
 */
const updateCashRegisterBalance = async (cashRegister, type, amount, paymentMethod, session = null) => {
  const multiplier = type === 'income' ? 1 : -1;

  // تحديث الرصيد الإجمالي
  cashRegister.currentBalance += amount * multiplier;

  // تحديث الرصيد حسب طريقة الدفع
  switch (paymentMethod) {
    case 'cash':
      cashRegister.cashBalance += amount * multiplier;
      break;
    case 'card':
      cashRegister.cardBalance += amount * multiplier;
      break;
    case 'transfer':
      cashRegister.transferBalance += amount * multiplier;
      break;
    default:
      cashRegister.cashBalance += amount * multiplier;
  }

  // حفظ التغييرات
  if (session) {
    await cashRegister.save({ session });
  } else {
    await cashRegister.save();
  }

  return cashRegister;
};

/**
 * التحقق من كفاية الرصيد للمصروفات
 * @param {Object} cashRegister - كائن الصندوق
 * @param {Number} amount - المبلغ المطلوب
 * @param {String} paymentMethod - طريقة الدفع
 * @returns {Object} - { valid: boolean, message: string }
 */
const validateBalanceForExpense = (cashRegister, amount, paymentMethod) => {
  let availableBalance = 0;
  let balanceType = '';

  switch (paymentMethod) {
    case 'cash':
      availableBalance = cashRegister.cashBalance;
      balanceType = 'النقدي';
      break;
    case 'card':
      availableBalance = cashRegister.cardBalance;
      balanceType = 'البطاقات';
      break;
    case 'transfer':
      availableBalance = cashRegister.transferBalance;
      balanceType = 'التحويلات';
      break;
    default:
      availableBalance = cashRegister.cashBalance;
      balanceType = 'النقدي';
  }

  if (amount > availableBalance) {
    return {
      valid: false,
      message: `الرصيد ${balanceType} غير كافي. المتاح: ${availableBalance} ريال`,
      availableBalance
    };
  }

  return { valid: true, availableBalance };
};

/**
 * إنشاء سجل تدقيق
 * @param {String} action - نوع الإجراء
 * @param {String} entityType - نوع الكيان
 * @param {ObjectId} entityId - معرف الكيان
 * @param {String} entityNumber - رقم الكيان
 * @param {Object} user - بيانات المستخدم
 * @param {Object} before - البيانات قبل التغيير
 * @param {Object} after - البيانات بعد التغيير
 * @param {Object} req - كائن الطلب (للحصول على IP و User Agent)
 * @param {String} description - وصف إضافي
 * @param {Object} metadata - بيانات إضافية
 */
const createAuditLog = async (action, entityType, entityId, entityNumber, user, before, after, req, description = '', metadata = {}) => {
  try {
    await AuditLog.log({
      action,
      entityType,
      entityId,
      entityNumber,
      user: {
        _id: user._id || user.id,
        name: user.name,
        role: user.role
      },
      changes: { before, after },
      req,
      description,
      metadata
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    // لا نرمي الخطأ لأن فشل التدقيق لا يجب أن يوقف العملية الرئيسية
  }
};

/**
 * الحصول على الصندوق أو إنشاؤه
 */
const getOrCreateCashRegister = async () => {
  return await CashRegister.getOrCreate();
};

/**
 * حساب الرصيد الحالي من المعاملات
 * @param {Array} transactions - مصفوفة المعاملات
 */
const calculateBalanceFromTransactions = (transactions) => {
  return transactions.reduce((balance, tx) => {
    if (!tx.isActive) return balance;
    return tx.type === 'income' ? balance + tx.amount : balance - tx.amount;
  }, 0);
};

/**
 * تنسيق المبلغ للعرض
 * @param {Number} amount - المبلغ
 * @param {String} currency - العملة (افتراضي SAR)
 */
const formatAmount = (amount, currency = 'SAR') => {
  return new Intl.NumberFormat('en-SA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount || 0) + ' ' + currency;
};

/**
 * الحصول على بداية ونهاية اليوم
 */
const getDayBounds = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * الحصول على بداية ونهاية الشهر
 */
const getMonthBounds = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

/**
 * الحصول على بداية ونهاية السنة
 */
const getYearBounds = (date = new Date()) => {
  const start = new Date(date.getFullYear(), 0, 1);
  const end = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
  return { start, end };
};

/**
 * تصنيفات المعاملات بالعربية
 */
const TRANSACTION_CATEGORIES = {
  appointment_payment: 'دفعة موعد',
  invoice_payment: 'دفعة فاتورة',
  expense: 'مصروف',
  salary: 'راتب',
  commission: 'عمولة',
  refund: 'استرداد',
  deposit: 'إيداع',
  withdrawal: 'سحب',
  other: 'أخرى'
};

/**
 * طرق الدفع بالعربية
 */
const PAYMENT_METHODS = {
  cash: 'نقدي',
  card: 'شبكة',
  transfer: 'تحويل'
};

/**
 * أنواع المعاملات بالعربية
 */
const TRANSACTION_TYPES = {
  income: 'إيراد',
  expense: 'مصروف'
};

/**
 * حالات الإيصال بالعربية
 */
const RECEIPT_STATUSES = {
  active: 'نشط',
  converted: 'محول لفاتورة',
  cancelled: 'ملغي'
};

/**
 * إجراءات التدقيق بالعربية
 */
const AUDIT_ACTIONS = {
  create: 'إنشاء',
  update: 'تعديل',
  delete: 'حذف',
  payment: 'دفعة',
  convert: 'تحويل',
  cancel: 'إلغاء',
  refund: 'استرداد',
  view: 'عرض',
  export: 'تصدير',
  print: 'طباعة'
};

module.exports = {
  updateCashRegisterBalance,
  validateBalanceForExpense,
  createAuditLog,
  getOrCreateCashRegister,
  calculateBalanceFromTransactions,
  formatAmount,
  getDayBounds,
  getMonthBounds,
  getYearBounds,
  TRANSACTION_CATEGORIES,
  PAYMENT_METHODS,
  TRANSACTION_TYPES,
  RECEIPT_STATUSES,
  AUDIT_ACTIONS
};
