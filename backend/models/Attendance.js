const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true,
  },
  checkInTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  checkOutTime: {
    type: Date,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['Regular', 'Overtime'], // ✅ phân biệt ca chính / tăng ca
    default: 'Regular',
  },
  slot: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Evening', 'Overtime'], // ✅ chia ca nếu cần
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'On-Leave'],
    default: 'Present',
  },
  notes: {
    type: String,
  },
}, { timestamps: true });


// ✅ Tự động set "date" từ "checkInTime"
attendanceSchema.pre('save', function (next) {
  if (this.isModified('checkInTime') || !this.date) {
    const dateOnly = new Date(this.checkInTime);
    dateOnly.setHours(0, 0, 0, 0); // reset giờ về 00:00:00
    this.date = dateOnly;
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
