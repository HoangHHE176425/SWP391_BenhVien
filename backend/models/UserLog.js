// models/UserLog.js
const mongoose = require("mongoose");

const userLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  actionBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  actionType: { type: String, enum: ["create", "update", "changeStatus", "delete"], required: true },
  changes: { type: Object }, // chứa { field: { from, to } }
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("UserLog", userLogSchema);
