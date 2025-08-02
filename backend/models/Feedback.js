const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Optional cho guest
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: false }, // Optional cho feedback chung
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: false },
  guestName: { type: String, required: false }, // Tên guest nếu không login
  content: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Feedback', feedbackSchema);