const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  avatar: { type: String },
  role: {
    type: String,
    enum: ['Pharmacist', 'Doctor', 'Nurse', 'Accountant', 'Admin'],
    required: true,
  },
  degree: { type: String },
  expYear: { type: String },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  specialization: { type: String },
  phone: { type: String },
  createdAt: { type: Date },
  updatedAt: { type: Date },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  schedule: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' }],
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Services' }],
  emailVerificationCode: { type: String },
  verificationExpires: { type: Date },
}, { timestamps: true });

employeeSchema.index({ role: 1, status: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
