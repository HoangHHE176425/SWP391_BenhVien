const express = require('express');
const multer = require('multer');
const path = require('path');
const BlogRouter = express.Router();

const {
  getAllBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  uploadImage: uploadBlogImage,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getBlogBySlug,
  getTopViewedBlogs,
  incrementBlogViews
} = require("../../controller/admin/blogController");

const {
  authReceptionistMiddleware
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

// Blog Routes
BlogRouter.get("/blogs", getAllBlogs);
BlogRouter.get("/blogs/slug/:slug", getBlogBySlug);
BlogRouter.get("/blogs/top-viewed", getTopViewedBlogs);
BlogRouter.post("/blogs/slug/:slug/views", incrementBlogViews);

BlogRouter.post("/blogs", authReceptionistMiddleware, createBlog);
BlogRouter.put("/blogs/:id", authReceptionistMiddleware, updateBlog);
BlogRouter.delete("/blogs/:id", authReceptionistMiddleware, deleteBlog);

BlogRouter.post(
  "/blogs/upload",
  authReceptionistMiddleware,
  uploadMulter.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "contentImages", maxCount: 10 },
  ]),
  uploadBlogImage
);

// Category Routes
BlogRouter.get("/categories", getAllCategories);
BlogRouter.post("/categories", authReceptionistMiddleware, createCategory);
BlogRouter.put("/categories/:id", authReceptionistMiddleware, updateCategory);
BlogRouter.delete("/categories/:id", authReceptionistMiddleware, deleteCategory);

module.exports = BlogRouter;