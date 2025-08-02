const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, index: true }, // Người dùng nếu online
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true }, // Patient
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  appointmentDate: { type: Date, required: true, index: true },
  type: { type: String, enum: ['Online', 'Offline'], required: true },
  status: {
    type: String,
    enum: ['pending_confirmation', 'confirmed', 'rejected', 'waiting_for_doctor', 'checked_in', 'in_progress', 'completed', 'canceled', 'pending_cancel'],
    default: 'pending_confirmation' // Default cho online
  },
  reminderSent: { type: Boolean, default: false },
  timeSlot: {
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: ['Available', 'Booked'], default: 'Booked' }
  },
  symptoms: { type: String, required: true }, // Triệu chứng ban đầu
  bhytCode: {
    type: String,
    unique: true, // Giữ unique
    sparse: true, // Thêm sparse để cho phép multiple null
    default: null, // Default null nếu không có
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Null cho offline
  room: { type: String } // Phòng khám, gán khi confirm
}, { timestamps: true });

// Index thêm
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ type: 1, status: 1 });
appointmentSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
