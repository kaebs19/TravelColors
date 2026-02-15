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

  if (appointmentData.type === 'confirmed' && appointmentData.appointmentDate) {
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
    confirmed: { text: 'مؤكد', color: '#059669', bg: '#d1fae5' },
    unconfirmed: { text: 'قيد التأكيد', color: '#d97706', bg: '#fef3c7' }
  };

  const appointmentStatus = statusMap[appointmentData.status] || statusMap.new;
  const typeStatus = typeStatusMap[appointmentData.type] || typeStatusMap.confirmed;

  const paymentLabels = { cash: 'نقدي', card: 'شبكة', transfer: 'تحويل بنكي' };
  const paymentLabel = paymentLabels[appointmentData.paymentType] || '-';
  const totalAmount = parseFloat(appointmentData.totalAmount) || 0;
  const paidAmount = parseFloat(appointmentData.paidAmount) || 0;
  const remaining = totalAmount - paidAmount;

  // نص التذييل
  const footerTerms = receiptTerms || `شكراً لاختياركم ${companyName}\nنتمنى لكم رحلة سعيدة`;

  return `
    <div style="border: 1.5px solid #1e3a5f; border-radius: 10px; overflow: hidden; font-family: 'Cairo', sans-serif;">

      <!-- رأس الإيصال -->
      <div style="background: linear-gradient(135deg, #0c1f3f 0%, #1e3a5f 50%, #2d5a8e 100%); padding: 14px 16px 12px; color: white; position: relative;">
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #c8a44e, #e8c96e, #c8a44e);"></div>

        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${logoUrl}" alt="Logo" style="width: 50px; height: 50px; border-radius: 8px; object-fit: contain;" crossorigin="anonymous" />
            <div>
              <div style="margin: 0; font-size: 17px; font-weight: 800; font-family: 'Cairo', sans-serif;">${companyName}</div>
              <div style="margin: 2px 0; font-size: 10px; opacity: 0.85; font-weight: 400; font-family: 'Cairo', sans-serif;">${companyNameEn}</div>
              <div style="margin: 1px 0; font-size: 9px; opacity: 0.6; font-family: 'Cairo', sans-serif;">للسفر والسياحة</div>
            </div>
          </div>
          <div style="text-align: center; background: rgba(255,255,255,0.92); padding: 7px 10px; border-radius: 6px; min-width: 90px;">
            <div style="margin: 0; font-size: 11px; color: #1e3a5f; font-weight: 700; font-family: 'Cairo', sans-serif;">رقم الإيصال</div>
            <div style="margin: 3px 0 0 0; font-size: 12px; color: #1e3a5f; font-weight: 800; font-family: 'Cairo', sans-serif;">${receiptNumber}</div>
          </div>
        </div>

        ${showCompanyInfo ? `
        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.12); display: flex; justify-content: center; gap: 18px; font-size: 9px; opacity: 0.8; font-family: 'Cairo', sans-serif;">
          <span>${companyAddress}</span>
          <span>${companyPhone}</span>
          <span>${companyEmail}</span>
        </div>
        ` : ''}
      </div>

      <!-- عنوان الإيصال -->
      <div style="background: #eef2f7; padding: 8px 16px; border-bottom: 1px solid #d0d7e0; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 3px; height: 20px; background: #1e3a5f; border-radius: 2px;"></div>
          <div>
            <div style="margin: 0; font-size: 13px; color: #1e293b; font-weight: 700; font-family: 'Cairo', sans-serif;">إيصال موعد</div>
            <div style="margin: 0; font-size: 8px; color: #94a3b8; font-family: 'Cairo', sans-serif;">Appointment Receipt</div>
          </div>
        </div>
        <div style="text-align: left; font-size: 9px; color: #64748b; font-family: 'Cairo', sans-serif;">
          <div style="margin: 0;">التاريخ: <strong>${receiptDate}</strong></div>
          <div style="margin: 1px 0 0 0;">الوقت: <strong>${receiptTime}</strong></div>
        </div>
      </div>

      <!-- محتوى الإيصال -->
      <div style="padding: 12px 16px;">

        <!-- بيانات العميل -->
        <div style="background: #f0f4f8; padding: 10px 12px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #d0d7e0;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 7px; padding-bottom: 6px; border-bottom: 1px solid #d0d7e0;">
            <div style="width: 20px; height: 20px; background: #1e3a5f; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white;">👤</div>
            <div style="margin: 0; font-size: 11px; color: #1e3a5f; font-weight: 700; font-family: 'Cairo', sans-serif;">بيانات العميل</div>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; font-family: 'Cairo', sans-serif;">
            <tr>
              <td style="padding: 3px 0; color: #6b7280; width: 80px; font-weight: 600;">الاسم:</td>
              <td style="padding: 3px 0; font-weight: 700; color: #1e293b; font-size: 11px;">${appointmentData.customerName || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: #6b7280; font-weight: 600;">الجوال:</td>
              <td style="padding: 3px 0; font-weight: 600; color: #1e293b;" dir="ltr">${appointmentData.phone || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: #6b7280; font-weight: 600;">عدد الأشخاص:</td>
              <td style="padding: 3px 0; font-weight: 600; color: #1e293b;">${appointmentData.personsCount || 1} شخص</td>
            </tr>
          </table>
        </div>

        <!-- تفاصيل الموعد -->
        <div style="background: white; padding: 10px 12px; border: 1px solid #d0d7e0; border-radius: 8px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 7px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0;">
            <div style="width: 20px; height: 20px; background: #047857; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white;">📅</div>
            <div style="margin: 0; font-size: 11px; color: #047857; font-weight: 700; font-family: 'Cairo', sans-serif;">تفاصيل الموعد</div>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; font-family: 'Cairo', sans-serif;">
            <tr>
              <td style="padding: 3px 0; color: #6b7280; width: 80px; font-weight: 600;">الجهة:</td>
              <td style="padding: 3px 0; font-weight: 700; color: #1e293b;">${departmentTitle}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: #6b7280; font-weight: 600;">المدينة:</td>
              <td style="padding: 3px 0; font-weight: 600; color: #1e293b;">${appointmentData.city || 'الرياض'}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: #6b7280; font-weight: 600;">التاريخ:</td>
              <td style="padding: 3px 0; font-weight: 600; color: #1e293b;">${appointmentDateStr || '-'}</td>
            </tr>
            ${appointmentTimeStr ? `
            <tr>
              <td style="padding: 3px 0; color: #6b7280; font-weight: 600;">الوقت:</td>
              <td style="padding: 3px 0; font-weight: 600; color: #1e293b;">${appointmentTimeStr}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 3px 0; color: #6b7280; font-weight: 600;">النوع:</td>
              <td style="padding: 3px 0;">
                <span style="background: ${typeStatus.bg}; color: ${typeStatus.color}; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; font-family: 'Cairo', sans-serif;">${typeStatus.text}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: #6b7280; font-weight: 600;">الحالة:</td>
              <td style="padding: 3px 0;">
                <span style="background: ${appointmentStatus.bg}; color: ${appointmentStatus.color}; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; font-family: 'Cairo', sans-serif;">${appointmentStatus.text}</span>
              </td>
            </tr>
          </table>
        </div>

        ${totalAmount > 0 && showPaymentDetails ? `
        <!-- بيانات الدفع -->
        <div style="background: #f0faf5; padding: 10px 12px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #a7e8c5;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 7px; padding-bottom: 6px; border-bottom: 1px solid #a7e8c5;">
            <div style="width: 20px; height: 20px; background: #047857; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white;">💰</div>
            <div style="margin: 0; font-size: 11px; color: #047857; font-weight: 700; font-family: 'Cairo', sans-serif;">بيانات الدفع</div>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; font-family: 'Cairo', sans-serif;">
            <tr>
              <td style="padding: 3px 0; color: #047857; font-weight: 600;">طريقة الدفع:</td>
              <td style="padding: 3px 0; font-weight: 600; color: #047857; text-align: left;">${paymentLabel}</td>
            </tr>
          </table>
          <div style="margin-top: 7px; padding-top: 7px; border-top: 2px dashed #a7e8c5;">
            <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; font-family: 'Cairo', sans-serif;">
              <span style="color: #047857;">المبلغ الإجمالي:</span>
              <span style="font-weight: 700; color: #047857; font-size: 12px;">${totalAmount.toFixed(2)} ر.س</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; font-family: 'Cairo', sans-serif;">
              <span style="color: #059669;">المبلغ المدفوع:</span>
              <span style="font-weight: 700; color: #059669;">${paidAmount.toFixed(2)} ر.س</span>
            </div>
            ${remaining > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 5px 8px; margin-top: 4px; background: rgba(220, 38, 38, 0.06); border-radius: 5px; font-size: 12px; font-family: 'Cairo', sans-serif;">
              <span style="color: #dc2626; font-weight: 700;">المتبقي:</span>
              <span style="font-weight: 800; color: #dc2626;">${remaining.toFixed(2)} ر.س</span>
            </div>
            ` : `
            <div style="display: flex; justify-content: center; padding: 5px 0; margin-top: 4px;">
              <span style="background: #059669; color: white; padding: 3px 12px; border-radius: 12px; font-size: 10px; font-weight: 700; font-family: 'Cairo', sans-serif;">✓ تم السداد بالكامل</span>
            </div>
            `}
          </div>
        </div>
        ` : ''}

        ${showEmployeeName ? `
        <!-- معلومات الموظف -->
        <div style="background: #f8f9fb; padding: 6px 10px; border-radius: 5px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b; border: 1px solid #e2e8f0; font-family: 'Cairo', sans-serif;">
          <span>المستخدم: <strong>${employeeName}</strong></span>
          <span>تاريخ الطباعة: ${receiptDate} - ${receiptTime}</span>
        </div>
        ` : ''}
      </div>

      ${showTerms ? `
      <!-- تذييل الإيصال -->
      <div style="background: linear-gradient(135deg, #0c1f3f 0%, #1e3a5f 100%); padding: 10px 16px; text-align: center; color: white;">
        <div style="position: relative;">
          <div style="position: absolute; top: -10px; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #c8a44e, transparent);"></div>
        </div>
        <div style="margin: 0 0 4px 0; font-size: 10px; font-weight: 600; font-family: 'Cairo', sans-serif; white-space: pre-line; line-height: 1.5;">${footerTerms}</div>
        <div style="margin: 0; font-size: 8px; opacity: 0.5; font-family: 'Cairo', sans-serif;">www.trcolors.com</div>
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
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#f5f3ef'
  });

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
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

  doc.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, yOffset, finalWidth, finalHeight);

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
    font-family: 'Cairo', sans-serif;
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
    font-family: 'Cairo', sans-serif;
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
