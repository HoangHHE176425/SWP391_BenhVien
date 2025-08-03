const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },

  identityNumber: { type: String, required: true, unique: true },

  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  phone: { type: String, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient"} // 1-1 với Patient, optional (tạo sau khi khám)

}, { timestamps: true });


module.exports = mongoose.model("Profile", profileSchema);