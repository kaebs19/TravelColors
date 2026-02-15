const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  method: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'online'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: String,
  receiptNumber: String,
  notes: String,
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  refundedAt: Date,
  refundReason: String
}, {
  timestamps: true
});

// إنشاء رقم إيصال تلقائي
paymentSchema.pre('save', async function(next) {
  if (!this.receiptNumber && this.status === 'completed') {
    const count = await this.constructor.countDocuments();
    const date = new Date();
    this.receiptNumber = `RCP${date.getFullYear()}${(count + 1).toString().padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
