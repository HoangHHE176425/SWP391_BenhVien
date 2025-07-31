const mongoose = require('mongoose');
const Invoice = require('../../models/Invoice');
const Payment = require('../../models/Payment');
const Service = require('../../models/Service');
const User = require('../../models/User');
exports.getAllInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // if (!req.user) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Vui lòng đăng nhập để truy cập'
    //   });
    // }

    // const invoices = await Invoice.find({ userId: req.user.id })
    const invoices = await Invoice.find()
      .populate('userId', 'name email')
      .populate('profileId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // const total = await Invoice.countDocuments({ userId: req.user.id });
    const total = await Invoice.countDocuments()
    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};
exports.getAllInvoices4User = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',     // Tên trường cần sort
      order = 'desc',         // asc | desc
      status,                 // Lọc trạng thái nếu cần
      search                  // Tìm kiếm từ khóa
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để truy cập'
      });
    }

    // ===== 1. Tạo query lọc ==========
    const query = { userId: req.user.id };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } }, // ví dụ tìm theo "note"
        // Thêm field khác nếu có
      ];
    }

    // ===== 2. Tạo sort object ==========
    const sortQuery = {};
    sortQuery[sort] = order === 'asc' ? 1 : -1;

    // ===== 3. Query với sort ==========
    const invoices = await Invoice.find(query)
      .populate('userId', 'name email')
      .populate('profileId', 'name')
      .populate('services', 'name price')
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNum);

    const total = await Invoice.countDocuments(query);

    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

exports.CompletedInvoices = async (req, res) => {
  const { invoiceId, method = 'Mobile App' } = req.body;

  if (!invoiceId) {
    return res.status(400).json({ success: false, message: "Thiếu invoiceId" });
  }

  try {
    // 1. Cập nhật trạng thái hóa đơn
    const invoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      { status: "Paid" },
      { new: true }
    )
      .populate('userId profileId services');

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hóa đơn" });
    }

    // 2. Tạo bản ghi thanh toán mới
    const payment = new Payment({
      invoiceId: invoice._id,
      userId: invoice.userId?._id,
      profileId: invoice.profileId?._id,
      amount: invoice.totalAmount || 0, // đảm bảo Invoice có trường này
      method,
      status: "Completed",
      paymentDate: new Date()
    });

    await payment.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật và tạo thanh toán thành công",
      invoice,
      payment
    });
  } catch (error) {
    console.error("Lỗi khi hoàn tất hóa đơn:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật hóa đơn",
      error: error.message
    });
  }
};

exports.CreateInvoices = async (req, res) => {
  const { userId = null, profileId = null, ArrayServiceId } = req.body;

  try {
    // Lấy danh sách dịch vụ từ DB
    const services = await Service.find({
      _id: { $in: ArrayServiceId.map(id => new mongoose.Types.ObjectId(id)) }
    });
    // tinh tien dich vu nek kkk
    const totalAmount = services.reduce((sum, svc) => sum + svc.price, 0);
    // tao so hoa don
    const invoiceNumber = "INV-" + Math.floor(1000 + Math.random() * 9000);
    const newInvoice = new Invoice({
      userId,
      profileId,
      services,
      invoiceNumber,
      totalAmount,
      status: "Pending",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await newInvoice.save();
    // thanh cong
    res.status(200).json({ message: "create hoa don thanh cong roi ne", invoice: newInvoice });
  } catch (error) {
    res.status(500).json({ message: "error by server" });
  }
};

exports.getServices = async (req, res) => {
  const invoiceId = req.params.invoiceId;
  try {
    const invoice = await Invoice.findById({ _id: invoiceId });
    if (!invoice) {
      res.status(500).json({ message: "error" });
    }
    const services = await Service.find({
      _id: { $in: invoice.services.map(id => new mongoose.Types.ObjectId(id)) }
    });
    res.status(200).json({ services: services });
  } catch (error) {
    res.status(500).json({ message: "error by server" });
  }

}
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.status(200).json({ services: services });
  } catch (error) {
    res.status(500).json({ message: "error by server" });
  }

}
// Lấy tất cả hồ sơ theo Employee ID
exports.getProfilesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }

    const user = await User.findById(userId)
      .populate({
        path: 'profiles',
        select: 'name dateOfBirth gender diagnose note issues doctorId',
        populate: {
          path: 'doctorId',
          select: 'name email specialization'
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.status(200).json({
      success: true,
      count: user.profiles.length,
      data: user.profiles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

exports.CreateInvoices2 = async (req, res) => {
  const { orderCode, serviceId, amount, userId, profileId } = req.body;

  try {
    // Lấy dịch vụ từ DB
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service không tồn tại" });
    }

    // Tạo hóa đơn
    const newInvoice = new Invoice({
      userId,
      profileId,
      services: [service._id],
      invoiceNumber: orderCode || "INV-" + Math.floor(1000 + Math.random() * 9000),
      totalAmount: amount || service.price || 0,
      status: "Paid",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newInvoice.save();
    const payment = new Payment({
      invoiceId: newInvoice._id,
      userId: newInvoice.userId?._id,
      profileId: newInvoice.profileId?._id,
      amount: newInvoice.totalAmount || 0, // đảm bảo Invoice có trường này
      method: "Mobile App",
      status: "Completed",
      paymentDate: new Date()
    });

    await payment.save();

    res.status(200).json({ message: "Tạo hóa đơn thành công", invoice: newInvoice });
  } catch (error) {
    console.error("Error tạo hóa đơn:", error);
    res.status(500).json({ message: "Lỗi server khi tạo hóa đơn" });
  }
};
