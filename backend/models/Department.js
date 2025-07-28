const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    image: {
      type: String,
      trim: true,
    },
  },
  {
    collection: "departments",
    timestamps: true,
  }
);

module.exports = mongoose.model("Department", departmentSchema);
