/**
 * توليد رسالة من قالب الإعدادات مع استبدال المتغيرات
 */

const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const dayName = DAYS[date.getDay()];
  return `${dayName} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  const hour = parseInt(parts[0]);
  const period = hour < 12 ? 'صباحاً' : 'مساءً';
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  return `${displayHour}:${parts[1]} ${period}`;
};

/**
 * الحصول على رابط الموقع من القسم والمدينة
 */
const getMapLink = (department, cityName) => {
  if (!department || !department.cities || !cityName) return '';
  const city = department.cities.find(c => c.name === cityName);
  return city?.mapLink || '';
};

/**
 * توليد رسالة مؤكدة من القالب
 * @param {string} template - قالب الرسالة من الإعدادات
 * @param {object} data - بيانات الموعد
 * @param {object} department - بيانات القسم (مع المدن)
 * @returns {string} الرسالة المولّدة
 */
export const generateConfirmedMessageFromTemplate = (template, data, department) => {
  if (!template) {
    // fallback إذا لم يوجد قالب
    return generateConfirmedFallback(data, department?.title || '');
  }

  const mapLink = getMapLink(department, data.city);

  return template
    .replace(/\{اسم_العميل\}/g, data.customerName || '')
    .replace(/\{الجهة\}/g, department?.title || '')
    .replace(/\{التاريخ\}/g, formatDate(data.appointmentDate))
    .replace(/\{الوقت\}/g, formatTime(data.appointmentTime))
    .replace(/\{العدد\}/g, data.personsCount || 1)
    .replace(/\{رابط_الموقع\}/g, mapLink)
    .replace(/\{المدينة\}/g, data.city || '');
};

/**
 * توليد رسالة غير مؤكدة من القالب
 */
export const generateUnconfirmedMessageFromTemplate = (template, data, department) => {
  if (!template) {
    return generateUnconfirmedFallback(data, department?.title || '');
  }

  const mapLink = getMapLink(department, data.city);

  return template
    .replace(/\{اسم_العميل\}/g, data.customerName || '')
    .replace(/\{الجهة\}/g, department?.title || '')
    .replace(/\{تاريخ_البداية\}/g, formatDate(data.dateFrom))
    .replace(/\{تاريخ_النهاية\}/g, formatDate(data.dateTo))
    .replace(/\{العدد\}/g, data.personsCount || 1)
    .replace(/\{رابط_الموقع\}/g, mapLink)
    .replace(/\{المدينة\}/g, data.city || '');
};

/**
 * توليد الرسالة المناسبة حسب النوع
 */
export const generateAppointmentMessage = (type, settings, data, department) => {
  if (type === 'confirmed') {
    return generateConfirmedMessageFromTemplate(
      settings?.confirmedMessage,
      data,
      department
    );
  }
  return generateUnconfirmedMessageFromTemplate(
    settings?.unconfirmedMessage,
    data,
    department
  );
};

// Fallback messages إذا لم يوجد قالب في الإعدادات
const generateConfirmedFallback = (data, deptTitle) => {
  return `السلام عليكم ورحمة الله وبركاته
عميلنا العزيز / ${data.customerName}
تم تأكيد موعدكم في ${deptTitle}

📅 يوم ${formatDate(data.appointmentDate)}
⏰ الساعة ${formatTime(data.appointmentTime)}

نتمنى لكم تجربة سعيدة
ألوان المسافر للخدمات`;
};

const generateUnconfirmedFallback = (data, deptTitle) => {
  return `السلام عليكم ورحمة الله وبركاته
عميلنا العزيز / ${data.customerName}
تم حجز موعدكم في ${deptTitle}

📅 الموعد متوقع بين ${formatDate(data.dateFrom)} و ${formatDate(data.dateTo)}
سيتم إبلاغكم بالتاريخ المحدد قريباً

نتمنى لكم تجربة سعيدة
ألوان المسافر للخدمات`;
};
