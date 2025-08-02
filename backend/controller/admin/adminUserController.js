require("dotenv").config();
const bcrypt = require("bcrypt");
const User = require("../../models/User");
const Employee = require("../../models/Employee");
const Department = require("../../models/Department");
const UserLog = require("../../models/UserLog");
const EmployeeLog = require("../../models/EmployeeLog");
const cloudinary = require("cloudinary").v2;
const fs = require("fs").promises;

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// ---------------------- USER CONTROLLERS ----------------------
module.exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Người dùng không xác thực" });
    }

    // Kiểm tra trùng email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo mới user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      status: "active",
      createdBy: req.user.id, // dùng id từ token
    });

    await newUser.save();

    // Ghi log tạo user
    await UserLog.create({
      user: newUser._id,
      actionBy: req.user.id,
      actionType: "create",
      timestamp: new Date(), // optional: thêm thời gian tạo log
    });

    res.status(201).json(newUser);
  } catch (err) {
    console.error("🔥 Error creating user:", err);
    res.status(500).json({
      message: "Tạo người dùng thất bại",
      error: err.message,
    });
  }
};


module.exports.getUserAccs = async (req, res) => {
  try {
    const users = await User.find({}, "name email phone status createdAt user_code");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.editUsers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updates = { ...req.body };
    const changes = {};

    // Hash password nếu có
    if (updates.password) {
      const hashed = await bcrypt.hash(updates.password, 10);
      updates.password = hashed;
      changes["password"] = { from: "••••", to: "••••" };
    }

    // So sánh từng trường và ghi lại thay đổi
    const updatableFields = [
      "name",
      "email",
      "phone",
      "role",
      "status",
      "password",
    ]; // 🔐 lọc những trường cho phép cập nhật và log
    
    updatableFields.forEach((field) => {
      if (updates[field] !== undefined && field !== "password") {
        const current = user[field];
        const next = updates[field];

        if (String(current) !== String(next)) {
          changes[field] = { from: current, to: next };
          user[field] = next;
        }
      } else if (field === "password" && updates.password) {
        user.password = updates.password;
      }
    });

    user.updatedBy = req.user?.id || null;
    const updatedUser = await user.save();

    // ✅ Ghi log nếu có thay đổi
    if (Object.keys(changes).length > 0) {
      await UserLog.create({
        user: user._id,
        actionBy: req.user?.id || null,
        actionType: "update",
        changes,
      });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).json({ message: err.message });
  }
};


module.exports.changeStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const oldStatus = user.status;
    user.status = oldStatus === "active" ? "inactive" : "active";
    user.updatedBy = req.user?._id || null;

    await user.save();

    // 👇 define `changes` properly
    const changes = {
      status: { from: oldStatus, to: user.status }
    };

    await UserLog.create({
      user: user._id,
      actionBy: req.user?.id || null,
      actionType: "changeStatus",
      changes
    });

    res.status(200).json({ message: `User status updated to ${user.status}` });
  } catch (err) {
    console.error("🔥 ChangeStatus ERROR:", err);
    res.status(500).json({
      message: "Failed to update user status",
      error: err.message || err
    });
  }
};



module.exports.delUsers = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await UserLog.create({
      user: req.params.id,
      actionBy: req.user?.id || null,
      actionType: "delete",
    });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
module.exports.getUserLog = async (req, res) => {
  try {
    const logs = await UserLog.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .populate("actionBy", "name employeeCode");
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Không thể lấy log", error: err.message });
  }
};
