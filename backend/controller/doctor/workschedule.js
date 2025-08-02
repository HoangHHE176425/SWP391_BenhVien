const mongoose = require("mongoose");
const Schedule = require("../../models/Schedule");
const Department = require("../../models/Department");
const Attendance = require("../../models/Attendance"); // ✅ THÊM

const getByDoctor = async (req, res) => {
  const doctorId = new mongoose.Types.ObjectId(req.params.id);
  try {
    // Lấy tất cả lịch làm việc
    
const schedules = await Schedule.find({ employeeId: doctorId });

    const enrichedSchedules = await Promise.all(
      schedules.map(async (schedule) => {
        const departmentName = await getDepartmentNameById(schedule.department);
        return {
          ...schedule.toObject(),
          departmentName,
        };
      })
    );

    // ✅ Lấy tất cả bản ghi attendance theo employeeId
    
    const attendanceRecords = await Attendance.find({ employeeId: doctorId })
      .sort({ date: -1 })
      .lean();

    res.status(200).json({
      schedules: enrichedSchedules,
      attendance: attendanceRecords, // ✅ trả về thêm
    });
  } catch (error) {
    res.status(500).json({ msg: "Lỗi server", error });
  }
};

const getDepartmentNameById = async (id) => {
  const department = await Department.findById(id);
  return department ? department.name : null;
};

module.exports = { getByDoctor };
