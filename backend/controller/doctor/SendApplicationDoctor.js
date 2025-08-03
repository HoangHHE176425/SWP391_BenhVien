const SendApplication = require('../../models/SendApplication');
const Employee = require('../../models/Employee');

// Create a new application
const createSendApplication = async (req, res) => {
  try {
    const { senderId, subject, content, templateType, fields, priority } = req.body;

    // Validate required fields
    if (!senderId || !subject || !content) {
      return res.status(400).json({ message: 'Thiếu các trường bắt buộc: senderId, subject, content.' });
    }

    // Kiểm tra người gửi có tồn tại và đang hoạt động
    const sender = await Employee.findById(senderId);
    if (!sender || sender.status !== 'active') {
      return res.status(400).json({ message: 'Người gửi không hợp lệ hoặc không hoạt động.' });
    }

    // Lấy danh sách HR Managers đang hoạt động
    const hrManagers = await Employee.find({ role: 'HRManager', status: 'active' });
    if (!hrManagers.length) {
      return res.status(400).json({ message: 'Không tìm thấy HRManager để gửi đơn.' });
    }

    // Đếm số lượng đơn đã nhận của mỗi HR
    const counts = await Promise.all(
      hrManagers.map(async (hr) => {
        const count = await SendApplication.countDocuments({ receiver: hr._id });
        return { hr, count };
      })
    );

    // Sắp xếp theo số đơn đã nhận (tăng dần)
    counts.sort((a, b) => a.count - b.count);

    // Chọn HR nhận đơn ít nhất
    const receiver = counts[0].hr;

    // Tạo đơn mới
    const application = new SendApplication({
      sender: senderId,
      receiver: receiver._id,
      subject,
      content,
      templateType: templateType || 'other',
      fields: fields || [],
      priority: priority || 'normal',
    });

    await application.save();

    // Populate sender và receiver để trả về
    const populatedApplication = await SendApplication.findById(application._id)
      .populate('sender', 'name')
      .populate('receiver', 'name');

    res.status(201).json({
      message: 'Gửi đơn thành công.',
      application: populatedApplication,
    });
  } catch (error) {
    console.error('❌ Lỗi khi tạo đơn:', error);
    res.status(500).json({ message: 'Lỗi server khi gửi đơn.', error: error.message });
  }
};

// Get employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('department', 'name')
      .select('name department status role');

    if (!employee) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });
    }

    res.json({
      id: employee._id,
      name: employee.name,
      department: employee.department ? { id: employee.department._id, name: employee.department.name } : null,
      status: employee.status,
      role: employee.role,
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy thông tin nhân viên:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin nhân viên.', error: error.message });
  }
};

// Get all applications by sender
const getApplicationsBySender = async (req, res) => {
  try {
    const { senderId } = req.params;

    // Verify sender exists
    const sender = await Employee.findById(senderId);
    if (!sender) {
      return res.status(404).json({ message: 'Không tìm thấy người gửi.' });
    }

    // Fetch applications for the sender
    const applications = await SendApplication.find({ sender: senderId })
      .populate('sender', 'name')
      .populate('receiver', 'name')
      .sort({ createdAt: -1 }); // Sort by newest first

    res.json(applications);
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách đơn:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách đơn.', error: error.message });
  }
};

module.exports = {
  createSendApplication,
  getEmployeeById,
  getApplicationsBySender,
};
