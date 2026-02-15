// ===== تحويل الأرقام =====

// تحويل الأرقام العربية إلى إنجليزية
export const arabicToEnglishNumbers = (str) => {
  if (!str && str !== 0) return '';
  const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = str.toString();
  for (let i = 0; i < arabicNums.length; i++) {
    result = result.replace(new RegExp(arabicNums[i], 'g'), i.toString());
  }
  return result;
};

// تحويل الأرقام الإنجليزية إلى عربية
export const englishToArabicNumbers = (str) => {
  if (!str && str !== 0) return '';
  const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = str.toString();
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(i.toString(), 'g'), arabicNums[i]);
  }
  return result;
};

// تنظيف وتحويل رقم الهاتف (يقبل عربي أو إنجليزي)
export const normalizePhoneNumber = (phone) => {
  if (!phone) return '';
  // تحويل الأرقام العربية للإنجليزية أولاً
  let normalized = arabicToEnglishNumbers(phone);
  // إزالة كل شيء غير الأرقام
  normalized = normalized.replace(/[^0-9]/g, '');
  return normalized;
};

// تنظيف وتحويل أي رقم (يقبل عربي أو إنجليزي)
export const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === '') return '';
  // تحويل الأرقام العربية للإنجليزية
  let normalized = arabicToEnglishNumbers(value.toString());
  // إزالة كل شيء غير الأرقام والنقطة
  normalized = normalized.replace(/[^0-9.]/g, '');
  return normalized;
};

// تحويل لرقم مع دعم الأرقام العربية
export const parseArabicNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const normalized = normalizeNumber(value);
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

// ===== تنسيق التاريخ والوقت =====

// تنسيق التاريخ (مع أرقام إنجليزية)
export const formatDate = (date, options = {}) => {
  if (!date) return '';

  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };

  // استخدام ar-u-nu-latn لعرض الأرقام الإنجليزية
  return new Date(date).toLocaleDateString('ar-u-nu-latn', defaultOptions);
};

// تنسيق التاريخ والوقت (مع أرقام إنجليزية)
export const formatDateTime = (date) => {
  if (!date) return '';

  return new Date(date).toLocaleDateString('ar-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// تنسيق العملة (مع أرقام إنجليزية)
export const formatCurrency = (amount, currency = 'SAR') => {
  if (amount === null || amount === undefined) return '';

  // استخدام en-SA للحصول على أرقام إنجليزية مع تنسيق سعودي
  return new Intl.NumberFormat('en-SA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount) + ' ' + currency;
};

// تنسيق الأرقام (مع أرقام إنجليزية)
export const formatNumber = (number) => {
  if (number === null || number === undefined) return '';

  return new Intl.NumberFormat('en-SA').format(number);
};

// تنسيق رقم الهاتف
export const formatPhone = (phone) => {
  if (!phone) return '';

  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');

  // Format for Saudi numbers
  if (cleaned.length === 10 && cleaned.startsWith('05')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  return phone;
};

// اختصار النص
export const truncate = (text, length = 100) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
};

// حساب المدة بين تاريخين
export const getDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return '';

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'يوم واحد';
  if (diffDays === 2) return 'يومان';
  if (diffDays <= 10) return `${diffDays} أيام`;
  return `${diffDays} يوم`;
};

// أسماء الأيام بالعربية
export const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// أسماء الأشهر بالعربية
export const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// تنسيق عرض التاريخ مع اسم اليوم
export const formatDateDisplay = (dateStr, includeYear = false) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  if (includeYear) {
    return `${ARABIC_DAYS[date.getDay()]} / ${day}/${month}/${year}`;
  }
  return `${ARABIC_DAYS[date.getDay()]} / ${day}/${month}`;
};

// تنسيق الوقت بصيغة ص/م
export const formatTimeDisplay = (time) => {
  if (!time) return '-';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const period = h < 12 ? 'ص' : 'م';
  const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return `${displayHour}:${minutes} ${period}`;
};

// توليد ساعات العمل
export const generateHourSlots = (startHour = 8, endHour = 14) => {
  const slots = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    const h = hour.toString().padStart(2, '0');
    const period = hour < 12 ? 'ص' : 'م';
    const displayHour = hour > 12 ? hour - 12 : hour;
    slots.push({ value: `${h}:00`, label: `${displayHour} ${period}` });
  }
  return slots;
};

// التحقق من الفترة الزمنية
export const isDateInPeriod = (date, period) => {
  if (!period || !date) return true;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const checkDate = new Date(date);

  if (period === 'today') return checkDate >= today && checkDate < tomorrow;
  if (period === 'tomorrow') return checkDate >= tomorrow && checkDate < dayAfterTomorrow;
  if (period === 'month') return checkDate >= monthStart && checkDate <= monthEnd;

  return true;
};

// الحصول على بداية ونهاية اليوم
export const getDayBounds = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// الحصول على بداية ونهاية الشهر
export const getMonthBounds = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

// تحويل رقم الهاتف للتنسيق الدولي
export const formatPhoneInternational = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    return '966' + cleaned.slice(1);
  }
  return cleaned;
};

// إنشاء رابط واتساب
export const createWhatsAppLink = (phone, message = '') => {
  const phoneNumber = formatPhoneInternational(phone);
  const encodedMessage = encodeURIComponent(message);
  return phoneNumber
    ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;
};
