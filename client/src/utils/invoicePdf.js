import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { code39Svg } from './barcode';

const typeLabels = { invoice: 'فاتورة', quote: 'عرض سعر', receipt: 'إيصال' };
const statusLabels = {
  draft: 'مسودة', sent: 'مرسل', paid: 'مدفوع',
  partial: 'مدفوع جزئياً', cancelled: 'ملغي', expired: 'منتهي'
};

const fmt = (n) => `${(Number(n) || 0).toLocaleString('en-US')} ر.س`;
const fmtDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
};

// تنسيق رقم الهاتف للصيغة الدولية (واتساب)
const toIntlPhone = (phone) => {
  const p = (phone || '').replace(/[^0-9]/g, '');
  if (!p) return '';
  if (p.startsWith('966')) return p;
  if (p.startsWith('0')) return '966' + p.slice(1);
  if (p.length === 9) return '966' + p; // 5XXXXXXXX
  return p;
};

/**
 * بناء HTML الفاتورة بتصميم نظيف (أنماط مضمّنة لتعمل مع html2canvas)
 */
const buildInvoiceHTML = (invoice, settings = {}) => {
  const C = {
    primary: '#2f3e46', accent: '#c8a44e', border: '#e8e3d7',
    borderLight: '#f0ebe0', text: '#2f3e46', muted: '#7c8a92',
    soft: '#eef2f4', sage: '#6b9d7e', sageSoft: '#e8f1ea',
    danger: '#c05746', dangerSoft: '#faebe7'
  };
  const ci = invoice.companyInfo || {};
  const docLabel = typeLabels[invoice.type] || 'فاتورة';

  const itemsRows = (invoice.items || []).map((it, i) => {
    const count = it.unitType === 'quantity' ? (it.quantity || 1) : (it.persons || 1);
    const amount = it.total != null ? it.total : count * (it.unitPrice || 0);
    return `
      <tr style="background:${i % 2 ? '#fbfaf6' : '#ffffff'};">
        <td style="padding:7px 9px;border-bottom:1px solid ${C.borderLight};font-size:11px;color:${C.text};">${it.product || '-'}</td>
        <td style="padding:7px 9px;border-bottom:1px solid ${C.borderLight};font-size:11px;color:${C.muted};">${it.description || '-'}</td>
        <td style="padding:7px 9px;border-bottom:1px solid ${C.borderLight};font-size:11px;color:${C.text};text-align:center;">${count}</td>
        <td style="padding:7px 9px;border-bottom:1px solid ${C.borderLight};font-size:11px;color:${C.text};text-align:center;">${fmt(it.unitPrice)}</td>
        <td style="padding:7px 9px;border-bottom:1px solid ${C.borderLight};font-size:11px;color:${C.text};font-weight:700;text-align:center;">${fmt(amount)}</td>
      </tr>`;
  }).join('');

  const totalRow = (label, value, opts = {}) => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;${opts.border ? `border-top:1px dashed ${C.borderLight};` : ''}font-family:'Tajawal',sans-serif;">
      <span style="color:${opts.color || C.muted};font-size:${opts.big ? '13' : '12'}px;font-weight:${opts.big ? 700 : 500};">${label}</span>
      <span style="color:${opts.color || C.text};font-size:${opts.big ? '15' : '12'}px;font-weight:${opts.big ? 800 : 700};">${value}</span>
    </div>`;

  const isQuote = invoice.type === 'quote';
  const barcode = code39Svg(invoice.invoiceNumber, { height: 44, narrow: 2, wide: 5, color: C.primary });

  return `
    <div style="background:#ffffff;border-radius:14px;overflow:hidden;font-family:'Tajawal',sans-serif;border:1px solid ${C.border};">
      <!-- رأس -->
      <div style="padding:20px 22px 16px;border-bottom:1px solid ${C.border};">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="${ci.logo || '/logo512.png'}" alt="Logo" style="width:52px;height:52px;border-radius:10px;object-fit:contain;" crossorigin="anonymous" onerror="this.style.display='none'" />
            <div>
              <div style="font-size:18px;font-weight:800;color:${C.primary};line-height:1.3;">${ci.name || settings.companyName || 'ألوان المسافر'}</div>
              <div style="font-size:11px;color:${C.muted};font-weight:500;margin-top:2px;">${ci.nameEn || 'Travel Colors'} · للسفر والسياحة</div>
            </div>
          </div>
          <div style="text-align:center;padding:8px 14px;background:#f7efd8;border-radius:10px;border:1px solid ${C.accent};">
            <div style="font-size:10px;color:${C.primary};font-weight:600;">رقم ${docLabel}</div>
            <div style="font-size:13px;color:${C.primary};font-weight:800;margin-top:2px;">${invoice.invoiceNumber || '-'}</div>
          </div>
        </div>
        <div style="margin-top:12px;padding-top:10px;border-top:1px dashed ${C.border};display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;font-size:10px;color:${C.muted};">
          <span>📍 ${ci.address || settings.address || 'الرياض - حي الصحافة'}</span>
          <span>📞 ${ci.phone || settings.phone || '0558741741'}</span>
          ${ci.email ? `<span>✉️ ${ci.email}</span>` : ''}
        </div>
        <div style="margin-top:8px;text-align:center;font-size:10px;color:${C.accent};font-weight:700;padding:5px 0;background:#f7efd8;border-radius:6px;">
          مرخص من هيئة السياحة رقم 73104877 · فئة الترخيص: وكالة سفر وسياحة
        </div>
      </div>

      <!-- شريط النوع والتاريخ -->
      <div style="background:${C.soft};padding:11px 22px;display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:15px;color:${C.primary};font-weight:700;">${docLabel}</div>
        <div style="text-align:left;font-size:10px;color:${C.muted};">
          <div>التاريخ: <span style="color:${C.text};font-weight:700;">${fmtDate(invoice.issueDate)}</span></div>
          <div style="margin-top:2px;">الحالة: <span style="color:${C.text};font-weight:700;">${statusLabels[invoice.status] || invoice.status || '-'}</span></div>
        </div>
      </div>

      <!-- العميل -->
      <div style="padding:16px 22px 8px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="font-size:13px;color:${C.primary};font-weight:700;">👤 بيانات العميل</span>
          <span style="flex:1;height:1px;background:${C.borderLight};"></span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:${C.text};">
          <span><b style="color:${C.muted};font-weight:500;">الاسم:</b> ${invoice.customerName || '-'}</span>
          <span dir="ltr"><b style="color:${C.muted};font-weight:500;">الجوال:</b> ${invoice.customerPhone || '-'}</span>
        </div>
        ${(invoice.customerAddress || invoice.customerCity) ? `<div style="margin-top:6px;font-size:11px;color:${C.text};"><b style="color:${C.muted};font-weight:500;">العنوان:</b> ${[invoice.customerAddress, invoice.customerCity].filter(Boolean).join(' - ')}</div>` : ''}
      </div>

      <!-- العناصر -->
      <div style="padding:8px 22px 0;">
        <table style="width:100%;border-collapse:collapse;border:1px solid ${C.border};border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:${C.primary};">
              <th style="padding:8px 9px;font-size:11px;color:#fff;text-align:right;">المنتج</th>
              <th style="padding:8px 9px;font-size:11px;color:#fff;text-align:right;">الوصف</th>
              <th style="padding:8px 9px;font-size:11px;color:#fff;text-align:center;">العدد</th>
              <th style="padding:8px 9px;font-size:11px;color:#fff;text-align:center;">السعر</th>
              <th style="padding:8px 9px;font-size:11px;color:#fff;text-align:center;">المبلغ</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>
      </div>

      <!-- المجاميع -->
      <div style="padding:14px 22px 20px;">
        <div style="margin-right:auto;width:60%;min-width:240px;margin-left:0;">
          ${totalRow('المجموع الجزئي', fmt(invoice.subtotal))}
          ${invoice.taxAmount > 0 ? totalRow(`الضريبة (${invoice.taxRate}%)`, fmt(invoice.taxAmount), { border: true }) : ''}
          ${invoice.discount > 0 ? totalRow('الخصم', `- ${fmt(invoice.discount)}`, { border: true, color: C.danger }) : ''}
          <div style="margin-top:6px;padding:8px 12px;background:${C.soft};border-radius:8px;">
            ${totalRow('الإجمالي', fmt(invoice.total), { big: true, color: C.primary })}
          </div>
          ${!isQuote ? `
            <div style="margin-top:6px;">
              ${totalRow('المدفوع', fmt(invoice.paidAmount), { color: C.sage })}
              ${invoice.remainingAmount > 0
                ? `<div style="margin-top:6px;padding:8px 12px;background:${C.dangerSoft};border-radius:8px;">${totalRow('المتبقي', fmt(invoice.remainingAmount), { color: C.danger, big: true })}</div>`
                : `<div style="margin-top:6px;text-align:center;"><span style="background:${C.sage};color:#fff;padding:5px 16px;border-radius:20px;font-size:11px;font-weight:700;">✓ تم السداد بالكامل</span></div>`}
            </div>` : ''}
        </div>
      </div>

      ${barcode ? `<div style="text-align:center;padding:6px 22px 14px;">${barcode}</div>` : ''}

      ${(invoice.notes || invoice.terms) ? `
      <div style="background:${C.soft};padding:12px 22px;border-top:2px solid ${C.accent};">
        ${invoice.notes ? `<div style="font-size:10px;color:${C.text};margin-bottom:4px;"><b>ملاحظات:</b> ${invoice.notes}</div>` : ''}
        ${invoice.terms ? `<div style="font-size:10px;color:${C.muted};white-space:pre-line;line-height:1.6;">${invoice.terms}</div>` : ''}
        <div style="margin-top:6px;text-align:center;font-size:9px;color:#a8b3ba;">www.trcolors.com</div>
      </div>` : `
      <div style="background:${C.soft};padding:10px 22px;text-align:center;border-top:2px solid ${C.accent};font-size:9px;color:#a8b3ba;">www.trcolors.com</div>`}
    </div>`;
};

/**
 * تحويل HTML إلى مستند PDF (قد يمتد لأكثر من صفحة)
 */
const htmlToPdf = async (container) => {
  await document.fonts.ready;
  const canvas = await html2canvas(container, {
    scale: 1.5, useCORS: true, allowTaint: true, logging: false, backgroundColor: '#ffffff'
  });

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const pageWidth = 210, pageHeight = 297, margin = 10;
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const img = canvas.toDataURL('image/jpeg', 0.9);

  if (imgHeight <= pageHeight - margin * 2) {
    doc.addImage(img, 'JPEG', margin, margin, imgWidth, imgHeight, undefined, 'FAST');
  } else {
    // تقسيم على عدة صفحات
    let remaining = imgHeight;
    let position = margin;
    while (remaining > 0) {
      doc.addImage(img, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      remaining -= (pageHeight - margin * 2);
      if (remaining > 0) { doc.addPage(); position = margin - (imgHeight - remaining); }
    }
  }
  return doc;
};

const renderToContainer = async (invoice, settings) => {
  const container = document.createElement('div');
  container.style.cssText = `position:fixed;left:-9999px;top:0;width:520px;padding:16px;background:#ffffff;font-family:'Tajawal',sans-serif;direction:rtl;`;
  container.innerHTML = buildInvoiceHTML(invoice, settings);
  document.body.appendChild(container);
  return container;
};

const fileNameFor = (invoice) =>
  `${typeLabels[invoice.type] || 'invoice'}_${(invoice.invoiceNumber || '').replace(/[^\w-]/g, '') || Date.now()}.pdf`;

/**
 * تنزيل الفاتورة كملف PDF
 */
export const generateInvoicePdf = async (invoice, settings = {}) => {
  const container = await renderToContainer(invoice, settings);
  try {
    const doc = await htmlToPdf(container);
    doc.save(fileNameFor(invoice));
    return { success: true };
  } finally {
    document.body.removeChild(container);
  }
};

/**
 * إرسال الفاتورة عبر واتساب كملف PDF
 * - يستخدم Web Share API لإرفاق الملف مباشرة (الجوال) إن توفّر
 * - وإلا يُنزّل الـ PDF ويفتح واتساب برسالة جاهزة لإرفاقه
 */
export const shareInvoiceToWhatsApp = async (invoice, settings = {}) => {
  const container = await renderToContainer(invoice, settings);
  try {
    const doc = await htmlToPdf(container);
    const fileName = fileNameFor(invoice);
    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    const docLabel = typeLabels[invoice.type] || 'فاتورة';
    const companyName = invoice.companyInfo?.name || settings.companyName || 'ألوان المسافر';
    const message =
      `مرحباً ${invoice.customerName || ''},\n\n` +
      `مرفق ${docLabel} رقم ${invoice.invoiceNumber} من ${companyName}.\n` +
      `الإجمالي: ${fmt(invoice.total)}` +
      (invoice.type !== 'quote' && invoice.remainingAmount > 0 ? `\nالمتبقي: ${fmt(invoice.remainingAmount)}` : '') +
      `\n\nشكراً لاختياركم ${companyName}`;

    // إرفاق مباشر عبر Web Share API (مدعوم غالباً على الجوال)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({ files: [pdfFile], title: `${docLabel} ${invoice.invoiceNumber}`, text: message });
      return { success: true, method: 'share' };
    }

    // بديل سطح المكتب: تنزيل الملف + فتح واتساب برسالة جاهزة
    doc.save(fileName);
    const phone = toIntlPhone(invoice.customerPhone);
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    return { success: true, method: 'download_and_whatsapp' };
  } finally {
    document.body.removeChild(container);
  }
};

export default generateInvoicePdf;
