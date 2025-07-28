const mongoose = require("mongoose");

const attendanceConfigSchema = new mongoose.Schema(
  {
    deadlineTime: {
      type: String, // ví dụ "09:00"
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AttendanceConfig", attendanceConfigSchema);
