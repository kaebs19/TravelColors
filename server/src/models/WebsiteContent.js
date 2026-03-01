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
  }
}, {
  timestamps: true
});

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
      ]
    });
  }

  return content;
};

module.exports = mongoose.model('WebsiteContent', websiteContentSchema);
