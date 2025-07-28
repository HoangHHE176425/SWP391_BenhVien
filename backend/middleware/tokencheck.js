const jwt = require("jsonwebtoken");

exports.verifyToken1 = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
  if (!token) return res.status(401).json({ message: "Không có token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // chứa thông tin id, email, role...
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token không hợp lệ" });
  }
};
