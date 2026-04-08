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
  const mapLink = getMapLink(department, data.city);

  if (!template) {
    // fallback إذا لم يوجد قالب
    return generateConfirmedFallback({ ...data, _mapLink: mapLink }, department?.title || '');
  }

  let message = template
    .replace(/\{اسم_العميل\}/g, data.customerName || '')
    .replace(/\{الجهة\}/g, department?.title || '')
    .replace(/\{التاريخ\}/g, formatDate(data.appointmentDate))
    .replace(/\{الوقت\}/g, formatTime(data.appointmentTime))
    .replace(/\{العدد\}/g, data.personsCount || 1)
    .replace(/\{رابط_الموقع\}/g, mapLink)
    .replace(/\{المدينة\}/g, data.city || '');

  // إضافة المدينة تلقائياً إذا لم يكن القالب يحتوي عليها
  const cityText = data.city || '';
  if (cityText && !template.includes('{المدينة}') && !message.includes(cityText)) {
    message += `\n- المدينة: ${cityText}`;
  }

  // إضافة رسالة تطمينية إذا لم تكن موجودة في القالب
  if (!/سوف نتواصل|سنتواصل|سنقوم بالتواصل/.test(message)) {
    message += `\n\n📞 سوف نتواصل معك قريباً لاستكمال إجراءات التأشيرة.`;
  }

  return message;
};

/**
 * توليد رسالة غير مؤكدة من القالب
 */
export const generateUnconfirmedMessageFromTemplate = (template, data, department) => {
  if (!template) {
    return generateUnconfirmedFallback(data, department?.title || '');
  }

  const mapLink = getMapLink(department, data.city);

  let message = template
    .replace(/\{اسم_العميل\}/g, data.customerName || '')
    .replace(/\{الجهة\}/g, department?.title || '')
    .replace(/\{تاريخ_البداية\}/g, formatDate(data.dateFrom))
    .replace(/\{تاريخ_النهاية\}/g, formatDate(data.dateTo))
    .replace(/\{العدد\}/g, data.personsCount || 1)
    .replace(/\{رابط_الموقع\}/g, mapLink)
    .replace(/\{المدينة\}/g, data.city || '');

  const cityText = data.city || '';
  if (cityText && !template.includes('{المدينة}') && !message.includes(cityText)) {
    message += `\n- المدينة: ${cityText}`;
  }

  if (!/سوف نتواصل|سنتواصل|سنقوم بالتواصل/.test(message)) {
    message += `\n\n📞 سوف نتواصل معك قريباً لاستكمال إجراءات التأشيرة.`;
  }

  return message;
};

/**
 * توليد رسالة التقديم الإلكتروني من القالب
 */
export const generateElectronicSubmissionMessageFromTemplate = (template, data, department) => {
  if (!template) {
    return generateElectronicSubmissionFallback(data, department?.title || '', department?.processingDays || '');
  }

  const submissionDate = data.appointmentDate || data.dateFrom || new Date().toISOString();

  return template
    .replace(/\{اسم_العميل\}/g, data.customerName || '')
    .replace(/\{الجهة\}/g, department?.title || '')
    .replace(/\{التاريخ\}/g, formatDate(submissionDate))
    .replace(/\{العدد\}/g, data.personsCount || 1)
    .replace(/\{مدة_المعالجة\}/g, department?.processingDays || 'غير محددة');
};

/**
 * توليد الرسالة المناسبة حسب النوع ونوع التقديم
 */
export const generateAppointmentMessage = (type, settings, data, department) => {
  // إذا كان تقديم + القسم إلكتروني → رسالة التقديم الإلكتروني
  if (data.isSubmission && department?.submissionType === 'إلكتروني') {
    return generateElectronicSubmissionMessageFromTemplate(
      settings?.electronicSubmissionMessage,
      data,
      department
    );
  }

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

/**
 * توليد رسالة تحديث سريع من القالب
 * @param {string} template - قالب الرسالة من الإعدادات
 * @param {object} data - بيانات الموعد
 * @param {object} department - بيانات القسم
 * @returns {string} الرسالة المولّدة
 */
export const generateQuickUpdateMessage = (template, data, department) => {
  if (!template) return '';

  const submissionDate = data.appointmentDate || data.dateFrom || new Date().toISOString();

  return template
    .replace(/\{اسم_العميل\}/g, data.customerName || '')
    .replace(/\{الجهة\}/g, department?.title || '')
    .replace(/\{التاريخ\}/g, formatDate(submissionDate))
    .replace(/\{العدد\}/g, data.personsCount || 1);
};

// Fallback messages إذا لم يوجد قالب في الإعدادات
const generateConfirmedFallback = (data, deptTitle) => {
  const mapLink = data._mapLink || '';
  return `عزيزي العميل: ${data.customerName} 🤝

نؤكد لك حجز موعدك لدى: ${deptTitle}

📅 تفاصيل الموعد:
- التاريخ: ${formatDate(data.appointmentDate)}
- الوقت: ${formatTime(data.appointmentTime)}
- عدد الأشخاص: ${data.personsCount || 1}
- المدينة: ${data.city || ''}
${mapLink ? `- الموقع: ${mapLink}` : ''}
⏰ الرجاء الحضور قبل الموعد بـ 15 دقيقة.
📞 سوف نتواصل معك قريباً لاستكمال الإجراءات.

مع أطيب التحيات،
ألوان المسافر للسفر والسياحة 🌍`;
};

const generateUnconfirmedFallback = (data, deptTitle) => {
  return `عزيزي العميل: ${data.customerName} 🤝

تم تسجيل طلب موعدك لدى: ${deptTitle}

📅 الفترة المتوقعة للموعد:
- من: ${formatDate(data.dateFrom)}
- إلى: ${formatDate(data.dateTo)}
- عدد الأشخاص: ${data.personsCount || 1}
- المدينة: ${data.city || ''}

📌 ملاحظة مهمة:
هذا الموعد قيد التأكيد، وسنوافيك بالتاريخ والوقت المحدد فور تأكيده.
📞 سوف نتواصل معك قريباً لاستكمال الإجراءات.

مع أطيب التحيات،
ألوان المسافر للسفر والسياحة 🌍`;
};

const generateElectronicSubmissionFallback = (data, deptTitle, processingDays) => {
  const submissionDate = data.appointmentDate || data.dateFrom || new Date().toISOString();
  return `عزيزي العميل: ${data.customerName} 🤝

✅ تم استلام طلبك وتقديمه لدى: ${deptTitle}

📋 تفاصيل الطلب:
- تاريخ التقديم: ${formatDate(submissionDate)}
- عدد الأشخاص: ${data.personsCount || 1}

⏳ مدة المعالجة المتوقعة: ${processingDays || 'غير محددة'}

📌 سنقوم بمتابعة طلبك باستمرار، وسنتواصل معك
فور صدور قرار التأشيرة أو استلام الصور المطلوبة.

مع أطيب التحيات،
ألوان المسافر للسفر والسياحة 🌍`;
};
