const mongoose = require("mongoose");

const recordsSchema = new mongoose.Schema({
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  // Thông tin bệnh án
  fullName: { type: String },
  gender: { type: String },
  dateOfBirth: { type: Date },
  address: { type: String },
  bhytCode: { type: Boolean },
  identityNumber: { type: String },
  admissionDate: { type: Date }, // Ngày nhập viện
  dischargeDate: { type: Date }, // Ngày xuất viện
  admissionReason: { type: String },
  admissionDiagnosis: { type: String },
  admissionLabTest: { type: String },
  dischargeDiagnosis: { type: String },
  treatmentSummary: { type: String },
  ethnicity: { type: String },
  status: { type: String, enum: ['pending_clinical', 'pending_re-examination', 'done'], default: 'pending_clinical' },
  isPaid: { type: Boolean, default: false },
  paidAt: { type: Date },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'pending', 'paid', 'failed'],
    default: 'unpaid'
  },
  prescription: [{
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
    quantity: { type: Number, required: true, min: 1 },
    note: { type: String, default: '' }
  }],
  prescriptionCode: { type: String, required: false, unique: true, sparse: true },
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Services' }],
  // Danh sách dịch vụ đã chỉ định
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  docterAct: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, // bác sĩ thực hiện
  createdAt: { type: Date, required: true, index: true },
  updatedAt: { type: Date, required: true, index: true },
});

recordsSchema.index({ appointmentId: 1 }); // SỬA: Thêm index để query nhanh theo appointment

module.exports = mongoose.model('Records', recordsSchema);