const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true}, // 1-1 với Profile
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" } // Bác sĩ/lễ tân tạo
}, { timestamps: true });

// Index cho profileId
patientSchema.index({ profileId: 1 });

module.exports = mongoose.model("Patient", patientSchema);