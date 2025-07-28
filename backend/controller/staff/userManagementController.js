const bcrypt = require('bcrypt');
const User = require('../../models/User');

// Controller getAllUsers hỗ trợ tìm kiếm và phân trang
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 5, search = "", status } = req.query;

    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { user_code: { $regex: search, $options: "i" } }, // Add user_code to search
      ],
    };

    if (status && status !== "") {
      query.status = status;
    }

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query, { _id: 1, name: 1, email: 1, phone: 1, status: 1, user_code: 1 }) // Include user_code
      .sort({ _id: -1 })  // Sắp xếp theo _id giảm dần (người dùng mới nhất sẽ ở đầu)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .exec();

    res.status(200).json({
      users,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: parseInt(page),
      totalUsers,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Lấy người dùng theo ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, { _id: 1, name: 1, email: 1, phone: 1, status: 1, user_code: 1 }); // Include user_code
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Tạo người dùng mới
exports.createUser = async (req, res) => {
  try {
    const { email, password, name, phone, status } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      phone,
      status
    });

    await newUser.save();
    // Include user_code in response
    res.status(201).json({ 
      message: 'Tạo người dùng thành công', 
      user: { 
        _id: newUser._id, 
        name: newUser.name, 
        email: newUser.email, 
        phone: newUser.phone, 
        status: newUser.status, 
        user_code: newUser.user_code 
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Cập nhật người dùng
exports.updateUser = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Prevent manual updates to user_code
    delete updateData.user_code;

    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    // Include user_code in response
    res.status(200).json({ 
      message: 'Cập nhật thành công', 
      user: { 
        _id: updatedUser._id, 
        name: updatedUser.name, 
        email: updatedUser.email, 
        phone: updatedUser.phone, 
        status: updatedUser.status, 
        user_code: updatedUser.user_code 
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Xoá người dùng
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    res.status(200).json({ message: 'Xoá người dùng thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};