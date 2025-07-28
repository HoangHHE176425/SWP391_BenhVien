const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, enum: ['Credit Card', 'Mobile App', 'Cash'], required: true },
  status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
  paymentDate: { type: Date, required: true }
}, { timestamps: true });

// paymentSchema.index({ invoiceId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);