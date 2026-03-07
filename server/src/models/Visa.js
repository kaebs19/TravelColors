const mongoose = require('mongoose');

const visaSchema = new mongoose.Schema({
  countryName: {
    type: String,
    required: [true, 'اسم الدولة مطلوب'],
    trim: true
  },
  countryNameEn: {
    type: String,
    default: '',
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },

  visaType: {
    type: String,
    enum: ['عادية', 'إلكترونية'],
    required: [true, 'نوع التأشيرة مطلوب'],
    default: 'عادية'
  },

  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },

  // الصور
  flagImage: {
    type: String,
    default: ''
  },
  coverImage: {
    type: String,
    default: ''
  },

  // التسعير
  price: {
    type: String,
    default: '0'
  },
  currency: {
    type: String,
    default: 'ريال'
  },
  offerEnabled: {
    type: Boolean,
    default: false
  },
  offerPrice: {
    type: String,
    default: ''
  },

  // العرض
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  description: {
    type: String,
    default: ''
  },
  contactNumber: {
    type: String,
    default: ''
  },
  processingDays: {
    type: String,
    default: ''
  },

  // المتطلبات
  requirements: [{
    title: { type: String, required: true },
    details: { type: String, default: '' },
    isRequired: { type: Boolean, default: true },
    icon: { type: String, default: 'document' }
  }],

  // الكوبونات
  coupons: [{
    code: { type: String, required: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    discountValue: { type: String, default: '0' },
    enabled: { type: Boolean, default: true },
    maxUses: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date }
  }],

  // الإضافات (للنوع الإلكتروني)
  addons: [{
    name: { type: String, required: true },
    price: { type: String, default: '0' },
    enabled: { type: Boolean, default: true },
    description: { type: String, default: '' }
  }],

  // المستندات المطلوبة للتقديم الإلكتروني
  requiredDocuments: [{
    key: { type: String, required: true },
    label: { type: String, required: true },
    instructions: { type: String, default: '' },
    isRequired: { type: Boolean, default: true },
    acceptedTypes: { type: String, enum: ['image', 'pdf', 'both'], default: 'both' },
    sortOrder: { type: Number, default: 0 }
  }],

  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // SEO & أرشفة
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  keywords: [{ type: String }]
}, {
  timestamps: true
});

// توليد slug تلقائي من الاسم الإنجليزي
visaSchema.pre('save', function() {
  if (!this.slug && this.countryNameEn) {
    this.slug = this.countryNameEn.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
});

// توليد بيانات SEO تلقائياً
visaSchema.pre('save', function() {
  // metaTitle
  if (!this.metaTitle) {
    this.metaTitle = `${this.countryName} - ألوان المسافر`;
  }

  // metaDescription
  if (!this.metaDescription) {
    if (this.description && this.description.trim()) {
      this.metaDescription = this.description.length > 160
        ? this.description.substring(0, 160).trim()
        : this.description;
    } else {
      this.metaDescription = `تأشيرة ${this.countryName} - احصل على فيزا ${this.countryName} بسهولة مع ألوان المسافر`;
    }
  }

  // keywords
  if (!this.keywords || this.keywords.length === 0) {
    const autoKeywords = ['تأشيرة', 'فيزا', 'سفر'];
    if (this.countryName) autoKeywords.push(this.countryName);
    if (this.countryNameEn) autoKeywords.push(this.countryNameEn);
    if (this.visaType) autoKeywords.push(this.visaType);
    this.keywords = autoKeywords;
  }
});

module.exports = mongoose.model('Visa', visaSchema);
