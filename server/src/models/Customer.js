const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم العميل مطلوب'],
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'رقم الهاتف مطلوب']
  },
  alternatePhone: String,
  nationalId: {
    type: String,
    unique: true,
    sparse: true
  },
  passportNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  nationality: {
    type: String,
    default: 'Saudi'
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female']
  },
  address: {
    city: String,
    area: String,
    street: String,
    building: String
  },
  notes: String,
  tags: [String],
  totalBookings: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  lastBookingDate: Date,
  isVIP: {
    type: Boolean,
    default: false
  },
  source: {
    type: String,
    enum: ['walk_in', 'phone', 'website', 'referral', 'social_media', 'other'],
    default: 'walk_in'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index للبحث
customerSchema.index({ name: 'text', phone: 'text', email: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
