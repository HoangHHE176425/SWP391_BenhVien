const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const {
  getEmployees,
  editEmployees,
  delEmployees,
  createEmployees,
  getAllDepartments,
  getEmployeeLog,
} = require("../../controller/admin/adminEmployeeManager");

const { authAdminMiddleware } = require("../../middleware/auth.middleware");

// ✅ Multer config – lưu ảnh tạm ở thư mục temp/
const uploadMulter = multer({
  dest: "temp/",
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error("Chỉ chấp nhận ảnh JPEG/PNG"));
  },
});

// ---------------------- EMPLOYEE MANAGEMENT ----------------------

router.get("/employees", authAdminMiddleware, getEmployees);
router.post("/createEmp", authAdminMiddleware, uploadMulter.single("avatar"), createEmployees);
router.put("/updEmp/:id", authAdminMiddleware, uploadMulter.single("avatar"), editEmployees);
router.delete("/delEmp/:id", authAdminMiddleware, delEmployees);
router.get("/getDepart", authAdminMiddleware, getAllDepartments);
router.get("/employee-log/:id", authAdminMiddleware, getEmployeeLog);

module.exports = router;
