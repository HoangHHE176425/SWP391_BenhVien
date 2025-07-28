const Attendance = require("../../models/Attendance"); // Mô hình Attendance
const Employee = require("../../models/Employee"); // Mô hình Employee

// Check-in
exports.checkIn = async (req, res) => {
  try {
    const { employeeId } = req.body; // Lấy ID nhân viên từ body request

    // Tạo bản ghi chấm công mới
    const newAttendance = new Attendance({
      employeeId,
      checkInTime: new Date(),
    });

    await newAttendance.save();
    return res.status(201).json({ message: "Checked in successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Check-out
exports.checkOut = async (req, res) => {
  try {
    const { employeeId } = req.body; // Lấy ID nhân viên từ body request

    // Tìm bản ghi chấm công chưa có check-out
    const attendance = await Attendance.findOne({
      employeeId,
      checkOutTime: { $exists: false },
    });

    if (!attendance) {
      return res.status(404).json({ message: "No check-in record found" });
    }

    // Cập nhật thời gian check-out
    attendance.checkOutTime = new Date();
    await attendance.save();
    return res.status(200).json({ message: "Checked out successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Lấy chấm công của nhân viên theo ID
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

// Lấy tất cả các bản ghi chấm công
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

// Lịch sử chấm công của nhân viên
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Lấy lịch sử chấm công của nhân viên
    const attendanceHistory = await Attendance.find({ employeeId: employeeId }).sort({ checkInTime: -1 });

    if (!attendanceHistory || attendanceHistory.length === 0) {
      return res.status(404).json({ message: "No attendance history found" });
    }

    return res.status(200).json(attendanceHistory);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
