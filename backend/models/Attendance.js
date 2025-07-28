// models/Attendance.js
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  checkInTime: { type: Date, required: true },
  checkOutTime: { type: Date },
  date: { type: Date, required: true, index: true },
  status: { type: String, enum: ['Present', 'Absent', 'On-Leave'], default: 'Present' },
  notes: { type: String }
}, { timestamps: true });

attendanceSchema.index({ employeeId: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
