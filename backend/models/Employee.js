const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeCode: {
    type: String,
    unique: true,
    index: true,
  },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  avatar: { type: String },
  role: {
    type: String,
    enum: ['Pharmacist', 'Doctor', 'Accountant', 'Admin', 'Receptionist', 'HRManager'],
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

// Tạo index phụ
employeeSchema.index({ role: 1, status: 1 });

// ✅ Tự động sinh mã nhân viên dạng EMP001, EMP002...
employeeSchema.pre('save', async function (next) {
  if (this.isNew && !this.employeeCode) {
    const Employee = mongoose.model('Employee', employeeSchema);
    const count = await Employee.countDocuments({});
    const nextCode = 'EMP' + String(count + 1).padStart(3, '0');
    this.employeeCode = nextCode;
  }
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);
