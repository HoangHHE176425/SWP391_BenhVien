const Department = require("../../models/Department");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const fs = require("fs").promises;
const path = require("path");
const slugify = require("slugify");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Manual validation for department data
const validateDepartment = (data) => {
  const errors = [];

  if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
    errors.push("Tên khoa là bắt buộc");
  } else if (data.name.length > 100) {
    errors.push("Tên khoa không được vượt quá 100 ký tự");
  }

  if (data.description && typeof data.description !== "string") {
    errors.push("Mô tả phải là chuỗi ký tự");
  } else if (data.description && data.description.length > 500) {
    errors.push("Mô tả không được vượt quá 500 ký tự");
  }

  if (data.status && !["active", "inactive"].includes(data.status)) {
    errors.push("Trạng thái phải là 'active' hoặc 'inactive'");
  }

  return errors.length > 0 ? errors.join(", ") : null;
};


// Validate query parameters
const validateQueryParams = (page, limit, search) => {
  const errors = [];

  const pageNum = parseInt(page, 10);
  if (isNaN(pageNum) || pageNum < 1) {
    errors.push("Trang phải là số lớn hơn 0");
  }

  const limitNum = parseInt(limit, 10);
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    errors.push("Giới hạn phải là số từ 1 đến 100");
  }

  if (search && typeof search !== "string") {
    errors.push("Tìm kiếm phải là chuỗi ký tự");
  }

  return errors.length > 0 ? errors.join(", ") : null;
};

// Lấy tất cả khoa có hỗ trợ tìm kiếm và phân trang
exports.getAllDepartments = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const validationError = validateQueryParams(page, limit, search);
    if (validationError) {
      return res.status(400).json({ message: `Dữ liệu không hợp lệ: ${validationError}` });
    }

    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ],
    };

    const total = await Department.countDocuments(query);

    const departments = await Department.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      departments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách phòng ban:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};


// Lấy khoa theo ID
exports.getDepartmentById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "ID khoa không hợp lệ" });
    }
    const department = await Department.findById(req.params.id).lean();
    if (!department) {
      return res.status(404).json({ message: "Không tìm thấy khoa" });
    }
    res.status(200).json(department);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Tạo khoa mới
exports.createDepartment = async (req, res) => {
  try {
    const validationError = validateDepartment(req.body);
    if (validationError) {
      return res.status(400).json({ message: `Dữ liệu không hợp lệ: ${validationError}` });
    }

    const { name, description } = req.body;

    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Tên khoa đã tồn tại" });
    }

    let imageUrl = "";

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "departments",
      });
      imageUrl = result.secure_url;
      await fs.unlink(req.file.path).catch(() => {});
    }

    const newDepartment = new Department({
      _id: new mongoose.Types.ObjectId(),
      name,
      description,
      image: imageUrl, // lưu cloudinary url
    });

    await newDepartment.save();
    res.status(201).json({ message: "Tạo khoa thành công", department: newDepartment });
  } catch (error) {
    console.error("Lỗi tạo khoa:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};



// Cập nhật khoa
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID khoa không hợp lệ" });
    }

    const { name, description, status } = req.body;

    // 2. Kiểm tra trùng tên (nếu có name gửi lên)
    if (name) {
      const existing = await Department.findOne({
        name,
        _id: { $ne: id },
      });
      if (existing) {
        return res.status(400).json({ message: "Tên khoa đã tồn tại" });
      }
    }

    // 3. Chuẩn bị dữ liệu cập nhật
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;

    // ✅ Xử lý status
    if (status && ['active', 'inactive'].includes(status)) {
      updateData.status = status;
    }

    // ✅ Xử lý ảnh nếu có file upload
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "departments",
      });
      updateData.image = result.secure_url;

      // Xoá file tạm
      await fs.unlink(req.file.path).catch(() => {});
    }

    // 4. Cập nhật trong DB
    const updated = await Department.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy khoa để cập nhật" });
    }

    return res.status(200).json({
      message: "Cập nhật khoa thành công",
      department: updated,
    });
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật khoa:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};




// Xóa khoa
exports.deleteDepartment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "ID khoa không hợp lệ" });
    }

    const deleted = await Department.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy khoa" });
    }

    res.status(200).json({ message: "Xóa khoa thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
