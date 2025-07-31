const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true,
  },
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: true,
    index: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
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
  timeSlots: [
    {
      startTime: Date,
      endTime: Date,
      status: {
        type: String,
        enum: ['Available', 'Booked', 'Unavailable'],
        default: 'Available',
      },
    },
  ],
  type: {
    type: String,
    enum: ['Regular', 'Overtime'],
    default: 'Regular',
  },
  slot: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Evening', 'Overtime'],
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'On-Leave'],
    default: 'Present',
  },
  notes: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
  location: {
    type: {
      latitude: Number,
      longitude: Number,
      address: String, // địa chỉ cụ thể nếu frontend cung cấp
    },
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
