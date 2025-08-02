const mongoose = require('mongoose');

const pharmacyTransactionSchema = new mongoose.Schema({
  prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
  pharmacist: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, // Dược sĩ CÁI NÀY CỦA M, ADD NÓ R LẬP 1 CÁI CRD

  patient: { type: String, required: true },

  items: [
    {
      medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
      quantity: Number,
      price: Number
    }
  ],

  totalAmount: Number,
  paid: { type: Boolean, default: false },
  paymentMethod: { type: String, enum: ['tien mat', 'online'] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PharmacyTransaction', pharmacyTransactionSchema);