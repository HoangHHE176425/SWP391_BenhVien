const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true},
  type: { type: String, required: true },
  group: { type: String },                        // Nhóm thuốc
  ingredient: { type: String },                   // Hoạt chất
  indication: { type: String },                   // Chỉ định
  contraindication: { type: String },             // Chống chỉ định
  dosage: { type: String },                       // Liều dùng
  sideEffects: { type: String },                  // Tác dụng phụ
  precaution: { type: String },                   // Thận trọng
  interaction: { type: String },                  // Tương tác thuốc
  note: { type: String },                         // Chú ý
  storage: { type: String },                      // Bảo quản
  quantity: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
  expirationDate: { type: Date, required: true, index: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, // receptionist
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });


module.exports = mongoose.model('Medicine', medicineSchema);