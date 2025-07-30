const Attendance = require("../../models/Attendance");
const Employee = require("../../models/Employee");

// Check-in: Tạo bản ghi mới mỗi lần
exports.checkIn = async (req, res) => {
  console.log("🚀 Check-in API hit");  // <--- Dòng test

  try {
    const { employeeId } = req.body;
    console.log("📥 Request body:", req.body);

    // (Đảm bảo không có logic "already checked in" ở đây)

    const newAttendance = new Attendance({
      employeeId,
      checkInTime: new Date(),
    });

    await newAttendance.save();
    return res.status(201).json({ message: "Checked in successfully", attendance: newAttendance });
  } catch (error) {
    console.error("❌ Check-in error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};



// Check-out: Tìm bản ghi chưa có checkOutTime gần nhất
exports.checkOut = async (req, res) => {
  try {
    const { employeeId } = req.body;

    const attendance = await Attendance.findOne({
      employeeId,
      checkOutTime: { $exists: false },
    }).sort({ checkInTime: -1 }); // tìm bản gần nhất chưa checkout

    if (!attendance) {
      return res.status(404).json({ message: "No check-in record found to check out" });
    }

    attendance.checkOutTime = new Date();
    await attendance.save();

    return res.status(200).json({ message: "Checked out successfully", attendance });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
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
