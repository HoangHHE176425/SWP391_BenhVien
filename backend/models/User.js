// models/User.js
const mongoose = require('mongoose');
const Counter = require('./Counter');
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  profiles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }],
  emailVerificationCode: { type: String, default: null },
  verificationExpires: { type: Date, default: null },
  user_code: { type: String, unique: true, index: true }, // Tự động sinh
}, { timestamps: true });

// Middleware để tạo user_code tự động và an toàn
userSchema.pre('save', async function (next) {
  if (this.isNew && !this.user_code) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'user' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true } // tạo mới nếu chưa có
      );

      const newCode = `KC_${String(counter.seq).padStart(3, '0')}`;
      this.user_code = newCode;

      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
