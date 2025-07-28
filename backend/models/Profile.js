const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },

    // BỎ unique để cho phép trùng CCCD
    identityNumber: { type: String, required: true },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    diagnose: { type: String },
    note: { type: String },
    issues: { type: String },
    medicine: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Medicine",
        }
    ],
    doctorId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Employee" 
    },
    service: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Services",
        }
    ],
    labTestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabTest"
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },

  },
  { timestamps: true }
);


module.exports = mongoose.model("Profile", profileSchema);