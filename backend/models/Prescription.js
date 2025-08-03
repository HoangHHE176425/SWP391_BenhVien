const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    medicalRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord' },  // Từ khám bệnh
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },

    medicines: [
        {
            medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
            quantity: { type: Number, required: true },
            usageInstructions: { type: String }   // Cách dùng
        }
    ],

    status: { type: String, enum: ['confirmed', 'sold'], default: 'confirmed' }, // khi doctor tạo đơn thành công (biết là đã đủ số lượng rồi -> )
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prescription', prescriptionSchema);