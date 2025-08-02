const mongoose = require('mongoose');

const sendApplicationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  templateType: {
    type: String,
    default: 'other', // Ví dụ: leave, overtime, complaint...
  },
  fields: {
    type: [String], // Dữ liệu từ các input mẫu đơn (nếu có)
    default: [],
  },
  content: {
    type: String,
    required: true,
  },
  details: {
    type: String, // Người dùng nhập thêm vào TextArea cuối
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'approved', 'rejected'],
    default: 'pending',
  },
  reply: {
    type: String,
    default: '',
  },
  seen: {
    type: Boolean,
    default: false,
  },
  decisionAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('SendApplication', sendApplicationSchema);
