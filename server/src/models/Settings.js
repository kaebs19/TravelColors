const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // نوع الإعداد - لتمييز مجموعات الإعدادات المختلفة
  key: {
    type: String,
    required: true,
    unique: true
  },

  // إعدادات الشركة العامة
  companyName: {
    type: String,
    default: 'ألوان المسافر للسفر والسياحة'
  },
  companyNameEn: {
    type: String,
    default: 'Travel Colors'
  },
  email: {
    type: String,
    default: 'INFO@TRCOLORS.COM'
  },
  phone: {
    type: String,
    default: '+966558741741'
  },
  address: {
    type: String,
    default: 'الرياض حي الصحافة شارع الأمير ناصر بن سعود بن فرحان آل سعود'
  },
  addressNumber: {
    type: String,
    default: 'RIYADH 4785'
  },
  logo: {
    type: String,
    default: ''
  },

  // إعدادات الضريبة
  tax: {
    enabled: { type: Boolean, default: true },
    rate: { type: Number, default: 15 }, // نسبة الضريبة
    number: { type: String, default: '' }, // الرقم الضريبي
    name: { type: String, default: 'ضريبة القيمة المضافة' }
  },

  // شروط وأحكام عروض الأسعار
  quoteTerms: {
    type: String,
    default: `الشروط:
جميع التذاكر خاضعة لقوانين شركة الطيران
الفنادق خاضعة لسياسة الشركة`
  },

  // شروط وأحكام الفواتير
  invoiceTerms: {
    type: String,
    default: `سياسة الحجوزات والإلغاء:

التذاكر: تخضع تذاكر الطيران لشروط وأحكام شركات الطيران فيما يتعلق بإجراءات التعديل أو الاسترداد.

الفنادق: تخضع حجوزات الفنادق لسياسة الإلغاء والتعديل الخاصة بكل فندق.

التأشيرات: رسوم التأشيرة غير قابلة للاسترداد بعد تقديم الطلب، ولا تتحمل شركتنا مسؤولية رفض الطلب من قبل السفارة أو أي أخطاء متعلقة بالتأشيرة، أو التأخير في إصدارها من قبل الجهات المعنية.

ملاحظة: في حالة الإلغاء، قد تستغرق عملية استرداد المبلغ ما يصل إلى 30 يوم عمل.`
  },

  // إعدادات الطباعة
  printSettings: {
    paperSize: { type: String, default: 'A4' }, // A4, A5, Letter
    showLogo: { type: Boolean, default: true },
    showTerms: { type: Boolean, default: true },
    showTax: { type: Boolean, default: true }
  },

  // شروط الإيصال
  receiptTerms: {
    type: String,
    default: `شكراً لاختياركم ألوان المسافر
نتمنى لكم رحلة سعيدة`
  },

  // إعدادات الإيصال
  receiptSettings: {
    showCompanyInfo: { type: Boolean, default: true },
    showTerms: { type: Boolean, default: true },
    showPaymentDetails: { type: Boolean, default: true },
    showEmployeeName: { type: Boolean, default: true }
  },

  // رسائل المواعيد
  confirmedMessage: {
    type: String,
    default: ''
  },
  unconfirmedMessage: {
    type: String,
    default: ''
  },

  // ساعات العمل
  workingHours: {
    startHour: { type: Number, default: 8 },
    endHour: { type: Number, default: 14 },
    workingDays: { type: [Number], default: [0, 1, 2, 3, 4] } // 0=الأحد إلى 4=الخميس
  },

  // إعدادات المواعيد
  appointmentSettings: {
    startHour: { type: Number, default: 8 },      // 0-23
    endHour: { type: Number, default: 14 },       // 0-23
    minuteIntervals: { type: [Number], default: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] },
    durationOptions: { type: [Number], default: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] }
  },

  // نوع التاريخ
  calendarType: {
    type: String,
    enum: ['gregorian', 'hijri'],
    default: 'gregorian'
  },

  // الأعمدة الظاهرة في إدارة المواعيد
  appointmentsTableColumns: {
    type: { type: Boolean, default: true },         // النوع
    customerName: { type: Boolean, default: true }, // العميل
    phone: { type: Boolean, default: true },        // رقم الجوال
    personsCount: { type: Boolean, default: true }, // العدد
    department: { type: Boolean, default: true },   // القسم
    city: { type: Boolean, default: true },         // المدينة
    date: { type: Boolean, default: true },         // التاريخ
    time: { type: Boolean, default: true },         // الوقت
    notes: { type: Boolean, default: true },        // ملاحظات
    status: { type: Boolean, default: true },       // الحالة
    createdBy: { type: Boolean, default: true },    // مضاف بواسطة
    isSubmission: { type: Boolean, default: true }  // تقديم
  },

  // إعدادات Google Sheets
  googleSheets: {
    enabled: { type: Boolean, default: false },
    spreadsheetId: { type: String, default: '' },
    sheetName: { type: String, default: 'Appointments' },
    lastSyncAt: { type: Date },
    syncStatus: {
      type: String,
      enum: ['idle', 'syncing', 'success', 'error'],
      default: 'idle'
    },
    lastError: { type: String, default: '' },
    totalSynced: { type: Number, default: 0 }
  },

  // المدن المتاحة
  cities: [{
    id: String,
    name: String,
    enabled: { type: Boolean, default: true }
  }],

  // إعدادات التذكيرات
  reminders: {
    enabled: { type: Boolean, default: true },
    daysBefore: { type: Number, default: 1 },
    reminderTime: { type: String, default: '09:00' }
  },

  // العملة
  currency: {
    code: { type: String, default: 'SAR' },
    symbol: { type: String, default: 'ر.س' },
    name: { type: String, default: 'ريال سعودي' }
  },

  // طرق الدفع
  paymentTypes: [{
    id: String,
    label: String,
    icon: { type: String, default: '💰' },
    enabled: { type: Boolean, default: true }
  }],

  // حالات المواعيد
  appointmentStatuses: [{
    id: String,
    label: String,
    icon: String,
    color: String,
    enabled: { type: Boolean, default: true }
  }],

  // المنتجات المتاحة
  products: [{
    id: String,
    name: String,
    nameEn: String,
    defaultPrice: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true }
  }],

  // إعدادات النظام
  allowRegistration: {
    type: Boolean,
    default: true
  },
  requireEmailVerification: {
    type: Boolean,
    default: false
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },

  // إعدادات الإشعارات
  emailNotifications: {
    type: Boolean,
    default: true
  },
  smsNotifications: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// إنشاء الإعدادات الافتراضية إذا لم تكن موجودة
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne({ key: 'main' });

  if (!settings) {
    settings = await this.create({
      key: 'main',
      companyName: 'الوان المسافر للسفر والسياحة',
      companyNameEn: 'Travel Colors',
      email: 'INFO@TRCOLORS.COM',
      phone: '+966558741741',
      address: 'الرياض حي الصحافة شارع الأمير ناصر بن سعود بن فرحان آل سعود',
      addressNumber: 'RIYADH 4785',
      tax: {
        enabled: true,
        rate: 15,
        number: '',
        name: 'ضريبة القيمة المضافة'
      },
      quoteTerms: `الشروط:
جميع التذاكر خاضعة لقوانين شركة الطيران
الفنادق خاضعة لسياسة الشركة`,
      invoiceTerms: `سياسة الحجوزات والإلغاء:

التذاكر: تخضع تذاكر الطيران لشروط وأحكام شركات الطيران فيما يتعلق بإجراءات التعديل أو الاسترداد.

الفنادق: تخضع حجوزات الفنادق لسياسة الإلغاء والتعديل الخاصة بكل فندق.

التأشيرات: رسوم التأشيرة غير قابلة للاسترداد بعد تقديم الطلب، ولا تتحمل شركتنا مسؤولية رفض الطلب من قبل السفارة أو أي أخطاء متعلقة بالتأشيرة، أو التأخير في إصدارها من قبل الجهات المعنية.

ملاحظة: في حالة الإلغاء، قد تستغرق عملية استرداد المبلغ ما يصل إلى 30 يوم عمل.`,
      printSettings: {
        paperSize: 'A4',
        showLogo: true,
        showTerms: true,
        showTax: true
      },
      paymentTypes: [
        { id: 'cash', label: 'نقدي', icon: '💵', enabled: true },
        { id: 'card', label: 'شبكة', icon: '💳', enabled: true },
        { id: 'transfer', label: 'تحويل', icon: '🏦', enabled: true }
      ],
      appointmentStatuses: [
        { id: 'new', label: 'جديد', icon: '🆕', color: '#1e40af', enabled: true },
        { id: 'in_progress', label: 'قيد العمل', icon: '🔄', color: '#f59e0b', enabled: true },
        { id: 'completed', label: 'مكتمل', icon: '✔️', color: '#374151', enabled: true },
        { id: 'cancelled', label: 'ملغي', icon: '❌', color: '#991b1b', enabled: true }
      ],
      products: [
        { id: 'ticket', name: 'تذكرة طيران', nameEn: 'Flight Ticket', defaultPrice: 0, enabled: true },
        { id: 'hotel', name: 'حجز فندق', nameEn: 'Hotel Booking', defaultPrice: 0, enabled: true },
        { id: 'visa', name: 'تأشيرة', nameEn: 'Visa', defaultPrice: 0, enabled: true },
        { id: 'tour', name: 'رحلة سياحية', nameEn: 'Tour Package', defaultPrice: 0, enabled: true },
        { id: 'transport', name: 'نقل', nameEn: 'Transportation', defaultPrice: 0, enabled: true },
        { id: 'insurance', name: 'تأمين سفر', nameEn: 'Travel Insurance', defaultPrice: 0, enabled: true }
      ],
      cities: [
        { id: 'riyadh', name: 'الرياض', enabled: true },
        { id: 'jeddah', name: 'جدة', enabled: true },
        { id: 'makkah', name: 'مكة المكرمة', enabled: true },
        { id: 'madinah', name: 'المدينة المنورة', enabled: true },
        { id: 'dammam', name: 'الدمام', enabled: true },
        { id: 'khobar', name: 'الخبر', enabled: true }
      ],
      workingHours: {
        startHour: 8,
        endHour: 14,
        workingDays: [0, 1, 2, 3, 4]
      },
      appointmentSettings: {
        startHour: 8,
        endHour: 14,
        minuteIntervals: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
        durationOptions: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
      },
      calendarType: 'gregorian',
      appointmentsTableColumns: {
        type: true,
        customerName: true,
        phone: true,
        personsCount: true,
        department: true,
        city: true,
        date: true,
        time: true,
        notes: true,
        status: true,
        createdBy: true,
        isSubmission: true
      },
      googleSheets: {
        enabled: false,
        spreadsheetId: '',
        sheetName: 'Appointments',
        syncStatus: 'idle',
        lastError: '',
        totalSynced: 0
      },
      reminders: {
        enabled: true,
        daysBefore: 1,
        reminderTime: '09:00'
      },
      currency: {
        code: 'SAR',
        symbol: 'ر.س',
        name: 'ريال سعودي'
      },
      confirmedMessage: `عزيزي العميل: {اسم_العميل} 🤝

نؤكد لك حجز موعدك لدى: {الجهة}

📅 تفاصيل الموعد:
- التاريخ: {التاريخ}
- الوقت: {الوقت}
- عدد الأشخاص: {العدد}
- الموقع: {رابط_الموقع}

⏰ الرجاء الحضور قبل الموعد بـ 15 دقيقة.

مع أطيب التحيات،
ألوان المسافر للسفر والسياحة 🌍`,
      unconfirmedMessage: `عزيزي العميل: {اسم_العميل} 🤝

تم تسجيل طلب موعدك لدى: {الجهة}

📅 الفترة المتوقعة للموعد:
- من: {تاريخ_البداية}
- إلى: {تاريخ_النهاية}
- عدد الأشخاص: {العدد}

📌 ملاحظة مهمة:
هذا الموعد قيد التأكيد، وسنوافيك بالتاريخ والوقت المحدد فور تأكيده.

مع أطيب التحيات،
ألوان المسافر للسفر والسياحة 🌍`
    });
  }

  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
