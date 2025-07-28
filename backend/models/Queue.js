const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  department: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  type: { type: String, enum: ['Online', 'Offline'], required: true },
  queueEntries: [{
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    position: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['Waiting', 'In-Progress', 'Completed'], default: 'Waiting' },
    paymentStatus: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
    arrivalTime: { type: Date }
  }]
}, { timestamps: true });

queueSchema.index({ department: 1, date: 1, type: 1 });

module.exports = mongoose.model('Queue', queueSchema);