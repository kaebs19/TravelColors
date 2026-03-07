const mongoose = require('mongoose');

const licenseApplicationSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientProfile',
    required: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null,
    index: true
  },
  applicationNumber: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'completed', 'received'],
    default: 'draft'
  },
  personalInfo: {
    familyName: { type: String, default: '' },
    givenName: { type: String, default: '' },
    placeOfBirth: { type: String, default: '' },
    dateOfBirth: { type: Date },
    nationality: { type: String, default: 'Saudi Arabia' },
    address: { type: String, default: '' },
    email: { type: String, default: '' },
    nationalId: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  licenseImage: { type: String, default: '' },
  passportImage: { type: String, default: '' },
  personalPhoto: { type: String, default: '' },

  // الخدمات الإضافية المختارة
  selectedAddons: [{
    name: { type: String },
    price: { type: Number, default: 0 }
  }],

  // كوبون الخصم
  couponCode: { type: String, default: '' },
  couponDiscount: { type: Number, default: 0 },

  // التسعير
  basePrice: { type: Number, default: 0 },
  addonsTotal: { type: Number, default: 0 },
  deliveryPrice: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 },

  // طريقة التسليم
  deliveryMethod: {
    type: String,
    enum: ['pickup', 'delivery', 'shipping', ''],
    default: ''
  },

  // بيانات العنوان الوطني (للشحن)
  shippingAddress: {
    buildingNumber: { type: String, default: '' },
    streetName: { type: String, default: '' },
    district: { type: String, default: '' },
    city: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    additionalCode: { type: String, default: '' }
  },

  adminNotes: { type: String, default: '' }
}, { timestamps: true });

// Auto-generate application number before save
licenseApplicationSchema.pre('save', async function() {
  if (!this.applicationNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0,10).replace(/-/g,'');
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.applicationNumber = `DL-${dateStr}-${rand}`;
  }
});

module.exports = mongoose.model('LicenseApplication', licenseApplicationSchema);
