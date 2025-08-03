const Invoice = require('../../models/Invoice');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Service = require('../../models/Service');
const Medicine = require('../../models/Medicine');

// Sử dụng exports.<tên_hàm>
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
        .populate('userId')
        .populate('profileId')
        .populate('services');
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


exports.getAllMedicines = async (req, res) => {
  try {
    const { page = 1, limit = 10, searchTerm, filterMode } = req.query;
    
    const filter = {};
    
    if (searchTerm) {
      filter.$or = [
        { medicineId: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { type: { $regex: searchTerm, $options: 'i' } },
        { group: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    if (filterMode && filterMode !== 'all') {
      if (filterMode === 'active') {
        filter.isActive = true;
      } else if (filterMode === 'inactive') {
        filter.isActive = false;
      }
    }
    
    const skip = (page - 1) * limit;
    
    const medicines = await Medicine.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Medicine.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      medicines,
      totalPages,
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// Hàm tạo thuốc mới với medicineId
exports.createMedicine = async (req, res) => {
  try {
    const {
      medicineId,
      name,
      type,
      group,
      ingredient,
      indication,
      contraindication,
      dosage,
      sideEffects,
      precaution,
      interaction,
      note,
      storage,
      quantity,
      unitPrice,
      expirationDate,
      supplier,
      isActive = true
    } = req.body;

    // Kiểm tra dữ liệu đầu vào bắt buộc
    if (!medicineId || !name || !type || !quantity || !unitPrice || !expirationDate) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    // Kiểm tra xem medicineId đã tồn tại chưa
    const existingMedicine = await Medicine.findOne({ medicineId });
    if (existingMedicine) {
      return res.status(400).json({ message: 'Mã thuốc đã tồn tại' });
    }

    // Kiểm tra xem tên thuốc đã tồn tại chưa
    const existingName = await Medicine.findOne({ name });
    if (existingName) {
      return res.status(400).json({ message: 'Tên thuốc đã tồn tại' });
    }

    // Tạo thuốc mới
    const newMedicine = new Medicine({
      medicineId,
      name,
      type,
      group,
      ingredient,
      indication,
      contraindication,
      dosage,
      sideEffects,
      precaution,
      interaction,
      note,
      storage,
      quantity,
      unitPrice,
      expirationDate,
      supplier,
      isActive
    });

    const savedMedicine = await newMedicine.save();

    res.status(201).json({
      message: 'Tạo thuốc thành công',
      medicine: savedMedicine
    });
  } catch (error) {
    console.error('Error creating medicine:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};