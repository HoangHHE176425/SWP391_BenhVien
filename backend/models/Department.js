const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    departmentCode: {
      type: String,
      unique: true,
      index: true,
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
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    }
  },
  {
    collection: "departments",
    timestamps: true,
  }
);

// ✅ Tự động sinh mã department dạng DEP001, DEP002...
departmentSchema.pre("save", async function (next) {
  if (this.isNew && !this.departmentCode) {
    const Department = mongoose.model("Department", departmentSchema);
    const count = await Department.countDocuments({});
    const nextCode = "DEP" + String(count + 1).padStart(3, "0");
    this.departmentCode = nextCode;
  }
  next();
});

module.exports = mongoose.model("Department", departmentSchema);
