const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  recordIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Records' }],
  paymentId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
  invoiceNumber: { type: String, required: true, unique: true },
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Services' }],
  medicines: [{
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
    quantity: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Pending', 'Paid', 'Canceled'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
