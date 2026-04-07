/**
 * توليد تقارير قابلة للطباعة لكل تبويب
 * جميع الأرقام بالإنجليزية (0123456789)
 */

const formatNumber = (num) => (num || 0).toLocaleString('en-US');

const formatCurrency = (amount) => `${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ر.س`;

const formatPercent = (value) => `${(value || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%`;

const formatDateAr = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

// Header مشترك لجميع التقارير
const generateHeader = (settings, reportTitle, dateRange) => {
  const logoUrl = settings?.logo ? `${window.location.origin}/api/${settings.logo}` : '';
  return `
    <div class="report-print-header">
      <div class="company-info">
        ${logoUrl ? `<img src="${logoUrl}" class="company-logo" alt="logo" />` : ''}
        <div class="company-text">
          <h2>${settings?.companyName || 'ألوان المسافر للسفر والسياحة'}</h2>
          ${settings?.companyNameEn ? `<p class="en-name">${settings.companyNameEn}</p>` : ''}
          <p>${settings?.address || ''}</p>
          <p>هاتف: ${settings?.phone || ''} ${settings?.email ? `| بريد: ${settings.email}` : ''}</p>
        </div>
      </div>
      <div class="report-info">
        <div class="report-title">${reportTitle}</div>
        ${dateRange?.startDate ? `<p><strong>من:</strong> ${formatDateAr(dateRange.startDate)}</p>` : ''}
        ${dateRange?.endDate ? `<p><strong>إلى:</strong> ${formatDateAr(dateRange.endDate)}</p>` : ''}
        <p class="print-date">تاريخ الطباعة: ${formatDateAr(new Date())}</p>
      </div>
    </div>
  `;
};

const generateFooter = (settings) => `
  <div class="report-print-footer">
    <p>${settings?.companyName || 'ألوان المسافر للسفر والسياحة'}</p>
    <p>تم إنشاء هذا التقرير تلقائياً من نظام إدارة المواعيد</p>
  </div>
`;

// CSS مشترك
const printStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; padding: 24px; background: #fff; color: #333; line-height: 1.6; font-size: 13px; }
  .print-container { max-width: 850px; margin: 0 auto; }

  .report-print-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 3px solid #1a56db; margin-bottom: 24px; }
  .company-info { display: flex; align-items: center; gap: 12px; }
  .company-logo { width: 60px; height: 60px; object-fit: contain; border-radius: 8px; }
  .company-text h2 { color: #1a56db; font-size: 18px; margin-bottom: 2px; }
  .company-text .en-name { color: #666; font-size: 11px; }
  .company-text p { color: #666; font-size: 11px; margin: 1px 0; }
  .report-info { text-align: left; }
  .report-title { font-size: 18px; font-weight: bold; color: #1a56db; margin-bottom: 8px; }
  .report-info p { font-size: 11px; margin: 2px 0; }
  .print-date { color: #999; margin-top: 4px !important; }

  .report-print-footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; color: #999; font-size: 11px; }

  .stats-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
  .stat-box { flex: 1; min-width: 140px; background: #f8fafc; border-radius: 8px; padding: 14px; text-align: center; border: 1px solid #e2e8f0; }
  .stat-box .value { font-size: 22px; font-weight: bold; color: #1a56db; display: block; }
  .stat-box .label { font-size: 12px; color: #666; display: block; margin-top: 4px; }
  .stat-box .sub { font-size: 11px; color: #10b981; display: block; margin-top: 2px; }
  .stat-box.warning .value { color: #ef4444; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #1a56db; color: #fff; padding: 10px 8px; text-align: right; font-size: 12px; white-space: nowrap; }
  td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
  tr:nth-child(even) { background: #f8fafc; }
  .total-row-print td { background: #eef2ff !important; font-weight: bold; border-top: 2px solid #1a56db; color: #1a56db; }

  .badge-print { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; }
  .badge-success { background: #dcfce7; color: #16a34a; }
  .badge-warning { background: #fef3c7; color: #d97706; }
  .badge-danger { background: #fee2e2; color: #dc2626; }

  .section-title { font-size: 15px; font-weight: bold; color: #1a1a2e; margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #e9ecef; }

  @media print { body { padding: 0; } .print-container { max-width: 100%; } }
`;

// ─── دالة مساعدة لحساب نسبة الإنجاز ───
const calcRate = (completed, total) => {
  if (!total || total === 0) return 0;
  return Math.round((completed / total) * 100);
};

const rateBadge = (rate) => {
  const cls = rate >= 70 ? 'badge-success' : rate >= 40 ? 'badge-warning' : 'badge-danger';
  return `<span class="badge-print ${cls}">${formatPercent(rate)}</span>`;
};

// ─── تقارير كل تبويب ───

export const generateOverviewReport = (data, settings, dateRange) => {
  const content = `
    ${generateHeader(settings, 'تقرير نظرة عامة', dateRange)}
    <div class="stats-row">
      <div class="stat-box"><span class="value">${formatNumber(data.totalAppointments)}</span><span class="label">إجمالي المواعيد</span><span class="sub">${formatNumber(data.completedCount)} مكتملة</span></div>
      <div class="stat-box"><span class="value">${formatNumber(data.totalCustomers)}</span><span class="label">العملاء</span><span class="sub">${formatNumber(data.totalPersons)} شخص</span></div>
      <div class="stat-box"><span class="value">${formatCurrency(data.totalAmount)}</span><span class="label">إجمالي المبالغ</span></div>
      <div class="stat-box"><span class="value">${formatCurrency(data.totalPaid)}</span><span class="label">المدفوع</span><span class="sub">المتبقي: ${formatCurrency((data.totalAmount || 0) - (data.totalPaid || 0))}</span></div>
    </div>
    ${data.electronic ? `
    <div class="section-title">التقديمات الإلكترونية</div>
    <div class="stats-row">
      <div class="stat-box"><span class="value">${formatNumber(data.electronic.total)}</span><span class="label">الإجمالي</span></div>
      <div class="stat-box"><span class="value">${formatNumber(data.electronic.processing)}</span><span class="label">قيد المعالجة</span></div>
      <div class="stat-box ${data.electronic.overdue > 0 ? 'warning' : ''}"><span class="value">${formatNumber(data.electronic.overdue)}</span><span class="label">متأخرة</span></div>
      <div class="stat-box"><span class="value">${formatNumber(data.electronic.acceptedMonth)}</span><span class="label">مقبولة هذا الشهر</span></div>
    </div>` : ''}
    <div class="section-title">توزيع المواعيد</div>
    <table>
      <thead><tr><th>النوع</th><th>العدد</th><th>النسبة</th></tr></thead>
      <tbody>
        <tr><td>مؤكد</td><td>${formatNumber(data.confirmedCount)}</td><td>${formatPercent(calcRate(data.confirmedCount, data.totalAppointments))}</td></tr>
        <tr><td>غير مؤكد</td><td>${formatNumber(data.unconfirmedCount)}</td><td>${formatPercent(calcRate(data.unconfirmedCount, data.totalAppointments))}</td></tr>
        <tr><td>مكتمل</td><td>${formatNumber(data.completedCount)}</td><td>${formatPercent(calcRate(data.completedCount, data.totalAppointments))}</td></tr>
        <tr><td>ملغي</td><td>${formatNumber(data.cancelledCount)}</td><td>${formatPercent(calcRate(data.cancelledCount, data.totalAppointments))}</td></tr>
        <tr class="total-row-print"><td>الإجمالي</td><td>${formatNumber(data.totalAppointments)}</td><td>100%</td></tr>
      </tbody>
    </table>
    ${generateFooter(settings)}
  `;
  return content;
};

export const generateAppointmentsReport = (data, settings, dateRange, employeesData, details) => {
  let totalCount = 0, totalPersons = 0, totalAmount = 0, totalPaid = 0;
  const rows = (data || []).map(item => {
    totalCount += item.count || 0;
    totalPersons += item.persons || 0;
    totalAmount += item.amount || 0;
    totalPaid += item.paid || 0;
    return `
    <tr>
      <td>${item._id || '-'}</td>
      <td>${formatNumber(item.count)}</td>
      <td>${formatNumber(item.persons)}</td>
      <td>${formatCurrency(item.amount)}</td>
      <td>${formatCurrency(item.paid)}</td>
    </tr>`;
  }).join('');

  // جدول الموظفين - عدد الأشخاص المضافين
  let empTotalAppt = 0, empTotalPersons = 0, empTotalAmount = 0;
  const empRows = (employeesData || []).map((emp, i) => {
    empTotalAppt += emp.totalAppointments || 0;
    empTotalPersons += emp.totalPersons || 0;
    empTotalAmount += emp.totalAmount || 0;
    const rate = emp.completionRate || 0;
    return `
    <tr>
      <td>${formatNumber(i + 1)}</td>
      <td><strong>${emp.employeeName || '-'}</strong></td>
      <td>${formatNumber(emp.totalAppointments)}</td>
      <td>${formatNumber(emp.totalPersons)}</td>
      <td>${formatCurrency(emp.totalAmount)}</td>
      <td>${rateBadge(rate)}</td>
    </tr>`;
  }).join('');

  return `
    ${generateHeader(settings, 'تقرير المواعيد', dateRange)}
    <div class="stats-row">
      <div class="stat-box"><span class="value">${formatNumber(totalCount)}</span><span class="label">إجمالي المواعيد</span></div>
      <div class="stat-box"><span class="value">${formatNumber(totalPersons)}</span><span class="label">إجمالي الأشخاص</span></div>
      <div class="stat-box"><span class="value">${formatCurrency(totalAmount)}</span><span class="label">إجمالي المبالغ</span></div>
      <div class="stat-box"><span class="value">${formatCurrency(totalPaid)}</span><span class="label">إجمالي المدفوع</span></div>
    </div>
    <div class="section-title">تفاصيل المواعيد حسب الفترة</div>
    <table>
      <thead><tr><th>الفترة</th><th>المواعيد</th><th>الأشخاص</th><th>المبلغ</th><th>المدفوع</th></tr></thead>
      <tbody>
        ${rows || '<tr><td colspan="5" style="text-align:center">لا توجد بيانات</td></tr>'}
        ${rows ? `<tr class="total-row-print"><td>الإجمالي</td><td>${formatNumber(totalCount)}</td><td>${formatNumber(totalPersons)}</td><td>${formatCurrency(totalAmount)}</td><td>${formatCurrency(totalPaid)}</td></tr>` : ''}
      </tbody>
    </table>
    ${empRows ? `
    <div class="section-title">الموظفين - عدد الأشخاص المضافين</div>
    <table>
      <thead><tr><th>#</th><th>الموظف</th><th>المواعيد</th><th>الأشخاص</th><th>المبلغ</th><th>نسبة الإنجاز</th></tr></thead>
      <tbody>
        ${empRows}
        <tr class="total-row-print"><td></td><td>الإجمالي</td><td>${formatNumber(empTotalAppt)}</td><td>${formatNumber(empTotalPersons)}</td><td>${formatCurrency(empTotalAmount)}</td><td></td></tr>
      </tbody>
    </table>` : ''}
    ${Array.isArray(details) && details.length > 0 ? (() => {
      const typeLabels = { confirmed: 'مؤكد', unconfirmed: 'غير مؤكد' };
      let dTotalPersons = 0, dTotalAmount = 0, dTotalPaid = 0;
      const detailRows = details.map((appt, idx) => {
        dTotalPersons += appt.personsCount || 0;
        dTotalAmount += appt.totalAmount || 0;
        dTotalPaid += appt.paidAmount || 0;
        return `
        <tr>
          <td>${formatNumber(idx + 1)}</td>
          <td><strong>${appt.customerName || '-'}</strong></td>
          <td>${appt.departmentName || '-'}</td>
          <td>${formatNumber(appt.personsCount)}</td>
          <td>${typeLabels[appt.type] || appt.type || '-'}</td>
          <td>${appt.appointmentDate ? formatDateAr(appt.appointmentDate) : '-'}</td>
          <td>${formatCurrency(appt.totalAmount)}</td>
          <td>${formatCurrency(appt.paidAmount)}</td>
        </tr>`;
      }).join('');
      return `
      <div class="section-title">تفاصيل العملاء (${formatNumber(details.length)})</div>
      <table>
        <thead><tr><th>#</th><th>اسم العميل</th><th>القسم</th><th>الأشخاص</th><th>النوع</th><th>التاريخ</th><th>المبلغ</th><th>المدفوع</th></tr></thead>
        <tbody>
          ${detailRows}
          <tr class="total-row-print">
            <td colspan="3">الإجمالي</td>
            <td>${formatNumber(dTotalPersons)}</td>
            <td colspan="2"></td>
            <td>${formatCurrency(dTotalAmount)}</td>
            <td>${formatCurrency(dTotalPaid)}</td>
          </tr>
        </tbody>
      </table>`;
    })() : ''}
    ${generateFooter(settings)}
  `;
};

export const generateTasksReport = (data, settings, dateRange) => {
  if (!data) return '';
  const summary = data.summary || data;
  let totalCompleted = 0, totalPersons = 0, totalAmount = 0;
  const empRows = (data.byEmployee || data.tasksByEmployee || []).map(emp => {
    totalCompleted += emp.completedTasks || 0;
    totalPersons += emp.totalPersons || 0;
    totalAmount += emp.totalAmount || 0;
    return `
    <tr>
      <td><strong>${emp.employeeName || '-'}</strong></td>
      <td>${formatNumber(emp.completedTasks)}</td>
      <td>${formatNumber(emp.totalPersons)}</td>
      <td>${formatCurrency(emp.totalAmount)}</td>
    </tr>`;
  }).join('');

  const completionRate = (summary.totalTasks || data.totalTasks) > 0 ? calcRate(summary.completedTasks || data.completedTasks, summary.totalTasks || data.totalTasks) : 0;

  return `
    ${generateHeader(settings, 'تقرير المهام', dateRange)}
    <div class="stats-row">
      <div class="stat-box"><span class="value">${formatNumber(summary.totalTasks || data.totalTasks)}</span><span class="label">إجمالي المهام</span></div>
      <div class="stat-box"><span class="value">${formatNumber(summary.completedTasks || data.completedTasks)}</span><span class="label">مكتملة</span></div>
      <div class="stat-box"><span class="value">${formatNumber(summary.inProgressTasks || data.inProgressTasks)}</span><span class="label">قيد التنفيذ</span></div>
      <div class="stat-box"><span class="value">${formatNumber(summary.newTasks || data.newTasks)}</span><span class="label">جديدة</span></div>
    </div>
    <div class="stats-row">
      <div class="stat-box"><span class="value">${formatPercent(completionRate)}</span><span class="label">نسبة الإنجاز</span></div>
    </div>
    <div class="section-title">المهام حسب الموظف</div>
    <table>
      <thead><tr><th>الموظف</th><th>المهام المكتملة</th><th>الأشخاص</th><th>المبلغ</th></tr></thead>
      <tbody>
        ${empRows || '<tr><td colspan="4" style="text-align:center">لا توجد بيانات</td></tr>'}
        ${empRows ? `<tr class="total-row-print"><td>الإجمالي</td><td>${formatNumber(totalCompleted)}</td><td>${formatNumber(totalPersons)}</td><td>${formatCurrency(totalAmount)}</td></tr>` : ''}
      </tbody>
    </table>
    ${generateFooter(settings)}
  `;
};

export const generateEmployeePerformanceReport = (data, settings, dateRange) => {
  if (!data?.summary) return '';

  let totalAppointments = 0, totalPersons = 0, totalCompleted = 0, totalCompletedPersons = 0;

  const rows = data.summary.map(emp => {
    const appointments = emp.totals?.appointments || 0;
    const persons = emp.totals?.persons || 0;
    const completed = emp.totals?.completedAppointments || 0;
    const completedPersons = emp.totals?.completedPersons || 0;
    const rate = persons > 0 ? calcRate(completedPersons, persons) : 0;

    totalAppointments += appointments;
    totalPersons += persons;
    totalCompleted += completed;
    totalCompletedPersons += completedPersons;

    return `
    <tr>
      <td><strong>${emp.employeeName || emp.employee?.name || '-'}</strong></td>
      <td>${formatNumber(appointments)}</td>
      <td>${formatNumber(persons)}</td>
      <td>${formatNumber(completed)}</td>
      <td>${formatNumber(completedPersons)}</td>
      <td>${rateBadge(rate)}</td>
    </tr>`;
  }).join('');

  const overallRate = totalPersons > 0 ? calcRate(totalCompletedPersons, totalPersons) : 0;

  // ملخص سريع
  const bestEmployee = data.summary.reduce((best, emp) => {
    const empPersons = emp.totals?.persons || 0;
    const empCompletedPersons = emp.totals?.completedPersons || 0;
    const rate = empPersons > 0 ? calcRate(empCompletedPersons, empPersons) : 0;
    const bestPersons = best?.totals?.persons || 0;
    const bestCompletedPersons = best?.totals?.completedPersons || 0;
    const bestRate = bestPersons > 0 ? calcRate(bestCompletedPersons, bestPersons) : 0;
    return rate > bestRate ? emp : best;
  }, data.summary[0]);

  return `
    ${generateHeader(settings, 'تقرير أداء الموظفين', dateRange)}
    <div class="stats-row">
      <div class="stat-box"><span class="value">${formatNumber(data.summary.length)}</span><span class="label">عدد الموظفين</span></div>
      <div class="stat-box"><span class="value">${formatNumber(totalAppointments)}</span><span class="label">إجمالي المواعيد</span><span class="sub">${formatNumber(totalCompleted)} مكتملة</span></div>
      <div class="stat-box"><span class="value">${formatNumber(totalPersons)}</span><span class="label">إجمالي الأشخاص</span><span class="sub">${formatNumber(totalCompletedPersons)} مكتملة</span></div>
      <div class="stat-box"><span class="value">${formatPercent(overallRate)}</span><span class="label">نسبة الإنجاز</span></div>
    </div>

    <div class="section-title">تفاصيل أداء الموظفين</div>
    <table>
      <thead>
        <tr>
          <th>الموظف</th>
          <th>المواعيد</th>
          <th>الأشخاص</th>
          <th>المكتملة</th>
          <th>أشخاص مكتملة</th>
          <th>نسبة الإنجاز</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr class="total-row-print">
          <td>الإجمالي</td>
          <td>${formatNumber(totalAppointments)}</td>
          <td>${formatNumber(totalPersons)}</td>
          <td>${formatNumber(totalCompleted)}</td>
          <td>${formatNumber(totalCompletedPersons)}</td>
          <td>${rateBadge(overallRate)}</td>
        </tr>
      </tbody>
    </table>
    ${generateFooter(settings)}
  `;
};

export const generateTopCustomersReport = (data, settings, dateRange) => {
  if (!data) return '';
  let totalAppointments = 0, totalPersons = 0, totalAmount = 0, totalPaid = 0;

  const rows = (data.byAppointments || data.topByAppointments || []).map((c, i) => {
    totalAppointments += c.totalAppointments || 0;
    totalPersons += c.totalPersons || 0;
    totalAmount += c.totalAmount || 0;
    totalPaid += c.totalPaid || 0;
    return `
    <tr>
      <td>${formatNumber(i + 1)}</td>
      <td><strong>${c.name || '-'}</strong></td>
      <td>${c.phone || '-'}</td>
      <td>${formatNumber(c.totalAppointments)}</td>
      <td>${formatNumber(c.totalPersons)}</td>
      <td>${formatCurrency(c.totalAmount)}</td>
      <td>${formatCurrency(c.totalPaid)}</td>
    </tr>`;
  }).join('');

  return `
    ${generateHeader(settings, 'تقرير أفضل العملاء', dateRange)}
    <div class="stats-row">
      <div class="stat-box"><span class="value">${formatNumber((data.byAppointments || data.topByAppointments || []).length)}</span><span class="label">عدد العملاء</span></div>
      <div class="stat-box"><span class="value">${formatNumber(totalAppointments)}</span><span class="label">إجمالي المواعيد</span></div>
      <div class="stat-box"><span class="value">${formatCurrency(totalAmount)}</span><span class="label">إجمالي المبالغ</span></div>
      <div class="stat-box"><span class="value">${formatCurrency(totalPaid)}</span><span class="label">إجمالي المدفوع</span></div>
    </div>
    <div class="section-title">ترتيب العملاء</div>
    <table>
      <thead><tr><th>#</th><th>العميل</th><th>الهاتف</th><th>المواعيد</th><th>الأشخاص</th><th>المبلغ</th><th>المدفوع</th></tr></thead>
      <tbody>
        ${rows || '<tr><td colspan="7" style="text-align:center">لا توجد بيانات</td></tr>'}
        ${rows ? `<tr class="total-row-print"><td></td><td>الإجمالي</td><td></td><td>${formatNumber(totalAppointments)}</td><td>${formatNumber(totalPersons)}</td><td>${formatCurrency(totalAmount)}</td><td>${formatCurrency(totalPaid)}</td></tr>` : ''}
      </tbody>
    </table>
    ${generateFooter(settings)}
  `;
};

export const generateProfitLossReport = (data, settings, dateRange) => {
  if (!data) return '';
  const profitMargin = data.totalIncome > 0 ? calcRate(data.netProfit, data.totalIncome) : 0;

  const breakdownRows = (data.breakdown || []).map(b => `
    <tr>
      <td>${b._id || '-'}</td>
      <td>${formatCurrency(b.income)}</td>
      <td>${formatCurrency(b.expenses)}</td>
      <td style="color: ${(b.income - b.expenses) >= 0 ? '#16a34a' : '#dc2626'}; font-weight: bold;">${formatCurrency(b.income - b.expenses)}</td>
    </tr>
  `).join('');

  return `
    ${generateHeader(settings, 'تقرير الأرباح والخسائر', dateRange)}
    <div class="stats-row">
      <div class="stat-box"><span class="value">${formatCurrency(data.totalIncome)}</span><span class="label">إجمالي الإيرادات</span></div>
      <div class="stat-box"><span class="value">${formatCurrency(data.totalExpenses)}</span><span class="label">إجمالي المصروفات</span></div>
      <div class="stat-box"><span class="value" style="color: ${(data.netProfit || 0) >= 0 ? '#16a34a' : '#dc2626'}">${formatCurrency(data.netProfit)}</span><span class="label">صافي الربح</span></div>
      <div class="stat-box"><span class="value">${formatPercent(profitMargin)}</span><span class="label">هامش الربح</span></div>
    </div>
    ${breakdownRows ? `
    <div class="section-title">التفاصيل الشهرية</div>
    <table>
      <thead><tr><th>الفترة</th><th>الإيرادات</th><th>المصروفات</th><th>الصافي</th></tr></thead>
      <tbody>
        ${breakdownRows}
        <tr class="total-row-print">
          <td>الإجمالي</td>
          <td>${formatCurrency(data.totalIncome)}</td>
          <td>${formatCurrency(data.totalExpenses)}</td>
          <td>${formatCurrency(data.netProfit)}</td>
        </tr>
      </tbody>
    </table>` : ''}
    ${generateFooter(settings)}
  `;
};

export const generateDepartmentsReport = (data, settings, dateRange) => {
  let totalAppt = 0, totalPersons = 0, totalAmount = 0, totalPaid = 0;
  const rows = (data || []).map(dept => {
    totalAppt += dept.totalAppointments || dept.appointmentsCount || 0;
    totalPersons += dept.totalPersons || 0;
    totalAmount += dept.totalAmount || 0;
    totalPaid += dept.totalPaid || 0;
    const remaining = (dept.totalAmount || 0) - (dept.totalPaid || 0);
    return `
    <tr>
      <td><strong>${dept.departmentName || dept.title || '-'}</strong></td>
      <td>${formatNumber(dept.totalAppointments || dept.appointmentsCount)}</td>
      <td>${formatNumber(dept.totalPersons)}</td>
      <td>${formatCurrency(dept.totalAmount)}</td>
      <td>${formatCurrency(dept.totalPaid)}</td>
      <td style="color: ${remaining > 0 ? '#dc2626' : '#16a34a'}">${formatCurrency(remaining)}</td>
    </tr>`;
  }).join('');

  const totalRemaining = totalAmount - totalPaid;

  return `
    ${generateHeader(settings, 'تقرير الأقسام', dateRange)}
    <div class="stats-row">
      <div class="stat-box"><span class="value">${formatNumber((data || []).length)}</span><span class="label">عدد الأقسام</span></div>
      <div class="stat-box"><span class="value">${formatNumber(totalAppt)}</span><span class="label">إجمالي المواعيد</span></div>
      <div class="stat-box"><span class="value">${formatCurrency(totalAmount)}</span><span class="label">إجمالي المبالغ</span></div>
      <div class="stat-box"><span class="value">${formatCurrency(totalPaid)}</span><span class="label">المدفوع</span></div>
    </div>
    <div class="section-title">تفاصيل الأقسام</div>
    <table>
      <thead><tr><th>القسم</th><th>المواعيد</th><th>الأشخاص</th><th>المبلغ</th><th>المدفوع</th><th>المتبقي</th></tr></thead>
      <tbody>
        ${rows || '<tr><td colspan="6" style="text-align:center">لا توجد بيانات</td></tr>'}
        ${rows ? `<tr class="total-row-print"><td>الإجمالي</td><td>${formatNumber(totalAppt)}</td><td>${formatNumber(totalPersons)}</td><td>${formatCurrency(totalAmount)}</td><td>${formatCurrency(totalPaid)}</td><td style="color: ${totalRemaining > 0 ? '#dc2626' : '#16a34a'}">${formatCurrency(totalRemaining)}</td></tr>` : ''}
      </tbody>
    </table>
    ${generateFooter(settings)}
  `;
};

export const generateFinancialReport = (data, settings, dateRange) => {
  if (!data) return '';
  const paid = data.totals?.totalPaid || data.totals?.paidAmount || 0;
  const remaining = (data.totals?.totalAmount || 0) - paid;
  const collectionRate = data.totals?.totalAmount > 0 ? calcRate(paid, data.totals.totalAmount) : 0;

  const methodLabels = { cash: 'نقدي', card: 'شبكة', transfer: 'تحويل بنكي', bank_transfer: 'تحويل بنكي' };
  let methodTotal = 0;
  const methodRows = (data.paymentMethods || []).map(m => {
    const mAmount = m.total || m.amount || 0;
    methodTotal += mAmount;
    return `<tr><td>${methodLabels[m._id] || m._id || '-'}</td><td>${formatNumber(m.count)}</td><td>${formatCurrency(mAmount)}</td><td>${formatPercent(calcRate(mAmount, paid))}</td></tr>`;
  }).join('');

  return `
    ${generateHeader(settings, 'التقرير المالي', dateRange)}
    <div class="stats-row">
      <div class="stat-box"><span class="value">${formatCurrency(data.totals?.totalAmount)}</span><span class="label">إجمالي المبالغ</span></div>
      <div class="stat-box"><span class="value">${formatCurrency(paid)}</span><span class="label">المدفوع</span></div>
      <div class="stat-box ${remaining > 0 ? 'warning' : ''}"><span class="value">${formatCurrency(remaining)}</span><span class="label">المتبقي</span></div>
      <div class="stat-box"><span class="value">${formatPercent(collectionRate)}</span><span class="label">نسبة التحصيل</span></div>
    </div>
    ${methodRows ? `
    <div class="section-title">طرق الدفع</div>
    <table>
      <thead><tr><th>الطريقة</th><th>العدد</th><th>المبلغ</th><th>النسبة</th></tr></thead>
      <tbody>
        ${methodRows}
        <tr class="total-row-print"><td>الإجمالي</td><td></td><td>${formatCurrency(methodTotal)}</td><td>100%</td></tr>
      </tbody>
    </table>` : ''}
    ${generateFooter(settings)}
  `;
};

export const generateEmployeesReport = (data, settings, dateRange) => {
  let totalCount = 0, totalPersons = 0, totalAmount = 0, totalPaid = 0;
  const rows = (data || []).map(emp => {
    totalCount += emp.count || 0;
    totalPersons += emp.persons || 0;
    totalAmount += emp.amount || 0;
    totalPaid += emp.paid || 0;
    const remaining = (emp.amount || 0) - (emp.paid || 0);
    return `
    <tr>
      <td><strong>${emp._id || '-'}</strong></td>
      <td>${formatNumber(emp.count)}</td>
      <td>${formatNumber(emp.persons)}</td>
      <td>${formatCurrency(emp.amount)}</td>
      <td>${formatCurrency(emp.paid)}</td>
      <td style="color: ${remaining > 0 ? '#dc2626' : '#16a34a'}">${formatCurrency(remaining)}</td>
    </tr>`;
  }).join('');

  const totalRemaining = totalAmount - totalPaid;

  return `
    ${generateHeader(settings, 'تقرير الموظفين', dateRange)}
    <div class="stats-row">
      <div class="stat-box"><span class="value">${formatNumber((data || []).length)}</span><span class="label">عدد الموظفين</span></div>
      <div class="stat-box"><span class="value">${formatNumber(totalCount)}</span><span class="label">إجمالي المواعيد</span></div>
      <div class="stat-box"><span class="value">${formatCurrency(totalAmount)}</span><span class="label">إجمالي المبالغ</span></div>
      <div class="stat-box"><span class="value">${formatCurrency(totalPaid)}</span><span class="label">المدفوع</span></div>
    </div>
    <div class="section-title">تفاصيل الموظفين</div>
    <table>
      <thead><tr><th>الموظف</th><th>المواعيد</th><th>الأشخاص</th><th>المبلغ</th><th>المدفوع</th><th>المتبقي</th></tr></thead>
      <tbody>
        ${rows || '<tr><td colspan="6" style="text-align:center">لا توجد بيانات</td></tr>'}
        ${rows ? `<tr class="total-row-print"><td>الإجمالي</td><td>${formatNumber(totalCount)}</td><td>${formatNumber(totalPersons)}</td><td>${formatCurrency(totalAmount)}</td><td>${formatCurrency(totalPaid)}</td><td style="color: ${totalRemaining > 0 ? '#dc2626' : '#16a34a'}">${formatCurrency(totalRemaining)}</td></tr>` : ''}
      </tbody>
    </table>
    ${generateFooter(settings)}
  `;
};

/**
 * فتح التقرير في نافذة جديدة
 * @param {string} content - HTML content
 * @param {string} title - عنوان النافذة
 * @param {boolean} autoPrint - هل يطبع تلقائياً
 */
export const openReportWindow = (content, title = 'تقرير', autoPrint = false) => {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لعرض التقرير');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>${printStyles}</style>
    </head>
    <body>
      <div class="print-container">${content}</div>
      ${autoPrint ? '<script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>' : ''}
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
