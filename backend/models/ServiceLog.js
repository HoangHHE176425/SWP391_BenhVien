const mongoose = require("mongoose");

const serviceLogSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Services",
      required: true,
    },
    action: {
      type: String,
      enum: ["create", "update", "status_change", "delete"],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee", // Người thực hiện (nhân viên)
    },
  },
  { timestamps: true, collection: "servicelogs" }
);

module.exports = mongoose.model("ServiceLog", serviceLogSchema);
