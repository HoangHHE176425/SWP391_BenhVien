const mongoose = require('mongoose');

const scheduleLogSchema = new mongoose.Schema({
  schedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: true,
    index: true
  },
  actionType: {
    type: String,
    enum: ['create', 'update', 'delete', 'status_change'],
    required: true
  },
  actionBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee', // hoặc 'User' nếu người thao tác là user hệ thống
    required: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed, // ví dụ: { field: { from: "old", to: "new" } }
    default: {}
  },
  description: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('ScheduleLog', scheduleLogSchema);
