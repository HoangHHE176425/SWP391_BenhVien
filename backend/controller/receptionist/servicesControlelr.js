const mongoose = require("mongoose");
const Service = require("../../models/Service");
const ServiceLog = require("../../models/ServiceLog");

// Hàm sinh mã code tự động SER001, SER002...
const generateNextServiceCode = async () => {
  let counter = 1;
  let code;
  let exists = true;

  while (exists) {
    code = "SER" + String(counter).padStart(3, "0");
    exists = await Service.exists({ serviceCode: code });
    counter++;
  }

  return code;
};



// Get all services with pagination, search, sort, filter
const getAllServices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'name',
      search = '',
      priceMin,
      priceMax,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page or limit parameters',
      });
    }

    const query = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      const isNumber = !isNaN(Number(search));
      query.$or = [
        { name: { $regex: regex } },
        { description: { $regex: regex } },
        { serviceCode: { $regex: regex } },
        ...(isNumber ? [{ price: Number(search) }] : []),
      ];
    }

    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = parseFloat(priceMin);
      if (priceMax) query.price.$lte = parseFloat(priceMax);
    }

    const services = await Service.find(query)
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Service.countDocuments(query);

    res.status(200).json({
      success: true,
      services,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error('Error in getAllServices:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};


// Get single service
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.status(200).json({ success: true, service });
  } catch (error) {
    console.error('Error in getServiceById:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Create new service
const createService = async (req, res) => {
  try {
    const { name, description, price } = req.body;

    // 🔍 Kiểm tra trùng tên dịch vụ
    const existing = await Service.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Tên dịch vụ đã tồn tại',
      });
    }

    // 🔢 Tạo mã dịch vụ tự động
    const serviceCode = await generateNextServiceCode();

    // 🆕 Tạo mới dịch vụ
    const newService = new Service({
      name,
      description,
      price,
      serviceCode,
    });

    await newService.save();

    // 👤 Lấy ID người thực hiện từ middleware
    const performedBy = req.user?.userId || null;

    // 📝 Ghi log tạo mới dịch vụ
    await ServiceLog.create({
      serviceId: newService._id,
      action: "create",
      description: `Tạo dịch vụ mới: ${newService.name}`,
      performedBy,
    });

    return res.status(201).json({
      success: true,
      service: newService,
    });

  } catch (error) {
    console.error('❌ Error in createService:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo dịch vụ',
      error: error.message,
    });
  }
};


// Update service
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    const oldService = await Service.findById(id);
    if (!oldService) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const updated = await Service.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    // 🔍 So sánh để tạo nội dung chi tiết cho log
    let changes = [];
    if (updateFields.name && updateFields.name !== oldService.name) {
      changes.push(`Tên từ "${oldService.name}" → "${updateFields.name}"`);
    }
    if (updateFields.description && updateFields.description !== oldService.description) {
      changes.push(`Mô tả từ "${oldService.description || 'trống'}" → "${updateFields.description}"`);
    }
    if (updateFields.price && updateFields.price !== oldService.price) {
      changes.push(`Giá từ ${oldService.price.toLocaleString()} → ${updateFields.price.toLocaleString()}`);
    }

    // 📝 Ghi log nếu có thay đổi
    if (changes.length > 0) {
      await ServiceLog.create({
        serviceId: updated._id,
        action: "update",
        description: `Cập nhật: ${changes.join("; ")}`,
        performedBy: req.user?.userId,
      });
    }

    res.status(200).json({ success: true, service: updated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Tên dịch vụ đã tồn tại' });
    }
    console.error('Error in updateService:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};


// Delete service
const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.status(200).json({ success: true, message: 'Service deleted successfully' });
    await ServiceLog.create({
    serviceId: service._id,
    action: "delete",
    description: `Xoá dịch vụ: ${service.name}`,
    performedBy: req.user?.userId,
    });

  } catch (error) {
    console.error('Error in deleteService:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
const toggleServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);
    if (!service) return res.status(404).json({ message: "Service not found" });

    service.status = service.status === "active" ? "inactive" : "active";
    await service.save();

    await ServiceLog.create({
    serviceId: service._id,
    action: "status_change",
    description: `Chuyển trạng thái dịch vụ ${service.name} sang ${service.status}`,
    performedBy: req.user?.userId,
    });

    res.status(200).json({ success: true, status: service.status });
  } catch (err) {
    console.error("Error in toggleServiceStatus:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
const getServiceLogs = async (req, res) => {
  try {
    const { id } = req.params;

    const logs = await ServiceLog.find({ serviceId: id })
      .populate({
        path: 'performedBy',
        select: 'name employeeCode', 
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error("Lỗi khi lấy log:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
  getServiceLogs,
};
