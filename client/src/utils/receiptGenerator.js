import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * بناء HTML الإيصال المشترك
 */
const buildReceiptHTML = (appointmentData, options = {}) => {
  const {
    departmentTitle = 'غير محدد',
    employeeName = 'موظف النظام',
    logoUrl = '/logo512.png',
    companyName = 'ألوان المسافر',
    companyNameEn = 'Travel Colors',
    companyPhone = '0558741741',
    companyEmail = 'info@trcolors.com',
    companyAddress = 'الرياض - حي الصحافة',
    receiptSettings = {},
    receiptTerms = ''
  } = options;

  // إعدادات العناصر الظاهرة (الافتراضي: الكل مفعّل)
  const showCompanyInfo = receiptSettings.showCompanyInfo !== false;
  const showPaymentDetails = receiptSettings.showPaymentDetails !== false;
  const showEmployeeName = receiptSettings.showEmployeeName !== false;
  const showTerms = receiptSettings.showTerms !== false;

  const receiptNumber = `RCP-${Date.now().toString().slice(-8)}`;
  const today = new Date();
  const receiptDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  const receiptTime = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;

  let appointmentDateStr = '';
  let appointmentTimeStr = '';
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const isElectronicSubmission = appointmentData.isSubmission && appointmentData.department?.submissionType === 'إلكتروني';

  if (isElectronicSubmission && appointmentData.appointmentDate) {
    // تقديم إلكتروني: عرض التاريخ فقط بدون وقت
    const date = new Date(appointmentData.appointmentDate);
    appointmentDateStr = `${days[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    appointmentTimeStr = '—';
  } else if (appointmentData.type === 'confirmed' && appointmentData.appointmentDate) {
    const date = new Date(appointmentData.appointmentDate);
    appointmentDateStr = `${days[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    if (appointmentData.appointmentTime) {
      const timeParts = appointmentData.appointmentTime.split(':');
      const hour = parseInt(timeParts[0]);
      const period = hour < 12 ? 'صباحاً' : 'مساءً';
      const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
      appointmentTimeStr = `${displayHour}:${timeParts[1]} ${period}`;
    }
  } else if (appointmentData.dateFrom && appointmentData.dateTo) {
    const dateFrom = new Date(appointmentData.dateFrom);
    const dateTo = new Date(appointmentData.dateTo);
    appointmentDateStr = `من ${dateFrom.getDate()}/${dateFrom.getMonth() + 1}/${dateFrom.getFullYear()} إلى ${dateTo.getDate()}/${dateTo.getMonth() + 1}/${dateTo.getFullYear()}`;
  }

  const statusMap = {
    new: { text: 'جديد', color: '#1e40af', bg: '#dbeafe' },
    in_progress: { text: 'قيد العمل', color: '#b45309', bg: '#fef3c7' },
    completed: { text: 'مكتمل', color: '#065f46', bg: '#d1fae5' },
    cancelled: { text: 'ملغي', color: '#991b1b', bg: '#fee2e2' }
  };
  const typeStatusMap = {
    confirmed: { text: '✓ مؤكد', color: '#2F9E44', bg: '#EBFBEE' },
    unconfirmed: { text: '◌ غير مؤكد', color: '#E67700', bg: '#FFF9DB' },
    electronic: { text: '📤 تقديم إلكتروني', color: '#3B5BDB', bg: '#EEF2FF' }
  };

  const isElectronic = appointmentData.isSubmission && appointmentData.department?.submissionType === 'إلكتروني';
  const appointmentStatus = statusMap[appointmentData.status] || statusMap.new;
  const typeStatus = isElectronic
    ? typeStatusMap.electronic
    : (typeStatusMap[appointmentData.type] || typeStatusMap.confirmed);

  const paymentLabels = { cash: 'نقدي', card: 'شبكة', transfer: 'تحويل بنكي' };
  const paymentLabel = paymentLabels[appointmentData.paymentType] || '-';
  const totalAmount = parseFloat(appointmentData.totalAmount) || 0;
  const paidAmount = parseFloat(appointmentData.paidAmount) || 0;
  const remaining = totalAmount - paidAmount;

  // نص التذييل
  const footerTerms = receiptTerms || `شكراً لاختياركم ${companyName}\nنتمنى لكم رحلة سعيدة`;

  // ═══════════════════════════════════════════════════════════
  // تصميم هادئ — ألوان دافئة ومريحة، تخطيط واسع، قراءة مريحة
  // ═══════════════════════════════════════════════════════════
  const C = {
    bg: '#fbfaf6',           // كريمي فاتح جداً
    card: '#ffffff',
    border: '#e8e3d7',       // حدود كريمية ناعمة
    borderLight: '#f0ebe0',
    primary: '#4a6572',      // أزرق رمادي ناعم
    primaryDark: '#2f3e46',
    primarySoft: '#eef2f4',
    accent: '#c8a44e',       // ذهبي
    accentSoft: '#f7efd8',
    sage: '#6b9d7e',         // أخضر مريم
    sageSoft: '#e8f1ea',
    danger: '#c05746',       // أحمر دافئ
    dangerSoft: '#faebe7',
    text: '#2f3e46',
    textMuted: '#7c8a92',
    textLight: '#a8b3ba'
  };

  const row = (label, value, valueDir = '') => `
    <div style="display: flex; align-items: center; padding: 6px 0; border-bottom: 1px dashed ${C.borderLight}; font-family: 'Tajawal', sans-serif;">
      <span style="color: ${C.textMuted}; font-size: 11px; font-weight: 500; min-width: 90px;">${label}</span>
      <span style="color: ${C.text}; font-size: 12px; font-weight: 600; flex: 1;"${valueDir ? ` dir="${valueDir}"` : ''}>${value}</span>
    </div>
  `;

  const sectionTitle = (icon, title, color = C.primary) => `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
      <span style="font-size: 14px;">${icon}</span>
      <span style="font-size: 13px; color: ${color}; font-weight: 700; font-family: 'Tajawal', sans-serif;">${title}</span>
      <span style="flex: 1; height: 1px; background: ${C.borderLight};"></span>
    </div>
  `;

  return `
    <div style="background: ${C.bg}; border-radius: 14px; overflow: hidden; font-family: 'Tajawal', sans-serif; border: 1px solid ${C.border};">

      <!-- رأس الإيصال — بسيط ونظيف -->
      <div style="background: ${C.card}; padding: 20px 22px 16px; border-bottom: 1px solid ${C.border};">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${logoUrl}" alt="Logo" style="width: 54px; height: 54px; border-radius: 10px; object-fit: contain;" crossorigin="anonymous" />
            <div>
              <div style="font-size: 18px; font-weight: 800; color: ${C.primaryDark}; font-family: 'Tajawal', sans-serif; line-height: 1.3;">${companyName}</div>
              <div style="font-size: 11px; color: ${C.textMuted}; font-weight: 500; font-family: 'Tajawal', sans-serif; margin-top: 2px;">${companyNameEn} · للسفر والسياحة</div>
            </div>
          </div>
          <div style="text-align: center; padding: 8px 14px; background: ${C.accentSoft}; border-radius: 10px; border: 1px solid ${C.accent};">
            <div style="font-size: 10px; color: ${C.primary}; font-weight: 600; font-family: 'Tajawal', sans-serif;">رقم الإيصال</div>
            <div style="font-size: 13px; color: ${C.primaryDark}; font-weight: 800; font-family: 'Tajawal', sans-serif; margin-top: 2px;">${receiptNumber}</div>
          </div>
        </div>

        ${showCompanyInfo ? `
        <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed ${C.border}; display: flex; justify-content: space-between; font-size: 10px; color: ${C.textMuted}; font-family: 'Tajawal', sans-serif;">
          <span>📍 ${companyAddress}</span>
          <span>📞 ${companyPhone}</span>
          <span>✉️ ${companyEmail}</span>
        </div>
        <div style="margin-top: 8px; text-align: center; font-size: 10px; color: ${C.accent}; font-weight: 700; font-family: 'Tajawal', sans-serif; padding: 5px 0; background: ${C.accentSoft}; border-radius: 6px;">
          مرخص من هيئة السياحة رقم ٧٣١٠٤٨٧٧
        </div>
        ` : ''}
      </div>

      <!-- شريط العنوان -->
      <div style="background: ${C.primarySoft}; padding: 12px 22px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 15px; color: ${C.primaryDark}; font-weight: 700; font-family: 'Tajawal', sans-serif;">إيصال موعد</div>
          <div style="font-size: 9px; color: ${C.textLight}; font-family: 'Tajawal', sans-serif; letter-spacing: 1px;">APPOINTMENT RECEIPT</div>
        </div>
        <div style="text-align: left; font-size: 10px; color: ${C.textMuted}; font-family: 'Tajawal', sans-serif;">
          <div>التاريخ: <span style="color: ${C.text}; font-weight: 700;">${receiptDate}</span></div>
          <div style="margin-top: 2px;">الوقت: <span style="color: ${C.text}; font-weight: 700;">${receiptTime}</span></div>
        </div>
      </div>

      <!-- محتوى الإيصال -->
      <div style="padding: 20px 22px; background: ${C.card};">

        <!-- بيانات العميل -->
        <div style="margin-bottom: 18px;">
          ${sectionTitle('👤', 'بيانات العميل', C.primary)}
          ${row('الاسم', appointmentData.customerName || '-')}
          ${row('الجوال', appointmentData.phone || '-', 'ltr')}
          ${row('عدد الأشخاص', `${appointmentData.personsCount || 1} شخص`)}
        </div>

        <!-- تفاصيل الموعد -->
        <div style="margin-bottom: 18px;">
          ${sectionTitle('📅', 'تفاصيل الموعد', C.sage)}
          ${row('الجهة', departmentTitle)}
          ${row('المدينة', appointmentData.city || 'الرياض')}
          ${row('التاريخ', appointmentDateStr || '-')}
          ${appointmentTimeStr ? row('الوقت', appointmentTimeStr) : ''}
          <div style="display: flex; gap: 8px; padding: 8px 0;">
            <span style="background: ${typeStatus.bg}; color: ${typeStatus.color}; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; font-family: 'Tajawal', sans-serif;">${typeStatus.text}</span>
            <span style="background: ${appointmentStatus.bg}; color: ${appointmentStatus.color}; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; font-family: 'Tajawal', sans-serif;">${appointmentStatus.text}</span>
          </div>
        </div>

        ${totalAmount > 0 && showPaymentDetails ? `
        <!-- بيانات الدفع -->
        <div style="background: ${C.sageSoft}; padding: 14px 16px; border-radius: 10px; border: 1px solid ${C.sage}33; margin-bottom: 14px;">
          ${sectionTitle('💰', 'بيانات الدفع', C.sage)}
          ${row('طريقة الدفع', paymentLabel)}
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-family: 'Tajawal', sans-serif;">
            <span style="color: ${C.textMuted}; font-size: 12px; font-weight: 500;">المبلغ الإجمالي</span>
            <span style="color: ${C.text}; font-size: 13px; font-weight: 700;">${totalAmount.toFixed(2)} ر.س</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 1px dashed ${C.sage}40; font-family: 'Tajawal', sans-serif;">
            <span style="color: ${C.sage}; font-size: 12px; font-weight: 600;">المدفوع</span>
            <span style="color: ${C.sage}; font-size: 13px; font-weight: 700;">${paidAmount.toFixed(2)} ر.س</span>
          </div>
          ${remaining > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-top: 8px; padding: 10px 12px; background: ${C.dangerSoft}; border-radius: 8px; font-family: 'Tajawal', sans-serif;">
            <span style="color: ${C.danger}; font-size: 12px; font-weight: 700;">المتبقي</span>
            <span style="color: ${C.danger}; font-size: 14px; font-weight: 800;">${remaining.toFixed(2)} ر.س</span>
          </div>
          ` : `
          <div style="margin-top: 10px; text-align: center;">
            <span style="background: ${C.sage}; color: white; padding: 5px 16px; border-radius: 20px; font-size: 11px; font-weight: 700; font-family: 'Tajawal', sans-serif;">✓ تم السداد بالكامل</span>
          </div>
          `}
        </div>
        ` : ''}

        ${showEmployeeName ? `
        <!-- معلومات الموظف -->
        <div style="padding: 8px 12px; background: ${C.primarySoft}; border-radius: 6px; display: flex; justify-content: space-between; font-size: 10px; color: ${C.textMuted}; font-family: 'Tajawal', sans-serif;">
          <span>المستخدم: <span style="color: ${C.primary}; font-weight: 700;">${employeeName}</span></span>
          <span>${receiptDate} — ${receiptTime}</span>
        </div>
        ` : ''}
      </div>

      ${showTerms ? `
      <!-- تذييل الإيصال — دافئ وبسيط -->
      <div style="background: ${C.primarySoft}; padding: 14px 22px; text-align: center; border-top: 2px solid ${C.accent};">
        <div style="font-size: 11px; color: ${C.primaryDark}; font-weight: 600; font-family: 'Tajawal', sans-serif; white-space: pre-line; line-height: 1.7;">${footerTerms}</div>
        <div style="margin-top: 6px; font-size: 9px; color: ${C.textLight}; font-family: 'Tajawal', sans-serif; letter-spacing: 0.5px;">www.trcolors.com</div>
      </div>
      ` : ''}
    </div>
  `;
};

/**
 * دالة مساعدة لتحويل HTML إلى PDF صفحة واحدة
 */
const htmlToPdf = async (receiptContainer) => {
  await document.fonts.ready;

  const canvas = await html2canvas(receiptContainer, {
    scale: 1.5,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#f5f3ef'
  });

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const maxWidth = pageWidth - (margin * 2);
  const maxHeight = pageHeight - (margin * 2);

  const imgWidth = maxWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // إذا الصورة أطول من الصفحة، تصغيرها لتناسب صفحة واحدة
  let finalWidth = imgWidth;
  let finalHeight = imgHeight;

  if (imgHeight > maxHeight) {
    const ratio = maxHeight / imgHeight;
    finalHeight = maxHeight;
    finalWidth = imgWidth * ratio;
  }

  const xOffset = (pageWidth - finalWidth) / 2;
  const yOffset = margin;

  // JPEG بجودة 0.85 — أصغر بـ ~85% من PNG مع جودة بصرية ممتازة
  doc.addImage(canvas.toDataURL('image/jpeg', 0.85), 'JPEG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');

  return doc;
};

/**
 * دالة إنشاء إيصال PDF مع دعم العربية
 */
export const generateAppointmentReceipt = async (appointmentData, options = {}) => {
  const receiptContainer = document.createElement('div');
  receiptContainer.id = 'pdf-receipt-container';
  receiptContainer.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 480px;
    padding: 20px;
    background: #f5f3ef;
    font-family: 'Tajawal', sans-serif;
    direction: rtl;
  `;

  receiptContainer.innerHTML = buildReceiptHTML(appointmentData, options);
  document.body.appendChild(receiptContainer);

  try {
    const doc = await htmlToPdf(receiptContainer);
    const fileName = `receipt_${appointmentData.customerName?.replace(/\s+/g, '_') || 'customer'}_${Date.now()}.pdf`;
    doc.save(fileName);
    return { success: true, fileName };
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('حدث خطأ أثناء إنشاء ملف PDF');
  } finally {
    document.body.removeChild(receiptContainer);
  }
};

/**
 * دالة مشاركة الإيصال عبر واتساب
 */
export const shareReceiptToWhatsApp = async (appointmentData, options = {}) => {
  const receiptContainer = document.createElement('div');
  receiptContainer.id = 'pdf-receipt-container';
  receiptContainer.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 480px;
    padding: 20px;
    background: #f5f3ef;
    font-family: 'Tajawal', sans-serif;
    direction: rtl;
  `;

  receiptContainer.innerHTML = buildReceiptHTML(appointmentData, options);
  document.body.appendChild(receiptContainer);

  try {
    const doc = await htmlToPdf(receiptContainer);
    const fileName = `receipt_${appointmentData.customerName?.replace(/\s+/g, '_') || 'customer'}_${Date.now()}.pdf`;
    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        files: [pdfFile],
        title: `إيصال موعد - ${appointmentData.customerName}`,
        text: `إيصال موعد للعميل ${appointmentData.customerName}`
      });
      return { success: true, method: 'share' };
    } else {
      doc.save(fileName);

      const phone = appointmentData.phone?.replace(/[^0-9]/g, '');
      const phoneNumber = phone?.startsWith('0') ? '966' + phone.slice(1) : phone;
      const companyName = options.companyName || 'ألوان المسافر';
      const message = `مرحباً ${appointmentData.customerName}،\n\nمرفق إيصال موعدكم في ${companyName}.\n\nيرجى الاحتفاظ بهذا الإيصال.\n\nشكراً لاختياركم ${companyName}`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = phoneNumber
        ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
        : `https://wa.me/?text=${encodedMessage}`;

      window.open(whatsappUrl, '_blank');
      return { success: true, method: 'download_and_whatsapp', message: 'تم تحميل الإيصال، يرجى إرفاقه يدوياً في المحادثة' };
    }
  } catch (error) {
    console.error('Error sharing PDF:', error);
    throw new Error('حدث خطأ أثناء مشاركة الإيصال');
  } finally {
    document.body.removeChild(receiptContainer);
  }
};

export default generateAppointmentReceipt;
