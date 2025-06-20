const Invoice = require('../../models/Invoice');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Service = require('../../models/Service');

// Sử dụng exports.<tên_hàm>
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('userId')        // Populate user info
      .populate('profileId')     // Populate profile info
      .populate('services');     // Populate services info

    res.status(200).json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Hàm tạo invoice mới
exports.createInvoice = async (req, res) => {
  try {
    const { userId, profileId, services, totalAmount, status, invoiceNumber } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!userId || !profileId || !services || !totalAmount || !invoiceNumber) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Kiểm tra xem userId, profileId, và services có tồn tại
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Kiểm tra danh sách services
    const validServices = await Service.find({ '_id': { $in: services } });
    if (validServices.length !== services.length) {
      return res.status(404).json({ message: 'One or more services not found' });
    }

    // Tạo invoice mới
    const newInvoice = new Invoice({
      userId,
      profileId,
      services,
      totalAmount,
      invoiceNumber,
      status: status || 'pending', // Mặc định là 'pending' nếu không cung cấp
      createdAt: new Date(),
    });

    // Lưu invoice vào cơ sở dữ liệu
    const savedInvoice = await newInvoice.save();

    // Populate thông tin liên quan
    const populatedInvoice = await Invoice.findById(savedInvoice._id)
      .populate('userId')
      .populate('profileId')
      .populate('services');

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice: populatedInvoice,
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};