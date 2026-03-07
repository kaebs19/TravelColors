const mongoose = require('mongoose');

const websiteContentSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },

  // البانر الرئيسي
  hero: {
    title: { type: String, default: 'دعنا نسافر مع ألوان المسافر' },
    subtitle: { type: String, default: 'شركة سياحية مرخصة' },
    description: { type: String, default: 'خدمات تأشيرات احترافية، رحلات مخصصة، وتجارب سفر لا تُنسى' },
    backgroundImage: { type: String, default: '' }
  },

  // الخدمات
  services: [{
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '✈️' }
  }],

  // من نحن
  aboutUs: {
    title: { type: String, default: 'من نحن' },
    description: { type: String, default: 'شركة ألوان المسافر متخصصون في استخراج تأشيرة الشنقن في وقت قصير. حجز طيران - حجوزات فندقيه حول العالم - برامج شهر العسل للعرسان - رخص دولية / مرخص من هيئة السياحة رقم : 73104877' },
    features: [{
      title: { type: String, required: true },
      description: { type: String, default: '' },
      icon: { type: String, default: '⭐' }
    }]
  },

  // الأسئلة الشائعة
  faq: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }],

  // معلومات التواصل
  contact: {
    phone: { type: String, default: '+966 55 922 9597' },
    email: { type: String, default: 'info@trcolors.com' },
    whatsapp: { type: String, default: '966559229597' },
    address: { type: String, default: 'المملكة العربية السعودية' },
    mapLink: { type: String, default: '' }
  },

  // جهات الاتصال (أقسام متعددة)
  contactDepartments: [{
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    icon: { type: String, default: '📞' },
    type: { type: String, enum: ['whatsapp', 'email', 'location'], default: 'whatsapp' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  }],

  // ساعات العمل
  workingHours: {
    weekdays: { type: String, default: 'من السبت إلى الخميس' },
    weekdaysTime: { type: String, default: '03:00 م - 11:00 م' },
    friday: { type: String, default: 'الجمعة: إجازة' },
    fridayIsOff: { type: Boolean, default: true }
  },

  // رابط الخريطة (Google Maps embed)
  mapEmbed: { type: String, default: '' },

  // وسائل التواصل الاجتماعي
  socialMedia: {
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    snapchat: { type: String, default: '' }
  },

  // التذييل
  footer: {
    copyrightText: { type: String, default: '© {year} Travel Colors - ألوان المسافر. جميع الحقوق محفوظة' }
  },

  // إعدادات عامة للموقع
  general: {
    siteName: { type: String, default: 'ألوان المسافر' },
    siteNameEn: { type: String, default: 'Travel Colors' },
    siteDescription: { type: String, default: 'شركة سياحية مرخصة - خدمات تأشيرات احترافية' },
    logo: { type: String, default: '' }
  },

  // الرخصة الدولية
  internationalLicense: {
    image: { type: String, default: '' },
    price: { type: String, default: '200' },
    currency: { type: String, default: 'ريال' },
    description: { type: String, default: 'استخراج رخصة القيادة الدولية بسرعة واحترافية' },
    requirements: [{ type: String }],
    offerEnabled: { type: Boolean, default: false },
    offerPrice: { type: String, default: '' },

    // الخدمات الإضافية (add-ons)
    addons: [{
      name: { type: String, required: true },
      price: { type: String, default: '0' },
      enabled: { type: Boolean, default: true },
      description: { type: String, default: '' }
    }],

    // كوبونات الخصم
    coupons: [{
      code: { type: String, required: true },
      discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
      discountValue: { type: String, default: '0' },
      enabled: { type: Boolean, default: true },
      maxUses: { type: Number, default: 0 },   // 0 = unlimited
      usedCount: { type: Number, default: 0 },
      expiresAt: { type: Date }
    }],

    // خيارات التسليم
    deliveryOptions: {
      pickup: {
        enabled: { type: Boolean, default: true },
        price: { type: String, default: '0' },
        message: { type: String, default: 'يرجى الاستلام من المكتب على العنوان التالي' },
        address: { type: String, default: '' }
      },
      delivery: {
        enabled: { type: Boolean, default: true },
        price: { type: String, default: '30' },
        message: { type: String, default: 'التوصيل يشمل مدينة الرياض فقط' }
      },
      shipping: {
        enabled: { type: Boolean, default: true },
        price: { type: String, default: '50' },
        message: { type: String, default: 'مدة الشحن تعتمد على شركة الشحن ومنطقتك' }
      }
    }
  },

  // إعدادات رسائل البريد الإلكتروني
  emailSettings: {
    welcome: {
      subject: { type: String, default: '' },
      greeting: { type: String, default: '' },
      bodyText: { type: String, default: '' },
      ctaText: { type: String, default: '' }
    },
    passwordReset: {
      subject: { type: String, default: '' },
      bodyText: { type: String, default: '' },
      warningText: { type: String, default: '' },
      ctaText: { type: String, default: '' }
    },
    passwordChanged: {
      subject: { type: String, default: '' },
      bodyText: { type: String, default: '' },
      warningText: { type: String, default: '' }
    },
    applicationSubmitted: {
      subject: { type: String, default: '' },
      bodyText: { type: String, default: '' },
      ctaText: { type: String, default: '' }
    },
    statusUpdate: {
      subject: { type: String, default: '' },
      bodyText: { type: String, default: '' },
      ctaText: { type: String, default: '' }
    }
  }
}, {
  timestamps: true
});

// البيانات الافتراضية لجهات الاتصال
const DEFAULT_CONTACT_DEPARTMENTS = [
  { name: 'استفسارات عامة', phone: '055 874 1741', whatsapp: '966558741741', icon: '📞', type: 'whatsapp', order: 0, isActive: true },
  { name: 'تأشيرات - فنادق', phone: '055 715 5472', whatsapp: '966557155472', icon: '🛂', type: 'whatsapp', order: 1, isActive: true },
  { name: 'مختص تأشيرات', phone: '055 279 1800', whatsapp: '966552791800', icon: '📋', type: 'whatsapp', order: 2, isActive: true },
  { name: 'تأشيرات', phone: '055 922 9597', whatsapp: '966559229597', icon: '✈️', type: 'whatsapp', order: 3, isActive: true },
  { name: 'حجوزات فنادق - باكجات', phone: '055 834 6483', whatsapp: '966558346483', icon: '🏨', type: 'whatsapp', order: 4, isActive: true },
  { name: 'البريد الإلكتروني', phone: 'info@trcolors.com', icon: '✉️', type: 'email', order: 5, isActive: true },
  { name: 'موقعنا', phone: 'الرياض - الصحافة', icon: '📍', type: 'location', order: 6, isActive: true }
];

const DEFAULT_WORKING_HOURS = {
  weekdays: 'من السبت إلى الخميس',
  weekdaysTime: '03:00 م - 11:00 م',
  friday: 'الجمعة: إجازة',
  fridayIsOff: true
};

const DEFAULT_MAP_EMBED = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3550.813903803563!2d46.646181899999995!3d24.810952199999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e2f01b654ba264b%3A0x30a7fd8506bf489a!2z2KfZhNmI2KfZhiDYp9mE2YXYs9in2YHYsSDZhNmE2LPZgdixINmIINin2YTYs9mK2KfYrdip!5e1!3m2!1sar!2sus!4v1772396758449!5m2!1sar!2sus';

// إنشاء المحتوى الافتراضي إذا لم يكن موجوداً
websiteContentSchema.statics.getContent = async function() {
  let content = await this.findOne({ key: 'main' });

  if (!content) {
    content = await this.create({
      key: 'main',
      services: [
        { title: 'تأشيرات سفر', description: 'استخراج تأشيرات الشنقن وجميع الدول بسرعة واحترافية', icon: '📋' },
        { title: 'حجوزات طيران', description: 'أفضل أسعار تذاكر الطيران على جميع الخطوط', icon: '✈️' },
        { title: 'حجوزات فنادق', description: 'حجز فنادق حول العالم بأسعار تنافسية', icon: '🏨' },
        { title: 'برامج سياحية', description: 'رحلات مخصصة وبرامج شهر عسل مميزة', icon: '🌍' },
        { title: 'تأمين سفر', description: 'تأمين شامل لرحلتك وراحة بالك', icon: '🛡️' },
        { title: 'رخص دولية', description: 'استخراج رخص القيادة الدولية', icon: '🪪' }
      ],
      aboutUs: {
        title: 'من نحن',
        description: 'شركة ألوان المسافر متخصصون في استخراج تأشيرة الشنقن في وقت قصير. حجز طيران - حجوزات فندقيه حول العالم - برامج شهر العسل للعرسان - رخص دولية / مرخص من هيئة السياحة رقم : 73104877',
        features: [
          { title: 'خبرة واسعة', description: 'سنوات من الخبرة في مجال السياحة والسفر', icon: '⭐' },
          { title: 'أسعار تنافسية', description: 'نقدم أفضل الأسعار مع جودة عالية في الخدمة', icon: '💰' },
          { title: 'دعم متواصل', description: 'فريق دعم متاح لمساعدتك في أي وقت', icon: '💬' },
          { title: 'مرخصة رسمياً', description: 'مرخصة من هيئة السياحة السعودية', icon: '✅' }
        ]
      },
      faq: [
        { question: 'كم يستغرق استخراج تأشيرة الشنقن؟', answer: 'عادة تستغرق من 5 إلى 15 يوم عمل حسب السفارة والموسم.' },
        { question: 'ما هي المستندات المطلوبة للتأشيرة؟', answer: 'جواز سفر ساري، صور شخصية، كشف حساب بنكي، تأمين سفر، وحجز فندق وطيران.' },
        { question: 'هل يمكن إلغاء الحجز واسترداد المبلغ؟', answer: 'نعم، حسب سياسة الإلغاء الخاصة بكل خدمة. رسوم التأشيرة غير قابلة للاسترداد بعد التقديم.' },
        { question: 'هل تقدمون خدمات لجميع مدن المملكة؟', answer: 'نعم، نخدم عملاءنا في جميع مدن المملكة مع توفير مواعيد في الرياض وجدة والدمام.' }
      ],
      contactDepartments: DEFAULT_CONTACT_DEPARTMENTS,
      workingHours: DEFAULT_WORKING_HOURS,
      mapEmbed: DEFAULT_MAP_EMBED,
      internationalLicense: {
        price: '200',
        currency: 'ريال',
        description: 'استخراج رخصة القيادة الدولية بسرعة واحترافية',
        requirements: ['صورة رخصة القيادة السعودية', 'صورة الجواز', 'صورة شخصية'],
        addons: [
          { name: 'طباعة صورة شخصية', price: '20', enabled: true, description: 'طباعة صور بمقاس جواز السفر' }
        ],
        coupons: [],
        deliveryOptions: {
          pickup: { enabled: true, price: '0', message: 'يرجى الاستلام من المكتب على العنوان التالي', address: 'الرياض - حي العليا - شارع الأمير محمد بن عبدالعزيز' },
          delivery: { enabled: true, price: '30', message: 'التوصيل يشمل مدينة الرياض فقط' },
          shipping: { enabled: true, price: '50', message: 'مدة الشحن تعتمد على شركة الشحن ومنطقتك' }
        }
      }
    });
  } else {
    // تحديث الوثيقة الموجودة بالحقول المفقودة (أُضيفت لاحقاً)
    const updates = {};
    if (!content.contactDepartments || content.contactDepartments.length === 0) {
      updates.contactDepartments = DEFAULT_CONTACT_DEPARTMENTS;
    }
    if (!content.workingHours || !content.workingHours.weekdays) {
      updates.workingHours = DEFAULT_WORKING_HOURS;
    }
    if (!content.mapEmbed) {
      updates.mapEmbed = DEFAULT_MAP_EMBED;
    }
    if (Object.keys(updates).length > 0) {
      content = await this.findOneAndUpdate(
        { key: 'main' },
        { $set: updates },
        { new: true }
      );
    }
  }

  return content;
};

module.exports = mongoose.model('WebsiteContent', websiteContentSchema);
