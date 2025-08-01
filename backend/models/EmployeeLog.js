const mongoose = require("mongoose");

const employeeLogSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    actionType: {
      type: String,
      enum: ["create", "update", "changeStatus", "delete"],
      required: true,
    },
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee", // hoặc "User" nếu người thực hiện là User
    },
    changes: {
      type: Object, // Lưu các thay đổi (trước → sau)
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmployeeLog", employeeLogSchema);
