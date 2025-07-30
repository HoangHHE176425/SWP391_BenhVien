const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentLogs
} = require("../../controller/staff/departmentManagement");

const { authStaffMiddleware } = require("../../middleware/auth.middleware");

// Multer cấu hình để upload file tạm, sau đó controller xử lý đẩy lên Cloudinary
const uploadMulter = multer({
  dest: "temp/",
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Chỉ chấp nhận ảnh JPEG/PNG"));
  },
});

router.get("/", getAllDepartments);         
router.get("/:id", getDepartmentById);           
router.post("/", authStaffMiddleware, uploadMulter.single("image"), createDepartment); 
router.put("/:id", authStaffMiddleware, uploadMulter.single("image"), updateDepartment); 
router.delete("/:id", authStaffMiddleware, deleteDepartment);
router.get("/:id/logs", authStaffMiddleware, getDepartmentLogs);

module.exports = router;
