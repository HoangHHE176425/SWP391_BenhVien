const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    diagnose: { type: String, required: true },
    treatment: { type: String, required: true },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' } // Bác sĩ tạo bản ghi
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);