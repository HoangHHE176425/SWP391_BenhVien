const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  createdBy: { // ✅ thêm dấu phẩy ở đây 👇
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  timeSlots: [{
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Available', 'Booked', 'Unavailable'],
      default: 'Available'
    }
  }]
}, { timestamps: true });

scheduleSchema.index({ employeeId: 1, date: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
