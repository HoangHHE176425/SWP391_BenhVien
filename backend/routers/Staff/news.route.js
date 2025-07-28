const express = require('express');
const multer = require('multer');
const path = require('path');
const NewsRouter = express.Router();

const {
  getAllNews,
  getNewsBySlug,
  createNews,
  updateNews,
  deleteNews,
  incrementNewsViews,
  getNewsByPriority,
  uploadImage: uploadNewsImage
} = require("../../controller/staff/NewsController");

const {
  authStaffMiddleware
} = require("../../middleware/auth.middleware");

// Cấu hình Multer để upload ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Thư mục cần tồn tại
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const uploadMulter = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only JPEG/PNG images are allowed"));
  },
});

// News Routes
NewsRouter.get("/news", getAllNews);
NewsRouter.get("/news/slug/:slug", getNewsBySlug);
NewsRouter.get("/news/priority", getNewsByPriority);
NewsRouter.post("/news/slug/:slug/views", incrementNewsViews);

NewsRouter.post("/news", authStaffMiddleware, createNews);
NewsRouter.put("/news/:id", authStaffMiddleware, updateNews);
NewsRouter.delete("/news/:id", authStaffMiddleware, deleteNews);

NewsRouter.post(
  "/news/upload",
  authStaffMiddleware,
  uploadMulter.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  uploadNewsImage
);

module.exports = NewsRouter;