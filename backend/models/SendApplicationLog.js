const mongoose = require('mongoose');

const sendApplicationLogSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SendApplication',
    required: true,
  },
  action: {
    type: String,
    enum: ['create', 'update', 'status-change', 'delete', 'reply', 'seen'],
    required: true,
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true, // Ai là người thực hiện hành động
  },
  previousData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  newData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  note: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('SendApplicationLog', sendApplicationLogSchema);
