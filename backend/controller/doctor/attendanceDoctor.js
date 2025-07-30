const mongoose = require("mongoose");
const Attendance = require("../../models/Attendance");
const Employee = require("../../models/Employee");
const Schedule = require('../../models/Schedule');

// Check-in: Tạo bản ghi mới mỗi lần
exports.checkIn = async (req, res) => {
  const { employeeId, scheduleId, department, timeSlots, date, ipAddress, location } = req.body;

  if (!employeeId || !scheduleId || !department || !date || !timeSlots) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc để điểm danh" });
  }

  const newAttendance = new Attendance({
    employeeId,
    scheduleId,
    department,
    timeSlots,
    date: new Date(date),
    checkInTime: new Date(),
    ipAddress: ipAddress || req.ip, // fallback dùng địa chỉ IP từ request nếu không có
    location: location || null,
  });

  await newAttendance.save();
  return res.status(201).json({ message: "Check-in thành công", attendance: newAttendance });
};






// Check-out: Tìm bản ghi chưa có checkOutTime gần nhất
exports.checkOut = async (req, res) => {
  const { employeeId, scheduleId, ipAddress, location } = req.body;

  if (!employeeId || !scheduleId) {
    return res.status(400).json({ message: "Thiếu employeeId hoặc scheduleId" });
  }

  const attendance = await Attendance.findOne({
    employeeId,
    scheduleId,
    checkOutTime: { $exists: false },
  });

  if (!attendance) {
    return res.status(404).json({ message: "Không tìm thấy bản ghi cần check-out (đã check-in chưa?)" });
  }

  attendance.checkOutTime = new Date();
  if (ipAddress) attendance.ipAddress = ipAddress;
  if (location) attendance.location = location;

  await attendance.save();

  return res.status(200).json({ message: "Check-out thành công", attendance });
};


// Lấy chấm công của một nhân viên
exports.getAttendanceByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const attendance = await Attendance.find({ employeeId });

    if (!attendance || attendance.length === 0) {
      return res.status(404).json({ message: "No attendance found for this employee" });
    }

    return res.status(200).json(attendance);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Lấy toàn bộ dữ liệu chấm công
exports.getAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find();

    if (!attendance || attendance.length === 0) {
      return res.status(404).json({ message: "No attendance records found" });
    }

    return res.status(200).json(attendance);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Lịch sử chấm công của một nhân viên (mới nhất -> cũ)
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const attendanceHistory = await Attendance.find({ employeeId }).sort({ checkInTime: -1 });

    if (!attendanceHistory || attendanceHistory.length === 0) {
      return res.status(404).json({ message: "No attendance history found" });
    }

    return res.status(200).json(attendanceHistory);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const dayjs = require('dayjs');

// ✅ Lấy lịch của chính mình trong ngày hôm nay
exports.getMyTodaySchedule = async (req, res) => {
  try {
    const employeeId = req.user?.userId;

    if (!employeeId) {
      return res.status(401).json({ message: "Unauthorized: Missing employee ID" });
    }

    const startOfDay = dayjs().startOf('day').toDate();
    const endOfDay = dayjs().endOf('day').toDate();

    const todaySchedules = await Schedule.find({
      employeeId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).populate('department');

    return res.status(200).json(todaySchedules);
  } catch (error) {
    console.error("❌ Lỗi lấy lịch hôm nay:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ Lấy lịch của nhân viên đang đăng nhập
exports.getMySchedule = async (req, res) => {
  try {
    const employeeId = req.user?.userId;

    if (!employeeId) {
      return res.status(401).json({ message: "Unauthorized: Missing employee ID" });
    }

    const schedules = await Schedule.find({ employeeId })
      .populate("department")
      .sort({ date: 1 });

    return res.status(200).json(schedules);
  } catch (error) {
    console.error("❌ Lỗi khi lấy lịch của chính mình:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
// controller/staff/attendanceController.js
exports.getTodaySchedule = async (req, res) => {
  const { employeeId } = req.params;
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  try {
    const schedules = await require('../../models/Schedule').find({
      employeeId,
      date: today
    }).populate('department');

    res.status(200).json(schedules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
exports.getDoctorSchedules = async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (!mongoose.isValidObjectId(employeeId)) {
      return res.status(400).json({ message: "employeeId không hợp lệ" });
    }
    const schedules = await Schedule.find({ employeeId })
      .populate('department')
      .lean();
    return res.status(200).json({ schedules });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Trong attendanceDoctor.js
exports.getAllSchedules = async (req, res) => {
  const { employeeId } = req.params;

  try {
    if (!employeeId) {
      return res.status(400).json({ message: "Thiếu employeeId" });
    }

    const schedules = await Schedule.find({ employeeId })
      .populate('department')
      .lean();

    res.status(200).json({ schedules });
  } catch (err) {
    console.error("❌ Lỗi khi lấy tất cả lịch làm việc:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

