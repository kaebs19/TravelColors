const { getSheetsApi, isGoogleSheetsEnabled } = require('../config/google');

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Appointments';
const STATS_SHEET_NAME = 'احصائيات';

/**
 * تنسيق التاريخ بالأرقام الإنجليزية
 */
const formatDateEN = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateTimeEN = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * الحصول على اسم الشهر بالعربية
 */
const getArabicMonthName = (date) => {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const d = new Date(date);
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};

const translateStatus = (status) => {
  const statusMap = {
    new: 'جديد',
    in_progress: 'قيد العمل',
    completed: 'مكتمل',
    cancelled: 'ملغي'
  };
  return statusMap[status] || status || '';
};

const translateType = (type) => {
  const typeMap = {
    confirmed: 'مؤكد',
    unconfirmed: 'غير مؤكد',
    draft: 'مسودة'
  };
  return typeMap[type] || type || '';
};

/**
 * تحويل موعد إلى صف
 */
const appointmentToRow = (appointment) => {
  return [
    appointment._id.toString(),
    appointment.customerName || '',
    appointment.phone || '',
    String(appointment.personsCount || 1),
    appointment.department?.title || '',
    appointment.city || '',
    formatDateEN(appointment.appointmentDate || appointment.dateFrom),
    appointment.appointmentTime || '',
    translateStatus(appointment.status),
    translateType(appointment.type),
    appointment.createdBy?.name || '',
    appointment.isVIP ? 'نعم' : 'لا',
    String(appointment.totalAmount || 0),
    String(appointment.paidAmount || 0),
    appointment.notes || '',
    formatDateTimeEN(appointment.createdAt)
  ];
};

const HEADERS = [
  'ID', 'الاسم', 'الهاتف', 'عدد الأشخاص', 'القسم', 'المدينة',
  'التاريخ', 'الوقت', 'الحالة', 'النوع', 'أضيف بواسطة', 'VIP',
  'المبلغ', 'المدفوع', 'ملاحظات', 'تاريخ الإنشاء'
];

const TOTAL_COLS = HEADERS.length;

/**
 * البحث عن صف بواسطة ID
 */
const findRowById = async (appointmentId) => {
  if (!isGoogleSheetsEnabled()) return null;
  try {
    const sheets = getSheetsApi();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:A`
    });
    const values = response.data.values || [];
    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === appointmentId.toString()) return i + 1;
    }
    return null;
  } catch (error) {
    console.error('Error finding row by ID:', error.message);
    return null;
  }
};

/**
 * إضافة موعد جديد
 */
const addAppointment = async (appointment) => {
  if (!isGoogleSheetsEnabled()) { console.log('Google Sheets sync is disabled'); return false; }
  try {
    const sheets = getSheetsApi();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:P`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [appointmentToRow(appointment)] }
    });
    console.log(`Appointment ${appointment._id} added to Google Sheets`);
    return true;
  } catch (error) {
    console.error('Error adding appointment to Google Sheets:', error.message);
    return false;
  }
};

/**
 * تحديث موعد
 */
const updateAppointment = async (appointment) => {
  if (!isGoogleSheetsEnabled()) return false;
  try {
    const rowNumber = await findRowById(appointment._id);
    if (!rowNumber) return await addAppointment(appointment);
    const sheets = getSheetsApi();
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${rowNumber}:P${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [appointmentToRow(appointment)] }
    });
    console.log(`Appointment ${appointment._id} updated in Google Sheets`);
    return true;
  } catch (error) {
    console.error('Error updating appointment in Google Sheets:', error.message);
    return false;
  }
};

/**
 * حذف موعد
 */
const deleteAppointment = async (appointmentId) => {
  if (!isGoogleSheetsEnabled()) return false;
  try {
    const rowNumber = await findRowById(appointmentId);
    if (!rowNumber) { console.log(`Appointment ${appointmentId} not found`); return true; }
    const sheets = getSheetsApi();
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.data.sheets.find(s => s.properties.title === SHEET_NAME);
    if (!sheet) { console.error(`Sheet ${SHEET_NAME} not found`); return false; }
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ deleteDimension: { range: { sheetId: sheet.properties.sheetId, dimension: 'ROWS', startIndex: rowNumber - 1, endIndex: rowNumber } } }]
      }
    });
    console.log(`Appointment ${appointmentId} deleted from Google Sheets`);
    return true;
  } catch (error) {
    console.error('Error deleting appointment from Google Sheets:', error.message);
    return false;
  }
};

/**
 * تجميع المواعيد حسب الشهر
 */
const groupByMonth = (appointments) => {
  const groups = {};
  appointments.forEach(apt => {
    const date = apt.appointmentDate || apt.dateFrom || apt.createdAt;
    if (!date) return;
    const d = new Date(date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!groups[key]) groups[key] = { label: getArabicMonthName(date), appointments: [] };
    groups[key].appointments.push(apt);
  });
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
};

/**
 * حساب إحصائيات الشهر
 */
const getMonthStats = (appointments) => {
  const totalPersons = appointments.reduce((sum, a) => sum + (a.personsCount || 1), 0);
  const totalAmount = appointments.reduce((sum, a) => sum + (a.totalAmount || 0), 0);
  const totalPaid = appointments.reduce((sum, a) => sum + (a.paidAmount || 0), 0);

  // إحصائيات حسب الموظف
  const byEmployee = {};
  appointments.forEach(a => {
    const name = a.createdBy?.name || 'غير محدد';
    if (!byEmployee[name]) byEmployee[name] = { count: 0, persons: 0 };
    byEmployee[name].count++;
    byEmployee[name].persons += (a.personsCount || 1);
  });

  // إحصائيات حسب الحالة
  const byStatus = {};
  appointments.forEach(a => {
    const status = translateStatus(a.status);
    byStatus[status] = (byStatus[status] || 0) + 1;
  });

  return { totalPersons, totalAmount, totalPaid, byEmployee, byStatus };
};

/**
 * مزامنة كاملة مع فصل الأشهر + إحصائيات + تنسيق احترافي
 */
const fullSync = async (appointments) => {
  if (!isGoogleSheetsEnabled()) return false;

  try {
    const sheets = getSheetsApi();

    // الحصول على Sheet ID
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.data.sheets.find(s => s.properties.title === SHEET_NAME);
    if (!sheet) { console.error(`Sheet ${SHEET_NAME} not found`); return false; }
    const sheetId = sheet.properties.sheetId;

    // مسح البيانات الحالية
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:Z`
    });

    // مسح التنسيقات القديمة (unmerge)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{
          unmergeCells: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 5000, startColumnIndex: 0, endColumnIndex: 26 }
          }
        }]
      }
    }).catch(() => {});

    const monthGroups = groupByMonth(appointments);

    // بناء الصفوف
    const allRows = [];
    const monthHeaderRows = [];
    const dataHeaderRows = [];
    const statsHeaderRows = [];
    const statsSummaryRows = [];
    const employeeRows = [];
    const separatorRows = [];
    const statusCells = []; // [{row, status}] لتلوين خلايا الحالة

    monthGroups.forEach(([monthKey, group]) => {
      const stats = getMonthStats(group.appointments);

      // === صف عنوان الشهر ===
      const monthRow = new Array(TOTAL_COLS).fill('');
      monthRow[0] = `${group.label}`;
      monthHeaderRows.push(allRows.length + 1);
      allRows.push(monthRow);

      // === صف أعمدة البيانات ===
      dataHeaderRows.push(allRows.length + 1);
      allRows.push([...HEADERS]);

      // === صفوف المواعيد ===
      group.appointments.forEach(apt => {
        statusCells.push({ row: allRows.length + 1, status: apt.status });
        allRows.push(appointmentToRow(apt));
      });

      // === صف ملخص الشهر ===
      const summaryRow = new Array(TOTAL_COLS).fill('');
      summaryRow[0] = 'الملخص';
      summaryRow[1] = `اجمالي المواعيد: ${group.appointments.length}`;
      summaryRow[3] = `اجمالي الأشخاص: ${stats.totalPersons}`;
      summaryRow[8] = Object.entries(stats.byStatus).map(([s, c]) => `${s}: ${c}`).join(' | ');
      summaryRow[12] = `${stats.totalAmount}`;
      summaryRow[13] = `${stats.totalPaid}`;
      statsHeaderRows.push(allRows.length + 1);
      allRows.push(summaryRow);

      // === صفوف إحصائيات الموظفين ===
      const employees = Object.entries(stats.byEmployee);
      if (employees.length > 0) {
        const empHeaderRow = new Array(TOTAL_COLS).fill('');
        empHeaderRow[0] = '';
        empHeaderRow[1] = 'الموظف';
        empHeaderRow[3] = 'عدد المواعيد';
        empHeaderRow[5] = 'عدد الأشخاص';
        statsSummaryRows.push(allRows.length + 1);
        allRows.push(empHeaderRow);

        employees.forEach(([name, data]) => {
          const empRow = new Array(TOTAL_COLS).fill('');
          empRow[1] = name;
          empRow[3] = String(data.count);
          empRow[5] = String(data.persons);
          employeeRows.push(allRows.length + 1);
          allRows.push(empRow);
        });
      }

      // === صف فاصل بين الأشهر ===
      separatorRows.push(allRows.length + 1);
      allRows.push(new Array(TOTAL_COLS).fill(''));
    });

    // كتابة البيانات
    if (allRows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:P${allRows.length}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: allRows }
      });
    }

    // ====== التنسيق ======
    const fmt = [];

    // --- عرض الأعمدة ---
    fmt.push({ updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 1 }, fields: 'pixelSize' } }); // ID مخفي
    fmt.push({ updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 }, properties: { pixelSize: 180 }, fields: 'pixelSize' } }); // الاسم
    fmt.push({ updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 }, properties: { pixelSize: 130 }, fields: 'pixelSize' } }); // الهاتف
    fmt.push({ updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 }, properties: { pixelSize: 90 }, fields: 'pixelSize' } }); // عدد الأشخاص
    fmt.push({ updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 4, endIndex: 6 }, properties: { pixelSize: 110 }, fields: 'pixelSize' } }); // القسم + المدينة
    fmt.push({ updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 6, endIndex: 8 }, properties: { pixelSize: 110 }, fields: 'pixelSize' } }); // التاريخ + الوقت
    fmt.push({ updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 8, endIndex: 10 }, properties: { pixelSize: 100 }, fields: 'pixelSize' } }); // الحالة + النوع
    fmt.push({ updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 10, endIndex: 11 }, properties: { pixelSize: 130 }, fields: 'pixelSize' } }); // أضيف بواسطة
    fmt.push({ updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 11, endIndex: 12 }, properties: { pixelSize: 50 }, fields: 'pixelSize' } }); // VIP
    fmt.push({ updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 12, endIndex: 14 }, properties: { pixelSize: 90 }, fields: 'pixelSize' } }); // المبلغ + المدفوع
    fmt.push({ updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 14, endIndex: 15 }, properties: { pixelSize: 200 }, fields: 'pixelSize' } }); // ملاحظات
    fmt.push({ updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 15, endIndex: 16 }, properties: { pixelSize: 140 }, fields: 'pixelSize' } }); // تاريخ الإنشاء

    // --- RTL ---
    fmt.push({ updateSheetProperties: { properties: { sheetId, rightToLeft: true }, fields: 'rightToLeft' } });

    // --- تنسيق عناوين الأشهر ---
    monthHeaderRows.forEach(r => {
      fmt.push({ mergeCells: { range: { sheetId, startRowIndex: r - 1, endRowIndex: r, startColumnIndex: 0, endColumnIndex: TOTAL_COLS }, mergeType: 'MERGE_ALL' } });
      fmt.push({ repeatCell: {
        range: { sheetId, startRowIndex: r - 1, endRowIndex: r, startColumnIndex: 0, endColumnIndex: TOTAL_COLS },
        cell: { userEnteredFormat: {
          backgroundColor: { red: 0.13, green: 0.22, blue: 0.42 },
          textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 14 },
          horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE'
        }},
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
      }});
      fmt.push({ updateDimensionProperties: { range: { sheetId, dimension: 'ROWS', startIndex: r - 1, endIndex: r }, properties: { pixelSize: 45 }, fields: 'pixelSize' } });
    });

    // --- تنسيق أعمدة البيانات ---
    dataHeaderRows.forEach(r => {
      fmt.push({ repeatCell: {
        range: { sheetId, startRowIndex: r - 1, endRowIndex: r, startColumnIndex: 0, endColumnIndex: TOTAL_COLS },
        cell: { userEnteredFormat: {
          backgroundColor: { red: 0.82, green: 0.86, blue: 0.94 },
          textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 0.1, green: 0.1, blue: 0.3 } },
          horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE',
          borders: { bottom: { style: 'SOLID', width: 2, color: { red: 0.13, green: 0.22, blue: 0.42 } } }
        }},
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,borders)'
      }});
    });

    // --- تنسيق صف الملخص ---
    statsHeaderRows.forEach(r => {
      fmt.push({ repeatCell: {
        range: { sheetId, startRowIndex: r - 1, endRowIndex: r, startColumnIndex: 0, endColumnIndex: TOTAL_COLS },
        cell: { userEnteredFormat: {
          backgroundColor: { red: 0.93, green: 0.96, blue: 0.88 },
          textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 0.2, green: 0.35, blue: 0.15 } },
          horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE'
        }},
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
      }});
      fmt.push({ updateDimensionProperties: { range: { sheetId, dimension: 'ROWS', startIndex: r - 1, endIndex: r }, properties: { pixelSize: 35 }, fields: 'pixelSize' } });
    });

    // --- تنسيق عنوان الموظفين ---
    statsSummaryRows.forEach(r => {
      fmt.push({ repeatCell: {
        range: { sheetId, startRowIndex: r - 1, endRowIndex: r, startColumnIndex: 0, endColumnIndex: TOTAL_COLS },
        cell: { userEnteredFormat: {
          backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 },
          textFormat: { bold: true, fontSize: 9, foregroundColor: { red: 0.3, green: 0.3, blue: 0.3 } },
          horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE'
        }},
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
      }});
    });

    // --- تنسيق صفوف الموظفين ---
    employeeRows.forEach(r => {
      fmt.push({ repeatCell: {
        range: { sheetId, startRowIndex: r - 1, endRowIndex: r, startColumnIndex: 0, endColumnIndex: TOTAL_COLS },
        cell: { userEnteredFormat: {
          backgroundColor: { red: 0.98, green: 0.98, blue: 0.98 },
          textFormat: { fontSize: 9 },
          horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE'
        }},
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
      }});
    });

    // --- فاصل بين الأشهر (خط سميك) ---
    separatorRows.forEach(r => {
      fmt.push({ updateDimensionProperties: { range: { sheetId, dimension: 'ROWS', startIndex: r - 1, endIndex: r }, properties: { pixelSize: 8 }, fields: 'pixelSize' } });
      fmt.push({ repeatCell: {
        range: { sheetId, startRowIndex: r - 1, endRowIndex: r, startColumnIndex: 0, endColumnIndex: TOTAL_COLS },
        cell: { userEnteredFormat: {
          backgroundColor: { red: 0.75, green: 0.75, blue: 0.75 }
        }},
        fields: 'userEnteredFormat(backgroundColor)'
      }});
    });

    // --- تلوين خلايا الحالة ---
    const statusColors = {
      'new': { bg: { red: 0.86, green: 0.93, blue: 1 }, fg: { red: 0.12, green: 0.25, blue: 0.69 } },           // أزرق فاتح
      'in_progress': { bg: { red: 1, green: 0.95, blue: 0.78 }, fg: { red: 0.71, green: 0.33, blue: 0.04 } },   // برتقالي
      'completed': { bg: { red: 0.82, green: 0.94, blue: 0.85 }, fg: { red: 0.03, green: 0.37, blue: 0.27 } },  // أخضر
      'cancelled': { bg: { red: 1, green: 0.89, blue: 0.89 }, fg: { red: 0.6, green: 0.11, blue: 0.11 } }       // أحمر
    };
    statusCells.forEach(({ row, status }) => {
      const colors = statusColors[status] || statusColors['new'];
      fmt.push({ repeatCell: {
        range: { sheetId, startRowIndex: row - 1, endRowIndex: row, startColumnIndex: 8, endColumnIndex: 9 },
        cell: { userEnteredFormat: {
          backgroundColor: colors.bg,
          textFormat: { bold: true, foregroundColor: colors.fg },
          horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE'
        }},
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
      }});
    });

    // --- تنسيق عام ---
    if (allRows.length > 0) {
      fmt.push({ repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: allRows.length, startColumnIndex: 0, endColumnIndex: TOTAL_COLS },
        cell: { userEnteredFormat: { verticalAlignment: 'MIDDLE', wrapStrategy: 'WRAP' } },
        fields: 'userEnteredFormat(verticalAlignment,wrapStrategy)'
      }});
    }

    // تطبيق التنسيق
    if (fmt.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests: fmt }
      });
    }

    // ====== ورقة الإحصائيات ======
    await syncStatsSheet(sheets, spreadsheet, appointments, monthGroups);

    console.log(`Full sync completed: ${appointments.length} appointments in ${monthGroups.length} months`);
    return true;
  } catch (error) {
    console.error('Error in full sync:', error.message);
    return false;
  }
};

/**
 * مزامنة ورقة الإحصائيات مع Charts
 */
const syncStatsSheet = async (sheets, spreadsheet, appointments, monthGroups) => {
  try {
    // البحث عن ورقة الإحصائيات أو إنشاؤها
    let statsSheet = spreadsheet.data.sheets.find(s => s.properties.title === STATS_SHEET_NAME);
    let statsSheetId;

    if (!statsSheet) {
      const addRes = await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: STATS_SHEET_NAME, rightToLeft: true } } }]
        }
      });
      statsSheetId = addRes.data.replies[0].addSheet.properties.sheetId;
    } else {
      statsSheetId = statsSheet.properties.sheetId;
      // مسح البيانات القديمة
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${STATS_SHEET_NAME}!A:Z`
      });
      // حذف Charts القديمة
      if (statsSheet.charts && statsSheet.charts.length > 0) {
        const deleteChartRequests = statsSheet.charts.map(chart => ({
          deleteEmbeddedObject: { objectId: chart.chartId }
        }));
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: { requests: deleteChartRequests }
        }).catch(() => {});
      }
    }

    // --- بيانات الإحصائيات ---
    const statsRows = [];

    // عنوان
    statsRows.push(['', 'احصائيات المواعيد - ألوان المسافر', '', '', '', '', '']);
    statsRows.push(['']); // فاصل

    // === جدول 1: إحصائيات شهرية ===
    statsRows.push(['', 'الشهر', 'عدد المواعيد', 'عدد الأشخاص', 'اجمالي المبالغ', 'المدفوع', 'المتبقي']);
    const monthTableStart = statsRows.length; // 0-indexed

    let grandTotal = 0, grandPersons = 0, grandAmount = 0, grandPaid = 0;

    monthGroups.forEach(([key, group]) => {
      const persons = group.appointments.reduce((s, a) => s + (a.personsCount || 1), 0);
      const amount = group.appointments.reduce((s, a) => s + (a.totalAmount || 0), 0);
      const paid = group.appointments.reduce((s, a) => s + (a.paidAmount || 0), 0);
      statsRows.push(['', group.label, String(group.appointments.length), String(persons), String(amount), String(paid), String(amount - paid)]);
      grandTotal += group.appointments.length;
      grandPersons += persons;
      grandAmount += amount;
      grandPaid += paid;
    });

    const monthTableEnd = statsRows.length;
    statsRows.push(['', 'الإجمالي', String(grandTotal), String(grandPersons), String(grandAmount), String(grandPaid), String(grandAmount - grandPaid)]);
    statsRows.push(['']); // فاصل

    // === جدول 2: إحصائيات الموظفين ===
    statsRows.push(['', 'الموظف', 'عدد المواعيد', 'عدد الأشخاص', '', '', '']);
    const empTableStart = statsRows.length;

    const allEmployees = {};
    appointments.forEach(a => {
      const name = a.createdBy?.name || 'غير محدد';
      if (!allEmployees[name]) allEmployees[name] = { count: 0, persons: 0 };
      allEmployees[name].count++;
      allEmployees[name].persons += (a.personsCount || 1);
    });

    Object.entries(allEmployees).sort((a, b) => b[1].count - a[1].count).forEach(([name, data]) => {
      statsRows.push(['', name, String(data.count), String(data.persons), '', '', '']);
    });
    const empTableEnd = statsRows.length;

    statsRows.push(['']); // فاصل

    // === جدول 3: إحصائيات الحالات ===
    statsRows.push(['', 'الحالة', 'العدد', '', '', '', '']);
    const statusTableStart = statsRows.length;

    const allStatuses = {};
    appointments.forEach(a => {
      const status = translateStatus(a.status);
      allStatuses[status] = (allStatuses[status] || 0) + 1;
    });

    Object.entries(allStatuses).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
      statsRows.push(['', status, String(count), '', '', '', '']);
    });
    const statusTableEnd = statsRows.length;

    // كتابة البيانات
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${STATS_SHEET_NAME}!A1:G${statsRows.length}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: statsRows }
    });

    // --- تنسيق ورقة الإحصائيات ---
    const sfmt = [];

    // RTL
    sfmt.push({ updateSheetProperties: { properties: { sheetId: statsSheetId, rightToLeft: true }, fields: 'rightToLeft' } });

    // إخفاء عمود A
    sfmt.push({ updateDimensionProperties: { range: { sheetId: statsSheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 10 }, fields: 'pixelSize' } });
    // عرض الأعمدة
    sfmt.push({ updateDimensionProperties: { range: { sheetId: statsSheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 7 }, properties: { pixelSize: 140 }, fields: 'pixelSize' } });

    // عنوان رئيسي
    sfmt.push({ mergeCells: { range: { sheetId: statsSheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 1, endColumnIndex: 7 }, mergeType: 'MERGE_ALL' } });
    sfmt.push({ repeatCell: {
      range: { sheetId: statsSheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 1, endColumnIndex: 7 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 0.13, green: 0.22, blue: 0.42 },
        textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 16 },
        horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE'
      }},
      fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
    }});
    sfmt.push({ updateDimensionProperties: { range: { sheetId: statsSheetId, dimension: 'ROWS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 50 }, fields: 'pixelSize' } });

    // تنسيق عناوين الجداول (صف 3 = شهرية, صف بعد = موظفين, صف بعد = حالات)
    const tableHeaders = [2, monthTableEnd + 1, empTableEnd + 1, statusTableEnd + 1].filter(r => r < statsRows.length);
    tableHeaders.forEach(r => {
      sfmt.push({ repeatCell: {
        range: { sheetId: statsSheetId, startRowIndex: r, endRowIndex: r + 1, startColumnIndex: 1, endColumnIndex: 7 },
        cell: { userEnteredFormat: {
          backgroundColor: { red: 0.82, green: 0.86, blue: 0.94 },
          textFormat: { bold: true, fontSize: 11, foregroundColor: { red: 0.1, green: 0.1, blue: 0.3 } },
          horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE'
        }},
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
      }});
    });

    // صف الإجمالي
    sfmt.push({ repeatCell: {
      range: { sheetId: statsSheetId, startRowIndex: monthTableEnd, endRowIndex: monthTableEnd + 1, startColumnIndex: 1, endColumnIndex: 7 },
      cell: { userEnteredFormat: {
        backgroundColor: { red: 0.93, green: 0.96, blue: 0.88 },
        textFormat: { bold: true, fontSize: 11, foregroundColor: { red: 0.2, green: 0.35, blue: 0.15 } },
        horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE'
      }},
      fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
    }});

    // --- Charts ---

    // Chart 1: مواعيد شهرية (عمود)
    if (monthGroups.length > 1) {
      sfmt.push({ addChart: { chart: {
        position: { overlayPosition: { anchorCell: { sheetId: statsSheetId, rowIndex: statsRows.length + 1, columnIndex: 1 }, widthPixels: 700, heightPixels: 350 } },
        spec: {
          title: 'عدد المواعيد حسب الشهر',
          basicChart: {
            chartType: 'COLUMN',
            legendPosition: 'BOTTOM_LEGEND',
            axis: [
              { position: 'BOTTOM_AXIS', title: 'الشهر' },
              { position: 'LEFT_AXIS', title: 'العدد' }
            ],
            domains: [{ domain: { sourceRange: { sources: [{ sheetId: statsSheetId, startRowIndex: monthTableStart, endRowIndex: monthTableEnd, startColumnIndex: 1, endColumnIndex: 2 }] } } }],
            series: [
              { series: { sourceRange: { sources: [{ sheetId: statsSheetId, startRowIndex: monthTableStart, endRowIndex: monthTableEnd, startColumnIndex: 2, endColumnIndex: 3 }] } }, targetAxis: 'LEFT_AXIS', color: { red: 0.23, green: 0.45, blue: 0.78 } },
              { series: { sourceRange: { sources: [{ sheetId: statsSheetId, startRowIndex: monthTableStart, endRowIndex: monthTableEnd, startColumnIndex: 3, endColumnIndex: 4 }] } }, targetAxis: 'LEFT_AXIS', color: { red: 0.18, green: 0.62, blue: 0.42 } }
            ],
            headerCount: 0
          }
        }
      }}});
    }

    // Chart 2: إحصائيات الحالات (دائري)
    if (Object.keys(allStatuses).length > 1) {
      sfmt.push({ addChart: { chart: {
        position: { overlayPosition: { anchorCell: { sheetId: statsSheetId, rowIndex: statsRows.length + 1, columnIndex: 5 }, widthPixels: 400, heightPixels: 350 } },
        spec: {
          title: 'توزيع حالات المواعيد',
          pieChart: {
            legendPosition: 'LABELED_LEGEND',
            domain: { sourceRange: { sources: [{ sheetId: statsSheetId, startRowIndex: statusTableStart, endRowIndex: statusTableEnd, startColumnIndex: 1, endColumnIndex: 2 }] } },
            series: { sourceRange: { sources: [{ sheetId: statsSheetId, startRowIndex: statusTableStart, endRowIndex: statusTableEnd, startColumnIndex: 2, endColumnIndex: 3 }] } }
          }
        }
      }}});
    }

    // Chart 3: إحصائيات الموظفين (أعمدة أفقية)
    if (Object.keys(allEmployees).length > 1) {
      sfmt.push({ addChart: { chart: {
        position: { overlayPosition: { anchorCell: { sheetId: statsSheetId, rowIndex: statsRows.length + 20, columnIndex: 1 }, widthPixels: 700, heightPixels: 350 } },
        spec: {
          title: 'عدد المواعيد حسب الموظف',
          basicChart: {
            chartType: 'BAR',
            legendPosition: 'BOTTOM_LEGEND',
            axis: [
              { position: 'BOTTOM_AXIS', title: 'العدد' },
              { position: 'LEFT_AXIS', title: 'الموظف' }
            ],
            domains: [{ domain: { sourceRange: { sources: [{ sheetId: statsSheetId, startRowIndex: empTableStart, endRowIndex: empTableEnd, startColumnIndex: 1, endColumnIndex: 2 }] } } }],
            series: [
              { series: { sourceRange: { sources: [{ sheetId: statsSheetId, startRowIndex: empTableStart, endRowIndex: empTableEnd, startColumnIndex: 2, endColumnIndex: 3 }] } }, targetAxis: 'BOTTOM_AXIS', color: { red: 0.85, green: 0.55, blue: 0.13 } },
              { series: { sourceRange: { sources: [{ sheetId: statsSheetId, startRowIndex: empTableStart, endRowIndex: empTableEnd, startColumnIndex: 3, endColumnIndex: 4 }] } }, targetAxis: 'BOTTOM_AXIS', color: { red: 0.18, green: 0.62, blue: 0.42 } }
            ],
            headerCount: 0
          }
        }
      }}});
    }

    if (sfmt.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests: sfmt }
      });
    }

    console.log('Stats sheet synced with charts');
  } catch (error) {
    console.error('Error syncing stats sheet:', error.message);
  }
};

/**
 * قراءة البيانات من الشيت
 */
const readFromSheet = async () => {
  if (!isGoogleSheetsEnabled()) return [];
  try {
    const sheets = getSheetsApi();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:P`
    });
    return response.data.values || [];
  } catch (error) {
    console.error('Error reading from Google Sheets:', error.message);
    return [];
  }
};

/**
 * إنشاء الشيت مع Headers
 */
const initializeSheet = async () => {
  if (!isGoogleSheetsEnabled()) return false;
  try {
    const sheets = getSheetsApi();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:P1`
    });
    if (!response.data.values || response.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:P1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [HEADERS] }
      });
      console.log('Google Sheet headers initialized');
    }
    return true;
  } catch (error) {
    console.error('Error initializing sheet:', error.message);
    return false;
  }
};

module.exports = {
  addAppointment,
  updateAppointment,
  deleteAppointment,
  fullSync,
  readFromSheet,
  initializeSheet,
  findRowById
};
