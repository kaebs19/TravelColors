// دالة لطباعة محتوى HTML في نافذة جديدة
export const printContent = (content, title = 'طباعة') => {
  const printWindow = window.open('', '_blank', 'width=800,height=600');

  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          direction: rtl;
          padding: 20px;
          background: white;
          color: #333;
          line-height: 1.6;
        }

        .print-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
        }

        /* Header */
        .print-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 20px;
          border-bottom: 3px solid #1a56db;
          margin-bottom: 20px;
        }

        .company-info h2 {
          color: #1a56db;
          font-size: 24px;
          margin-bottom: 5px;
        }

        .company-info p {
          color: #666;
          font-size: 12px;
          margin: 2px 0;
        }

        .document-info {
          text-align: left;
        }

        .document-info .doc-type {
          font-size: 20px;
          font-weight: bold;
          color: #1a56db;
          margin-bottom: 10px;
        }

        .document-info p {
          font-size: 12px;
          margin: 3px 0;
        }

        .document-info strong {
          color: #333;
        }

        /* Customer Info */
        .customer-section {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .customer-section h4 {
          color: #1a56db;
          font-size: 14px;
          margin-bottom: 10px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 5px;
        }

        .customer-section p {
          margin: 5px 0;
          font-size: 13px;
        }

        /* Items Table */
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }

        .items-table th {
          background: #1a56db;
          color: white;
          padding: 12px 10px;
          text-align: right;
          font-size: 13px;
        }

        .items-table td {
          padding: 10px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
        }

        .items-table tr:nth-child(even) {
          background: #f8fafc;
        }

        /* Totals */
        .totals-section {
          display: flex;
          justify-content: flex-start;
          margin-bottom: 20px;
        }

        .totals-box {
          width: 300px;
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .total-row:last-child {
          border-bottom: none;
        }

        .total-row.grand {
          font-size: 16px;
          font-weight: bold;
          color: #1a56db;
          border-top: 2px solid #1a56db;
          padding-top: 10px;
          margin-top: 5px;
        }

        .total-row.paid {
          color: #16a34a;
        }

        .total-row.remaining {
          color: #dc2626;
        }

        /* Terms */
        .terms-section {
          background: #fef3c7;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .terms-section h4 {
          color: #92400e;
          font-size: 14px;
          margin-bottom: 10px;
        }

        .terms-section p {
          font-size: 12px;
          color: #78350f;
          line-height: 1.8;
        }

        /* Notes */
        .notes-section {
          background: #f0f9ff;
          padding: 15px;
          border-radius: 8px;
        }

        .notes-section h4 {
          color: #0369a1;
          font-size: 14px;
          margin-bottom: 10px;
        }

        .notes-section p {
          font-size: 12px;
          color: #0c4a6e;
        }

        /* Footer */
        .print-footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #666;
          font-size: 11px;
        }

        /* Status Badge */
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }

        .status-paid { background: #dcfce7; color: #16a34a; }
        .status-partial { background: #fef3c7; color: #d97706; }
        .status-draft { background: #f3f4f6; color: #6b7280; }
        .status-active { background: #dbeafe; color: #2563eb; }

        @media print {
          body { padding: 0; }
          .print-container { max-width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        ${content}
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

// دالة لتنسيق الفاتورة للطباعة
export const formatInvoiceForPrint = (invoice, settings = {}) => {
  const typeLabels = {
    invoice: 'فاتورة',
    quote: 'عرض سعر',
    receipt: 'إيصال'
  };

  const statusLabels = {
    paid: 'مدفوع',
    partial: 'مدفوع جزئياً',
    draft: 'مسودة',
    cancelled: 'ملغي'
  };

  const statusClasses = {
    paid: 'status-paid',
    partial: 'status-partial',
    draft: 'status-draft',
    cancelled: 'status-draft'
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `${(amount || 0).toLocaleString('ar-SA')} ر.س`;
  };

  const itemsRows = (invoice.items || []).map(item => `
    <tr>
      <td>${item.product || '-'}</td>
      <td>${item.description || '-'}</td>
      <td>${item.quantity || 1}</td>
      <td>${formatCurrency(item.unitPrice)}</td>
      <td>${formatCurrency(item.total || (item.quantity * item.unitPrice))}</td>
    </tr>
  `).join('');

  return `
    <div class="print-header">
      <div class="company-info">
        <h2>${invoice.companyInfo?.name || settings.companyName || 'ألوان المسافر'}</h2>
        ${invoice.companyInfo?.nameEn ? `<p>${invoice.companyInfo.nameEn}</p>` : ''}
        <p>${invoice.companyInfo?.address || settings.address || ''}</p>
        <p>هاتف: ${invoice.companyInfo?.phone || settings.phone || ''}</p>
        ${invoice.companyInfo?.email ? `<p>بريد: ${invoice.companyInfo.email}</p>` : ''}
        ${invoice.companyInfo?.taxNumber ? `<p>الرقم الضريبي: ${invoice.companyInfo.taxNumber}</p>` : ''}
      </div>
      <div class="document-info">
        <div class="doc-type">${typeLabels[invoice.type] || 'فاتورة'}</div>
        <p><strong>رقم:</strong> ${invoice.invoiceNumber || '-'}</p>
        <p><strong>التاريخ:</strong> ${formatDate(invoice.issueDate)}</p>
        ${invoice.dueDate ? `<p><strong>تاريخ الاستحقاق:</strong> ${formatDate(invoice.dueDate)}</p>` : ''}
        <p><span class="${statusClasses[invoice.status] || 'status-draft'} status-badge">${statusLabels[invoice.status] || invoice.status}</span></p>
      </div>
    </div>

    <div class="customer-section">
      <h4>بيانات العميل</h4>
      <p><strong>الاسم:</strong> ${invoice.customerName || '-'}</p>
      <p><strong>الهاتف:</strong> ${invoice.customerPhone || '-'}</p>
      ${invoice.customerAddress || invoice.customerCity ? `<p><strong>العنوان:</strong> ${[invoice.customerAddress, invoice.customerCity].filter(Boolean).join(' - ')}</p>` : ''}
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>المنتج</th>
          <th>الوصف</th>
          <th>الكمية</th>
          <th>السعر</th>
          <th>المبلغ</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="totals-section">
      <div class="totals-box">
        <div class="total-row">
          <span>المجموع الفرعي:</span>
          <span>${formatCurrency(invoice.subtotal)}</span>
        </div>
        ${invoice.taxAmount > 0 ? `
        <div class="total-row">
          <span>الضريبة (${invoice.taxRate || 0}%):</span>
          <span>${formatCurrency(invoice.taxAmount)}</span>
        </div>
        ` : ''}
        ${invoice.discount > 0 ? `
        <div class="total-row">
          <span>الخصم:</span>
          <span>- ${formatCurrency(invoice.discount)}</span>
        </div>
        ` : ''}
        <div class="total-row grand">
          <span>الإجمالي:</span>
          <span>${formatCurrency(invoice.total)}</span>
        </div>
        ${invoice.paidAmount > 0 ? `
        <div class="total-row paid">
          <span>المدفوع:</span>
          <span>${formatCurrency(invoice.paidAmount)}</span>
        </div>
        ` : ''}
        ${invoice.remainingAmount > 0 ? `
        <div class="total-row remaining">
          <span>المتبقي:</span>
          <span>${formatCurrency(invoice.remainingAmount)}</span>
        </div>
        ` : ''}
      </div>
    </div>

    ${invoice.terms ? `
    <div class="terms-section">
      <h4>الشروط والأحكام</h4>
      <p>${invoice.terms}</p>
    </div>
    ` : ''}

    ${invoice.notes ? `
    <div class="notes-section">
      <h4>ملاحظات</h4>
      <p>${invoice.notes}</p>
    </div>
    ` : ''}

    <div class="print-footer">
      <p>شكراً لتعاملكم معنا</p>
    </div>
  `;
};

// دالة لتنسيق الإيصال للطباعة
export const formatReceiptForPrint = (receipt, settings = {}) => {
  const statusLabels = {
    active: 'نشط',
    cancelled: 'ملغي'
  };

  const paymentMethodLabels = {
    cash: 'نقدي',
    card: 'بطاقة',
    bank_transfer: 'تحويل بنكي'
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `${(amount || 0).toLocaleString('ar-SA')} ر.س`;
  };

  return `
    <div class="print-header">
      <div class="company-info">
        <h2>${receipt.companyInfo?.name || settings.companyName || 'ألوان المسافر'}</h2>
        ${receipt.companyInfo?.nameEn ? `<p>${receipt.companyInfo.nameEn}</p>` : ''}
        <p>${receipt.companyInfo?.address || settings.address || ''}</p>
        <p>هاتف: ${receipt.companyInfo?.phone || settings.phone || ''}</p>
      </div>
      <div class="document-info">
        <div class="doc-type">إيصال استلام</div>
        <p><strong>رقم:</strong> ${receipt.receiptNumber || '-'}</p>
        <p><strong>التاريخ:</strong> ${formatDate(receipt.createdAt)}</p>
        <p><span class="status-badge ${receipt.status === 'active' ? 'status-active' : 'status-draft'}">${statusLabels[receipt.status] || receipt.status}</span></p>
      </div>
    </div>

    <div class="customer-section">
      <h4>بيانات العميل</h4>
      <p><strong>الاسم:</strong> ${receipt.customerName || '-'}</p>
      <p><strong>الهاتف:</strong> ${receipt.customerPhone || '-'}</p>
    </div>

    <div class="totals-section" style="justify-content: center;">
      <div class="totals-box" style="width: 100%; max-width: 400px; text-align: center;">
        <div class="total-row">
          <span>طريقة الدفع:</span>
          <span>${paymentMethodLabels[receipt.paymentMethod] || receipt.paymentMethod}</span>
        </div>
        <div class="total-row grand" style="font-size: 24px;">
          <span>المبلغ المستلم:</span>
          <span>${formatCurrency(receipt.amount)}</span>
        </div>
      </div>
    </div>

    ${receipt.description ? `
    <div class="notes-section">
      <h4>الوصف</h4>
      <p>${receipt.description}</p>
    </div>
    ` : ''}

    ${receipt.notes ? `
    <div class="notes-section" style="margin-top: 15px;">
      <h4>ملاحظات</h4>
      <p>${receipt.notes}</p>
    </div>
    ` : ''}

    <div class="print-footer">
      <p>شكراً لتعاملكم معنا</p>
      <p style="margin-top: 30px;">التوقيع: _______________________</p>
    </div>
  `;
};
