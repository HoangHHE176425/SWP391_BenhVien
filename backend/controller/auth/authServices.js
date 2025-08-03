const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const Employee = require("../../models/Employee");
const bcrypt = require("bcrypt");
const Counter = require("../../models/Counter");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

require("dotenv").config();
const Login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    const employee = await Employee.findOne({ email });

    if (!user && !employee) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const target = user || employee;
    const isMatch = await bcrypt.compare(password, target.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    if (target.status === "inactive") {
      return res
        .status(403)
        .json({ message: "You are banned from the system" });
    }

    const payload = {
      id: target._id,
      email: target.email,
      name: target.name,
      role: target.role || "patient",
      status: target.status,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // 🔍 Kiểm tra thông tin còn thiếu
    let incompleteProfile = false;
    let missingFields = [];

    if (employee) {
      if (employee.role === "Doctor") {
        const requiredFields = [
          "department",
          "avatar",
          "degree",
          "expYear",
          "specialization",
          "phone",
        ];
        missingFields = requiredFields.filter((field) => !employee[field]);
      } else if (employee.role === "Receptionist") {
        const requiredFields = ["avatar", "phone"];
        missingFields = requiredFields.filter((field) => !employee[field]);
      }
    }

    if (missingFields.length > 0) {
      incompleteProfile = true;
    }

    return res.status(200).json({
      message: "OK",
      token,
      user: target,
      incompleteProfile,
      missingFields,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const Signup = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: "Missing request body" });
  }

  const { email, password, name, phone } = req.body;

  try {
    // 1) Kiểm tra email đã tồn tại chưa
    const emailExist = await User.findOne({ email });
    if (emailExist) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    // 2) Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3) Tạo user mới
    const newUser = new User({
      email,
      name,
      phone,
      password: hashedPassword,
      status: "active",
      role: "patient",
    });

    const savedUser = await newUser.save();

    // 4) Trả về thông tin
    return res.status(200).json({
      message: "Đăng ký thành công",
      user_code: savedUser.user_code,
      user: {
        _id: savedUser._id,
        email: savedUser.email,
        name: savedUser.name,
        phone: savedUser.phone,
        status: savedUser.status,
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};


const check = async (req, res) => {
  res.status(200).json({ message: "API hoat dong" });
};

const changePassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email và mật khẩu mới là bắt buộc" });
    }

    // Tìm trong bảng User
    let user = await User.findOne({ email });

    if (user) {
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
      return res
        .status(200)
        .json({ message: "Đổi mật khẩu thành công (user)" });
    }

    // Nếu không tìm thấy trong User, thử Employee
    let employee = await Employee.findOne({ email });

    if (employee) {
      employee.password = await bcrypt.hash(newPassword, 10);
      await employee.save();
      return res
        .status(200)
        .json({ message: "Đổi mật khẩu thành công (employee)" });
    }

    return res
      .status(404)
      .json({ message: "Không tìm thấy người dùng hoặc nhân viên" });
  } catch (error) {
    console.error("Lỗi trong changePassword:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

module.exports = changePassword;

// Cấu hình Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Hàm tạo OTP (từ câu hỏi trước)
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const otp = generateVerificationCode();
    const expirationTime = new Date(Date.now() + 15 * 60 * 1000);

    // Tìm trong User trước
    let user = await User.findOne({ email });
    if (user) {
      user.emailVerificationCode = otp;
      user.verificationExpires = expirationTime;
      await user.save();
    } else {
      // Nếu không có trong User, tìm trong Employee
      let employee = await Employee.findOne({ email });
      if (!employee) {
        return res.status(404).json({ message: "Email not registered" });
      }
      employee.emailVerificationCode = otp;
      employee.verificationExpires = expirationTime;
      await employee.save();
    }

    const mailOptions = {
      from: `"VietCare" <hoanghhhe176425@fpt.edu.vn>"`,
      to: email,
      subject: "Mã xác minh đặt lại mật khẩu - VietCare",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e2e2; border-radius: 8px; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #2c3e50;">Xác minh đặt lại mật khẩu</h2>
          <p style="font-size: 16px; color: #333;">
            Xin chào, bạn đã yêu cầu đặt lại mật khẩu cho tài khoản tại <strong>VietCare</strong>.
          </p>
          <p style="font-size: 16px; color: #333;">
            Mã xác minh của bạn là:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 28px; font-weight: bold; color: #e74c3c;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #666;">
            Mã này có hiệu lực trong <strong>15 phút</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
          <p style="font-size: 13px; color: #999;">
            Trân trọng,<br />
            <strong>Phòng chăm sóc khách hàng VietCare</strong><br />
            Email: support@vietcare.com<br />
            Điện thoại: 0987 654 321
          </p>
        </div>
      `,
    };


    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, code, and new password are required" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Tìm trong User trước
    let user = await User.findOne({
      email,
      emailVerificationCode: code,
      verificationExpires: { $gt: Date.now() },
    });

    if (user) {
      user.password = await bcrypt.hash(newPassword, 10);
      user.emailVerificationCode = null;
      user.verificationExpires = null;
      await user.save();
      return res
        .status(200)
        .json({ message: "Password reset successfully (user)" });
    }

    // Nếu không có trong User, tìm trong Employee
    let employee = await Employee.findOne({
      email,
      emailVerificationCode: code,
      verificationExpires: { $gt: Date.now() },
    });

    if (!employee) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    employee.password = await bcrypt.hash(newPassword, 10);
    employee.emailVerificationCode = null;
    employee.verificationExpires = null;
    await employee.save();

    return res
      .status(200)
      .json({ message: "Password reset successfully (employee)" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Thiếu Google Credential" });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (user) {
      // Đã có tài khoản → đăng nhập luôn
      const token = jwt.sign(
        { id: user._id, email: user.email, name: user.name, role: user.role || "patient", status: user.status },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.status(200).json({
        message: "Đăng nhập thành công",
        token,
        user,
        incompleteProfile: false,
        missingFields: [],
      });
    } else {
      // Nếu chưa có → frontend sẽ chuyển sang bước hoàn thiện hồ sơ
      return res.status(200).json({
        message: "Google xác thực thành công, cần hoàn thiện hồ sơ",
        email,
        name,
        picture,
        needComplete: true,
      });
    }
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ message: "Lỗi đăng nhập Google", error: error.message });
  }
};


const googleCompleteRegister = async (req, res) => {
  try {
    const { email, name, password, phone } = req.body;

    if (!email || !name || !password || !phone) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      name,
      phone,
      password: hashedPassword,
      isGoogleAccount: true,
      status: "active",
      role: "patient",
    });

    await newUser.save();

    const token = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        status: newUser.status,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Tạo tài khoản và đăng nhập thành công",
      token,
      user: newUser,
    });
  } catch (err) {
    console.error("Google complete register error:", err);
    return res.status(500).json({ message: "Lỗi máy chủ", error: err.message });
  }
};


const checkPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    const existing = await User.findOne({ phone });

    return res.status(200).json({ exists: !!existing });
  } catch (error) {
    console.error("Check phone error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  Login,
  Signup,
  check,
  changePassword,
  forgotPassword,
  resetPassword,
  googleLogin,
  googleCompleteRegister,
  checkPhone,
};

