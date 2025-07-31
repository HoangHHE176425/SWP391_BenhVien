require("dotenv").config();
const User = require("../../models/User");
const Employee = require("../../models/Employee");
const Appointment = require("../../models/Appointment");
const bcrypt = require("bcrypt");
const Queue = require("../../models/Queue");

// Admin - user manage
module.exports.getUserAccs = async (req, res) => {
  try {
    const users = await User.find({}, "name email status createdAt");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.editUsers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.status === "inactive") {
      user.status = "inactive";
      await user.save();
      return res.json({ message: "User banned successfully" });
    }

    Object.assign(user, req.body);
    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.changeStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = user.status === "active" ? "inactive" : "active";
    await user.save();

    res
      .status(200)
      .json({ message: `User status updated to ${user.status}` });
  } catch (error) {
    res.status(500).json({ message: "Failed to update user status", error });
  }
};

module.exports.delUsers = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


//Admin - employee manage

module.exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({}, "-password");
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE employee
module.exports.createEmployees = async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const employee = new Employee({
      email: req.body.email,
      password: hashedPassword,
      name: req.body.name,
      role: req.body.role,
      status: "active",
    });
    console.log("Create Employee Body:", req.body);

    const newEmployee = await employee.save();
    res.status(201).json(newEmployee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE employee (full form)
module.exports.editEmployees = async (req, res) => {
  try {
    const updateFields = { ...req.body };

    // Optional: re-hash password if being updated
    if (updateFields.password) {
      updateFields.password = await bcrypt.hash(updateFields.password, 10);
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(updatedEmployee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE employee
module.exports.delEmployees = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });


    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.getAllAppointments = async (req, res) => {
  try {
    const { doctorId, status, increaseSort } = req.query;

    const filter = doctorId ? { doctorId } : {};

    // Hỗ trợ nhiều giá trị status (có thể là string hoặc array)
    if (status) {
      if (Array.isArray(status)) {
        // Nếu status là array, sử dụng $in operator
        filter.status = { $in: status };
      } else if (status.includes(',')) {
        // Nếu status là string chứa dấu phẩy, split thành array
        filter.status = { $in: status.split(',').map(s => s.trim()) };
      } else {
        // Nếu status là string đơn lẻ
        filter.status = status;
      }
    }

    const appointments = await Appointment.find(filter)
      .populate('userId', 'name email')
      .populate('profileId', 'fullName gender dateOfBirth name identityNumber')
      .populate('doctorId', 'name department')
      .sort({ appointmentDate: increaseSort ? 1 : -1 });

    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports.getAllDoctors = async (req, res) => {
  res.status(200).json({ message: 'getAllDoctors not implemented' });
};

module.exports.searchDoctorsByName = async (req, res) => {
  res.status(200).json({ message: 'searchDoctorsByName not implemented' });
};

module.exports.getDoctorsPaginated = async (req, res) => {
  res.status(200).json({ message: 'getDoctorsPaginated not implemented' });
};

module.exports.getProfilesByUserId = async (req, res) => {
  res.status(200).json({ message: 'getProfilesByUserId not implemented' });
};

//Thay đổi trạng thái lịch hẹn
module.exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const appointmentId = req.params.id;

  if (!status || !Appointment.schema.path('status').enumValues.includes(status)) {
    return res.status(400).json({ error: 'Status không hợp lệ' });
  }

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Lịch hẹn không tồn tại' });
    }

    appointment.status = status;
    await appointment.save();

    res.json({ message: 'Cập nhật status thành công', appointment });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Lỗi server' });
  }
};

//Lấy danh sách lịch cần xác nhận
module.exports.getPendingAppointments = async (req, res) => {
  const { type } = req.query;

  try {
    const filter = { status: 'pending_confirmation' };
    if (type) filter.type = type;

    const appointments = await Appointment.find(filter)
      .populate('profileId', 'fullName gender dateOfBirth phone') // Thêm phone để lễ tân gọi điện
      .populate('doctorId', 'name department')
      .populate('department', 'name')
      .sort({ appointmentDate: 1 }); // Sắp xếp theo ngày gần nhất    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Lỗi server' });
  }
};

//Đẩy lịch vào hàng đợi
module.exports.pushToQueue = async (req, res) => {
  const appointmentId = req.params.appointmentId;

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || appointment.status !== 'confirmed') {
      return res.status(400).json({ error: 'Lịch hẹn không hợp lệ hoặc chưa confirmed' });
    }

    let queue = await Queue.findOne({ department: appointment.department, date: appointment.appointmentDate, type: appointment.type });
    if (!queue) {
      queue = new Queue({
        department: appointment.department,
        date: appointment.appointmentDate,
        type: appointment.type,
        queueEntries: []
      });
    }

    queue.queueEntries.push({
      appointmentId: appointment._id,
      profileId: appointment.profileId,
      doctorId: appointment.doctorId,
      room: appointment.room,
      status: 'queued'
    });
    await queue.save();

    appointment.status = 'queued';
    await appointment.save();

    res.json({ message: 'Đẩy vào hàng đợi thành công', queueEntry: queue.queueEntries[queue.queueEntries.length - 1] });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Lỗi server' });
  }
};

module.exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const appointmentId = req.params.id;

  if (!status || !Appointment.schema.path('status').enumValues.includes(status)) {
    return res.status(400).json({ error: 'Status không hợp lệ' });
  }

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Lịch hẹn không tồn tại' });
    }

    // Kiểm tra nếu status phù hợp (ví dụ: chỉ update từ pending_confirmation)
    if (appointment.status !== 'pending_confirmation') {
      return res.status(400).json({ error: 'Chỉ có thể update từ trạng thái pending_confirmation' });
    }

    appointment.status = status;
    await appointment.save();

    // Có thể gửi email/sms notification cho bệnh nhân ở đây (tích hợp sau)
    res.json({ message: 'Cập nhật status thành công', appointment });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Lỗi server' });
  }
};

module.exports.getAppointments = async (req, res) => {
  const { profileId, status, startDate, endDate, createdBy, page = 1, limit = 10 } = req.query;

  try {
    const query = {};
    if (profileId) query.profileId = profileId;
    if (status) query.status = status;
    if (createdBy) query.createdBy = createdBy; // Thêm lọc theo createdBy
    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) query.appointmentDate.$gte = new Date(startDate);
      if (endDate) query.appointmentDate.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query)
      .populate('profileId doctorId department')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ appointmentDate: -1, createdAt: -1 });

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Lỗi server' });
  }
};