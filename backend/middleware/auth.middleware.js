const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
const Employee = require('../models/Employee');
dotenv.config();

// Danh sách đen để lưu token đã logout (thay bằng Redis trong production)
const tokenBlacklist = [];

// Hàm kiểm tra token trong blacklist
const isTokenBlacklisted = (token) => {
  return tokenBlacklist.includes(token);
};

const authMiddleware = (req, res, next) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Không tìm thấy token hoặc token không hợp lệ",
      status: "ERROR",
    });
  }
  
  const token = authHeader.split(' ')[1];

  // Check if token is blacklisted
  if (isTokenBlacklisted(token)) {
    return res.status(401).json({
      message: "Token đã bị thu hồi. Vui lòng đăng nhập lại.",
      status: "ERROR",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach userId and role to req
    next();
  } catch (err) {
    console.error('Xác minh token thất bại:', err);
    return res.status(401).json({
      message: "Token không hợp lệ hoặc đã hết hạn",
      status: "ERROR",
    });
  }
};

// Export tokenBlacklist and isTokenBlacklisted for use in logout
exports.tokenBlacklist = tokenBlacklist;
exports.isTokenBlacklisted = isTokenBlacklisted;

const authAdminMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Không tìm thấy token hoặc token không hợp lệ",
      status: "ERROR",
    });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).json({
        message: "Token không hợp lệ hoặc đã hết hạn",
        status: "ERROR",
      });
    }
   
    if (decoded.role === "Admin") {
      req.user = decoded;
      next();
    } else {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập (chỉ dành cho ADMIN)",
        status: "ERROR",
      });
    }
  });
};

const authDoctorMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Không tìm thấy token hoặc token không hợp lệ",
      status: "ERROR",
    });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).json({
        message: "Token không hợp lệ hoặc đã hết hạn",
        status: "ERROR",
      });
    }
    if (decoded.role === "Doctor") {
      req.user = decoded;
      next();
    } else {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập (chỉ dành cho Doctor)",
        status: "ERROR",
      });
    }
  });
};

const authUserMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Không tìm thấy token hoặc token không hợp lệ",
      status: "ERROR",
    });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).json({
        message: "Token không hợp lệ hoặc đã hết hạn",
        status: "ERROR",
      });
    }
    if (decoded.role === "patient") {
      req.user = decoded;
      next();
    } else {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập (chỉ dành cho PATIENT)",
        status: "ERROR",
      });
    }
  });
};

const authStaffMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const staff = await Employee.findById(decoded.id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    req.user = { userId: staff._id }; // 👈 Quan trọng để thống nhất sử dụng req.user.userId
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const ismeomeo = (req, res, next) => {
  if (req.cc.name !== "chi") {
    res.status(400).json({ message: "fel name" });
  }
  next();
};

module.exports = { authMiddleware, authAdminMiddleware, authDoctorMiddleware, authUserMiddleware, authStaffMiddleware, tokenBlacklist, isTokenBlacklisted };
