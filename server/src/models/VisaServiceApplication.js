const mongoose = require('mongoose');

const visaServiceApplicationSchema = new mongoose.Schema({
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
  visaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visa',
    required: true
  },
  applicationNumber: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'completed'],
    default: 'draft'
  },

  personalInfo: {
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    nationalId: { type: String, default: '' },
    nationality: { type: String, default: '' },
    dateOfBirth: { type: Date }
  },

  passportImage: { type: String, default: '' },
  personalPhoto: { type: String, default: '' },

  // المستندات المرفوعة (ديناميكي)
  documents: [{
    key: { type: String, required: true },
    label: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    fileType: { type: String, default: '' },
    originalName: { type: String, default: '' },
    uploadedAt: { type: Date }
  }],

  // ملاحظات العميل
  clientNotes: { type: String, default: '' },

  // الإضافات المختارة
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
  totalPrice: { type: Number, default: 0 },

  adminNotes: { type: String, default: '' },
  submittedAt: { type: Date }
}, { timestamps: true });

// Indexes for performance
visaServiceApplicationSchema.index({ status: 1 });
visaServiceApplicationSchema.index({ createdAt: -1 });
visaServiceApplicationSchema.index({ visaId: 1 });
visaServiceApplicationSchema.index({ 'personalInfo.fullName': 'text', applicationNumber: 'text' });

// توليد رقم الطلب تلقائياً
visaServiceApplicationSchema.pre('save', async function() {
  if (!this.applicationNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.applicationNumber = `VS-${dateStr}-${rand}`;
  }
});

module.exports = mongoose.model('VisaServiceApplication', visaServiceApplicationSchema);
