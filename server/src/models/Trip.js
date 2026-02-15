const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'عنوان الرحلة مطلوب'],
    trim: true,
    maxlength: [100, 'العنوان يجب أن لا يتجاوز 100 حرف']
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'وصف الرحلة مطلوب']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'الوصف المختصر يجب أن لا يتجاوز 200 حرف']
  },
  destination: {
    type: String,
    required: [true, 'الوجهة مطلوبة']
  },
  origin: {
    type: String,
    required: [true, 'نقطة الانطلاق مطلوبة']
  },
  price: {
    type: Number,
    required: [true, 'السعر مطلوب'],
    min: [0, 'السعر يجب أن يكون موجب']
  },
  discountPrice: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'SAR',
    enum: ['SAR', 'USD', 'EUR', 'AED']
  },
  duration: {
    days: { type: Number, default: 1 },
    nights: { type: Number, default: 0 }
  },
  startDate: {
    type: Date,
    required: [true, 'تاريخ البداية مطلوب']
  },
  endDate: {
    type: Date,
    required: [true, 'تاريخ النهاية مطلوب']
  },
  totalSeats: {
    type: Number,
    required: [true, 'عدد المقاعد مطلوب']
  },
  availableSeats: {
    type: Number,
    required: true
  },
  images: [{
    url: String,
    public_id: String,
    isMain: { type: Boolean, default: false }
  }],
  included: [{
    type: String
  }],
  notIncluded: [{
    type: String
  }],
  itinerary: [{
    day: Number,
    title: String,
    description: String,
    meals: [String]
  }],
  category: {
    type: String,
    enum: ['domestic', 'international', 'hajj', 'umrah', 'honeymoon', 'family', 'adventure', 'business'],
    default: 'domestic'
  },
  tags: [{
    type: String
  }],
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// إنشاء slug تلقائي
tripSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\u0621-\u064A\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  next();
});

// Virtual للسعر النهائي
tripSchema.virtual('finalPrice').get(function() {
  return this.discountPrice > 0 ? this.discountPrice : this.price;
});

// Index للبحث
tripSchema.index({ title: 'text', description: 'text', destination: 'text' });

module.exports = mongoose.model('Trip', tripSchema);
