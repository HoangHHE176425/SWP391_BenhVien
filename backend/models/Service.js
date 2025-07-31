const mongoose = require("mongoose");

const servicesSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },

    serviceCode: {
      type: String,
      unique: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    // doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
  },
  { timestamps: true }
);

// ✅ Tự động sinh mã code: SER001, SER002,...
servicesSchema.pre("save", async function (next) {
  if (this.isNew && !this.serviceCode) {
    const Services = mongoose.model("Services", servicesSchema);
    const count = await Services.countDocuments({});
    const nextCode = "SER" + String(count + 1).padStart(3, "0");
    this.serviceCode = nextCode;
  }
  next();
});

module.exports = mongoose.model("Services", servicesSchema);
