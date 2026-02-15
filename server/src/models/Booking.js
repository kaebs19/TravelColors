const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  age: Number,
  gender: {
    type: String,
    enum: ['male', 'female']
  },
  passportNumber: String,
  nationalId: String,
  nationality: String,
  isChild: {
    type: Boolean,
    default: false
  }
});

const bookingSchema = new mongoose.Schema({
  bookingNumber: {
    type: String,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  passengers: [passengerSchema],
  numberOfPassengers: {
    type: Number,
    required: true,
    min: 1
  },
  pricePerPerson: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  finalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'online'],
    default: 'cash'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  specialRequests: String,
  notes: String,
  cancelReason: String,
  cancelledAt: Date,
  confirmedAt: Date,
  completedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// إنشاء رقم حجز تلقائي
bookingSchema.pre('save', async function(next) {
  if (!this.bookingNumber) {
    const count = await this.constructor.countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    this.bookingNumber = `TC${year}${month}${(count + 1).toString().padStart(5, '0')}`;
  }
  next();
});

// حساب السعر النهائي
bookingSchema.pre('save', function(next) {
  this.finalPrice = this.totalPrice - this.discount;
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
