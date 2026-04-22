import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * بناء HTML إيصال الرخصة الدولية
 */
const buildLicenseReceiptHTML = (appData) => {
  const receiptNumber = appData.applicationNumber || `DL-${Date.now().toString().slice(-8)}`;
  const today = new Date();
  const receiptDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  const receiptTime = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;

  const fullName = [appData.personalInfo?.givenName, appData.personalInfo?.familyName].filter(Boolean).join(' ') || '—';

  const statusMap = {
    draft: { text: 'مسودة', color: '#b45309', bg: '#fef3c7' },
    submitted: { text: 'مُرسل', color: '#1d4ed8', bg: '#dbeafe' },
    under_review: { text: 'قيد المراجعة', color: '#c2410c', bg: '#ffedd5' },
    approved: { text: 'مقبول', color: '#047857', bg: '#d1fae5' },
    rejected: { text: 'مرفوض', color: '#dc2626', bg: '#fee2e2' },
    completed: { text: 'مكتمل', color: '#6d28d9', bg: '#ede9fe' },
    received: { text: 'مُستلم', color: '#0891b2', bg: '#cffafe' }
  };

  const deliveryMap = {
    pickup: '🏢 استلام من المكتب',
    delivery: '🚗 توصيل',
    shipping: '📦 شحن'
  };

  const status = statusMap[appData.status] || statusMap.submitted;
  const deliveryLabel = deliveryMap[appData.deliveryMethod] || '—';

  const basePrice = appData.basePrice || 0;
  const addonsTotal = appData.addonsTotal || 0;
  const deliveryPrice = appData.deliveryPrice || 0;
  const couponDiscount = appData.couponDiscount || 0;
  const totalPrice = appData.totalPrice || 0;

  // الخدمات الإضافية
  const addonsHTML = (appData.selectedAddons || []).map(addon =>
    `<tr>
      <td style="padding: 3px 0; font-size: 10px; color: #374151; font-family: 'Tajawal', sans-serif;">✓ ${addon.name}</td>
      <td style="padding: 3px 0; font-size: 10px; color: #374151; text-align: left; font-family: 'Tajawal', sans-serif;">${addon.price} ر.س</td>
    </tr>`
  ).join('');

  // بيانات العنوان الوطني للشحن
  let shippingHTML = '';
  if (appData.deliveryMethod === 'shipping' && appData.shippingAddress) {
    const addr = appData.shippingAddress;
    const addrParts = [addr.city, addr.district, addr.streetName].filter(Boolean);
    if (addrParts.length > 0) {
      shippingHTML = `
        <tr>
          <td style="padding: 3px 0; color: #6b7280; font-weight: 600; font-size: 10px;">عنوان الشحن:</td>
          <td style="padding: 3px 0; font-weight: 600; color: #1e293b; font-size: 10px;">${addrParts.join(' - ')}</td>
        </tr>
      `;
    }
  }

  return `
    <div style="border: 1.5px solid #047857; border-radius: 10px; overflow: hidden; font-family: 'Tajawal', sans-serif;">

      <!-- رأس الإيصال -->
      <div style="background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%); padding: 14px 16px 12px; color: white; position: relative;">
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #c8a44e, #e8c96e, #c8a44e);"></div>

        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="margin: 0; font-size: 17px; font-weight: 800; font-family: 'Tajawal', sans-serif;">ألوان المسافر</div>
            <div style="margin: 2px 0; font-size: 10px; opacity: 0.85; font-weight: 400;">Travel Colors</div>
            <div style="margin: 1px 0; font-size: 9px; opacity: 0.6;">للسفر والسياحة</div>
          </div>
          <div style="text-align: center; background: rgba(255,255,255,0.92); padding: 7px 10px; border-radius: 6px; min-width: 110px;">
            <div style="margin: 0; font-size: 10px; color: #047857; font-weight: 700; font-family: 'Tajawal', sans-serif;">رقم الطلب</div>
            <div style="margin: 3px 0 0 0; font-size: 11px; color: #047857; font-weight: 800; font-family: monospace;">${receiptNumber}</div>
          </div>
        </div>

        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.12); display: flex; justify-content: center; gap: 18px; font-size: 9px; opacity: 0.8;">
          <span>الرياض - حي الصحافة</span>
          <span>0558741741</span>
          <span>info@trcolors.com</span>
        </div>
        <div style="margin-top: 4px; text-align: center; font-size: 9px; opacity: 0.85; font-family: 'Tajawal', sans-serif; letter-spacing: 0.2px;">
          مرخص من هيئة السياحة رقم: <strong>73104877</strong>
        </div>
      </div>

      <!-- عنوان الإيصال -->
      <div style="background: #ecfdf5; padding: 8px 16px; border-bottom: 1px solid #a7f3d0; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 3px; height: 20px; background: #047857; border-radius: 2px;"></div>
          <div>
            <div style="margin: 0; font-size: 13px; color: #065f46; font-weight: 700; font-family: 'Tajawal', sans-serif;">إيصال طلب رخصة دولية</div>
            <div style="margin: 0; font-size: 8px; color: #6ee7b7; font-family: 'Tajawal', sans-serif;">International License Receipt</div>
          </div>
        </div>
        <div style="text-align: left; font-size: 9px; color: #6b7280; font-family: 'Tajawal', sans-serif;">
          <div>التاريخ: <strong>${receiptDate}</strong></div>
          <div style="margin-top: 1px;">الوقت: <strong>${receiptTime}</strong></div>
        </div>
      </div>

      <!-- محتوى الإيصال -->
      <div style="padding: 12px 16px;">

        <!-- بيانات مقدم الطلب -->
        <div style="background: #f0fdf4; padding: 10px 12px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #bbf7d0;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 7px; padding-bottom: 6px; border-bottom: 1px solid #bbf7d0;">
            <div style="width: 20px; height: 20px; background: #047857; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white;">👤</div>
            <div style="margin: 0; font-size: 11px; color: #047857; font-weight: 700; font-family: 'Tajawal', sans-serif;">بيانات مقدم الطلب</div>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; font-family: 'Tajawal', sans-serif;">
            <tr>
              <td style="padding: 3px 0; color: #6b7280; width: 90px; font-weight: 600;">الاسم:</td>
              <td style="padding: 3px 0; font-weight: 700; color: #1e293b;">${fullName}</td>
            </tr>
            ${appData.personalInfo?.nationalId ? `
            <tr>
              <td style="padding: 3px 0; color: #6b7280; font-weight: 600;">رقم الهوية:</td>
              <td style="padding: 3px 0; font-weight: 600; color: #1e293b;" dir="ltr">${appData.personalInfo.nationalId}</td>
            </tr>` : ''}
            ${appData.personalInfo?.phone ? `
            <tr>
              <td style="padding: 3px 0; color: #6b7280; font-weight: 600;">الجوال:</td>
              <td style="padding: 3px 0; font-weight: 600; color: #1e293b;" dir="ltr">${appData.personalInfo.phone}</td>
            </tr>` : ''}
            ${appData.personalInfo?.email ? `
            <tr>
              <td style="padding: 3px 0; color: #6b7280; font-weight: 600;">البريد:</td>
              <td style="padding: 3px 0; font-weight: 600; color: #1e293b;" dir="ltr">${appData.personalInfo.email}</td>
            </tr>` : ''}
            ${appData.personalInfo?.nationality ? `
            <tr>
              <td style="padding: 3px 0; color: #6b7280; font-weight: 600;">الجنسية:</td>
              <td style="padding: 3px 0; font-weight: 600; color: #1e293b;">${appData.personalInfo.nationality}</td>
            </tr>` : ''}
          </table>
        </div>

        <!-- تفاصيل الطلب -->
        <div style="background: white; padding: 10px 12px; border: 1px solid #d0d7e0; border-radius: 8px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 7px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0;">
            <div style="width: 20px; height: 20px; background: #0369a1; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white;">🪪</div>
            <div style="margin: 0; font-size: 11px; color: #0369a1; font-weight: 700; font-family: 'Tajawal', sans-serif;">تفاصيل الطلب</div>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; font-family: 'Tajawal', sans-serif;">
            <tr>
              <td style="padding: 3px 0; color: #6b7280; width: 90px; font-weight: 600;">الخدمة:</td>
              <td style="padding: 3px 0; font-weight: 700; color: #1e293b;">الرخصة الدولية</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: #6b7280; font-weight: 600;">الحالة:</td>
              <td style="padding: 3px 0;">
                <span style="background: ${status.bg}; color: ${status.color}; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; font-family: 'Tajawal', sans-serif;">${status.text}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: #6b7280; font-weight: 600;">التسليم:</td>
              <td style="padding: 3px 0; font-weight: 600; color: #1e293b;">${deliveryLabel}</td>
            </tr>
            ${shippingHTML}
          </table>
        </div>

        <!-- ملخص التسعير -->
        ${totalPrice > 0 ? `
        <div style="background: #f0faf5; padding: 10px 12px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #a7e8c5;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 7px; padding-bottom: 6px; border-bottom: 1px solid #a7e8c5;">
            <div style="width: 20px; height: 20px; background: #047857; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white;">💰</div>
            <div style="margin: 0; font-size: 11px; color: #047857; font-weight: 700; font-family: 'Tajawal', sans-serif;">ملخص التسعير</div>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; font-family: 'Tajawal', sans-serif;">
            <tr>
              <td style="padding: 3px 0; color: #374151; font-weight: 600;">السعر الأساسي:</td>
              <td style="padding: 3px 0; font-weight: 600; color: #374151; text-align: left;">${basePrice} ر.س</td>
            </tr>
            ${addonsHTML}
            ${addonsTotal > 0 ? `
            <tr>
              <td style="padding: 3px 0; color: #374151; font-weight: 600;">الخدمات الإضافية:</td>
              <td style="padding: 3px 0; font-weight: 600; color: #374151; text-align: left;">${addonsTotal} ر.س</td>
            </tr>` : ''}
            ${deliveryPrice > 0 ? `
            <tr>
              <td style="padding: 3px 0; color: #374151; font-weight: 600;">رسوم التسليم:</td>
              <td style="padding: 3px 0; font-weight: 600; color: #374151; text-align: left;">${deliveryPrice} ر.س</td>
            </tr>` : ''}
            ${couponDiscount > 0 ? `
            <tr>
              <td style="padding: 3px 0; color: #10b981; font-weight: 600;">خصم الكوبون (${appData.couponCode || ''}):</td>
              <td style="padding: 3px 0; font-weight: 600; color: #10b981; text-align: left;">- ${couponDiscount} ر.س</td>
            </tr>` : ''}
          </table>
          <div style="margin-top: 7px; padding-top: 7px; border-top: 2px dashed #a7e8c5;">
            <div style="display: flex; justify-content: space-between; padding: 5px 8px; background: rgba(4, 120, 87, 0.08); border-radius: 5px; font-family: 'Tajawal', sans-serif;">
              <span style="color: #047857; font-weight: 700; font-size: 12px;">الإجمالي:</span>
              <span style="font-weight: 800; color: #047857; font-size: 14px;">${totalPrice} ر.س</span>
            </div>
          </div>
        </div>
        ` : ''}
      </div>

      <!-- تذييل -->
      <div style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); padding: 10px 16px; text-align: center; color: white;">
        <div style="position: relative;">
          <div style="position: absolute; top: -10px; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #c8a44e, transparent);"></div>
        </div>
        <div style="margin: 0 0 4px 0; font-size: 10px; font-weight: 600; font-family: 'Tajawal', sans-serif; line-height: 1.5;">شكراً لاختياركم ألوان المسافر</div>
        <div style="margin: 0; font-size: 8px; opacity: 0.5; font-family: 'Tajawal', sans-serif;">www.trcolors.com</div>
      </div>
    </div>
  `;
};

/**
 * تحويل HTML إلى PDF صفحة واحدة
 */
const htmlToPdf = async (container) => {
  await document.fonts.ready;

  const canvas = await html2canvas(container, {
    scale: 1.5,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#f5f3ef'
  });

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const maxWidth = pageWidth - (margin * 2);
  const maxHeight = pageHeight - (margin * 2);

  const imgWidth = maxWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let finalWidth = imgWidth;
  let finalHeight = imgHeight;

  if (imgHeight > maxHeight) {
    const ratio = maxHeight / imgHeight;
    finalHeight = maxHeight;
    finalWidth = imgWidth * ratio;
  }

  const xOffset = (pageWidth - finalWidth) / 2;
  doc.addImage(canvas.toDataURL('image/jpeg', 0.85), 'JPEG', xOffset, margin, finalWidth, finalHeight, undefined, 'FAST');

  return doc;
};

/**
 * إنشاء وتحميل إيصال PDF لطلب الرخصة الدولية
 */
export const generateLicenseReceipt = async (appData) => {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 480px;
    padding: 20px;
    background: #f5f3ef;
    font-family: 'Tajawal', sans-serif;
    direction: rtl;
  `;

  container.innerHTML = buildLicenseReceiptHTML(appData);
  document.body.appendChild(container);

  try {
    const doc = await htmlToPdf(container);
    const name = [appData.personalInfo?.givenName, appData.personalInfo?.familyName].filter(Boolean).join('_') || 'client';
    const fileName = `license_receipt_${name}_${Date.now()}.pdf`;
    doc.save(fileName);
    return { success: true, fileName };
  } catch (error) {
    console.error('Error generating license receipt:', error);
    throw new Error('حدث خطأ أثناء إنشاء الإيصال');
  } finally {
    document.body.removeChild(container);
  }
};

export default generateLicenseReceipt;
