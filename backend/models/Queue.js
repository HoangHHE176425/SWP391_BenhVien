const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true, index: true }, // Đổi thành ref
  date: { type: Date, required: true, index: true },
  type: { type: String, enum: ['Online', 'Offline'], required: true },
  queueEntries: [{
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true }, // Thêm để biết bác sĩ
    position: { type: Number, min: 1 }, // Tính tự động
    status: { 
      type: String, 
      enum: ['queued', 'checked_in', 'waiting_for_doctor', 'in_progress', 'completed'], 
      default: 'queued' 
    },
    paymentStatus: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' }, // Giữ optional
    arrivalTime: { type: Date }, // checkInTime cho offline/online đến
    checkInTime: { type: Date } // Thời gian check-in thực tế
  }]
}, { timestamps: true });

queueSchema.index({ department: 1, date: 1, type: 1 });
queueSchema.index({ 'queueEntries.room': 1 });

module.exports = mongoose.model('Queue', queueSchema);