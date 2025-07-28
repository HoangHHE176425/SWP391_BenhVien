const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, index: true },
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: false },
  paymentId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
  invoiceNumber: { type: String, required: true, unique: true }, // đủ để tạo index
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Services' }],
  totalAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Pending', 'Paid', 'Canceled'], default: 'Pending' }
}, { timestamps: true });

// invoiceSchema.index({ invoiceNumber: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
