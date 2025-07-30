const mongoose = require("mongoose");

const departmentLogSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    action: {
      type: String,
      enum: ["create", "update", "status_change"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee", // hoặc "Employee" nếu bạn dùng nhân viên làm người thực hiện
      required: false,
    },
  },
  {
    collection: "departmentlogs",
    timestamps: true,
  }
);

module.exports = mongoose.model("DepartmentLog", departmentLogSchema);
