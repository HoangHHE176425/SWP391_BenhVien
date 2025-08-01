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
    enum: [
      'Present',           // Check-in và check-out đúng giờ
      'Late-Arrival',      // Check-in sau giờ bắt đầu
      'Left-Early',        // Check-out trước giờ kết thúc
      'Left-Late',         // Check-out sau giờ kết thúc
      'Checked-In',        // Đang làm, check-in nhưng chưa check-out (và còn trong giờ)
      'Absent',            // Không có check-in
      'On-Leave',          // Nghỉ phép (có duyệt)
      'Invalid',           // Check-in sai hoặc không hợp lệ
    ],
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
      address: String,
    },
  },
}, { timestamps: true });


// ✅ Tự động set `date` từ `checkInTime` và tính `status`
attendanceSchema.pre('save', function (next) {
  if (this.isModified('checkInTime') || !this.date) {
    const dateOnly = new Date(this.checkInTime);
    dateOnly.setHours(0, 0, 0, 0);
    this.date = dateOnly;
  }

  if (!this.timeSlots || this.timeSlots.length === 0) {
    this.status = 'Invalid';
    return next();
  }

  const checkIn = this.checkInTime?.getTime();
  const checkOut = this.checkOutTime?.getTime();

  const startTimes = this.timeSlots.map(slot => new Date(slot.startTime).getTime());
  const endTimes = this.timeSlots.map(slot => new Date(slot.endTime).getTime());
  const earliestStart = Math.min(...startTimes);
  const latestEnd = Math.max(...endTimes);
  const now = Date.now();

  const gracePeriod = 1 * 60 * 1000; // ✅ Cho phép trễ tối đa 1 phút

  // ✅ Logic xét trạng thái với grace period
  if (checkIn && checkOut) {
    const late = checkIn > (earliestStart + gracePeriod);
    const early = checkOut < (latestEnd - gracePeriod);
    const over = checkOut > (latestEnd + gracePeriod);

    if (late && early) {
      this.status = 'Late-Arrival'; // có thể tạo thêm 'Late-And-Early' nếu muốn
    } else if (late) {
      this.status = 'Late-Arrival';
    } else if (early) {
      this.status = 'Left-Early';
    } else if (over) {
      this.status = 'Left-Late';
    } else {
      this.status = 'Present';
    }
  } else if (checkIn && !checkOut) {
    if (now > (latestEnd + gracePeriod)) {
      this.status = 'Absent'; 
    } else {
      this.status = 'Checked-In';
    }
  }

  next();
});


module.exports = mongoose.model('Attendance', attendanceSchema);
