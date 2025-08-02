const SendApplication = require('../../models/SendApplication');
const Employee = require('../../models/Employee');
const Department = require('../../models/Department');

// Get all applications received by an HRManager
const getApplicationsByReceiver = async (req, res) => {
  try {
    const { receiverId } = req.params;

    const employee = await Employee.findById(req.user.userId);
    if (!employee || employee.role !== 'HRManager' || employee.status !== 'active') {
      return res.status(403).json({ message: 'Bạn không có quyền xem danh sách đơn.' });
    }

    if (employee._id.toString() !== receiverId) {
      return res.status(403).json({ message: 'Không thể xem đơn không thuộc về bạn.' });
    }

    const applications = await SendApplication.find({ receiver: receiverId })
      .populate({
        path: 'sender',
        select: 'name department',
        populate: { path: 'department', select: 'name' },
      })
      .populate('receiver', 'name')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách đơn nhận:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách đơn nhận.', error: error.message });
  }
};


// Update an application's status and reply
const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reply } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Trạng thái là bắt buộc.' });
    }

    const validStatuses = ['pending', 'processing', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
    }

    const application = await SendApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Không tìm thấy đơn.' });
    }

    // ✅ Truy vấn lại nhân viên từ userId để kiểm tra role
    const employee = await Employee.findById(req.user.userId);
    if (!employee || employee.role !== 'HRManager' || employee.status !== 'active') {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật đơn này.' });
    }

    if (application.receiver.toString() !== employee._id.toString()) {
      return res.status(403).json({ message: 'Không có quyền cập nhật đơn này.' });
    }

    application.status = status;
    application.reply = reply || application.reply;
    application.decisionAt = new Date();
    application.seen = true;

    await application.save();

    const populatedApplication = await SendApplication.findById(id)
      .populate({
        path: 'sender',
        select: 'name department',
        populate: { path: 'department', select: 'name' },
      })
      .populate('receiver', 'name');

    res.json({
      message: 'Cập nhật đơn thành công.',
      application: populatedApplication,
    });
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật đơn:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật đơn.', error: error.message });
  }
};


module.exports = {
  getApplicationsByReceiver,
  updateApplication,
};