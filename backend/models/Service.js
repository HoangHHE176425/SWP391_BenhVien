const mongoose = require("mongoose");
const servicesSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    // doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }], // References multiple doctors
    image: { type: String },
  },
  { timestamps: true }
);

servicesSchema.index({ name: 1 });

module.exports = mongoose.model("Services", servicesSchema);
