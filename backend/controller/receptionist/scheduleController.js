const mongoose = require('mongoose');
const Schedule = require('../../models/Schedule');
const Department = require('../../models/Department');
const Employee = require('../../models/Employee');
const ScheduleLog = require('../../models/ScheduleLog');
const Attendance = require('../../models/Attendance');

// CRUD Schedule
exports.createSchedule = async (req, res) => {
  try {
    const { employeeId, department, date, timeSlots } = req.body;
    const createdBy = req.user?.userId;
    // ✅ Điều chỉnh timeSlots theo ngày để tránh lệch giờ UTC
    const baseDate = new Date(date);
    baseDate.setUTCHours(0, 0, 0, 0);

    const adjustedTimeSlots = timeSlots.map(slot => {
      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);

      const adjustedStart = new Date(baseDate);
      adjustedStart.setUTCHours(start.getUTCHours(), start.getUTCMinutes(), 0, 0);

      const adjustedEnd = new Date(baseDate);
      adjustedEnd.setUTCHours(end.getUTCHours(), end.getUTCMinutes(), 0, 0);

      return {
        startTime: adjustedStart.toISOString(),
        endTime: adjustedEnd.toISOString(),
        status: slot.status || "Available",
      };
    });

    if (!employeeId || !department || !date || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!createdBy) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const scheduleDate = new Date(date);
    const startOfDay = new Date(scheduleDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(scheduleDate.setHours(23, 59, 59, 999));

    // ✅ Lấy lịch đã tồn tại trong cùng ngày cho nhân viên đó
    const existingSchedules = await Schedule.find({
      employeeId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    // ✅ Kiểm tra trùng khung giờ
    const isOverlap = existingSchedules.some((schedule) =>
      schedule.timeSlots.some((existingSlot) =>
        timeSlots.some((newSlot) => {
          const newStart = new Date(newSlot.startTime);
          const newEnd = new Date(newSlot.endTime);
          const existingStart = new Date(existingSlot.startTime);
          const existingEnd = new Date(existingSlot.endTime);

          return newStart < existingEnd && newEnd > existingStart; // ⛔ Có giao nhau
        })
      )
    );

    if (isOverlap) {
      return res.status(400).json({ message: "Khung giờ bị trùng với lịch đã tồn tại trong ngày" });
    }

    const newSchedule = new Schedule({
      employeeId,
      department,
      date,
      timeSlots: adjustedTimeSlots,
      createdBy,
    });

    await newSchedule.save();

    const employee = await Employee.findById(employeeId).select("name employeeCode");

    await ScheduleLog.create({
      schedule: newSchedule._id,
      actionType: "create",
      actionBy: createdBy,
      employeeId: employeeId,
      description: `Tạo lịch cho nhân viên ${employee?.name || "—"} (${employee?.employeeCode || "—"}) vào ngày ${new Date(date).toLocaleDateString('vi-VN')}`,
    });

    return res.status(201).json({ message: "Schedule created successfully", schedule: newSchedule });
  } catch (error) {
    console.error("❌ Error creating schedule:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};








exports.getSchedules = async (req, res) => {
  try {
    const query = {};
    if (req.query.employeeId) query.employeeId = req.query.employeeId;
    if (req.query.date) query.date = new Date(req.query.date);

    // 1. Lấy toàn bộ lịch (dưới dạng object đơn giản)
    const schedules = await Schedule.find(query).lean();

    // 2. Lấy toàn bộ khoa (kể cả inactive)
    const departmentIds = schedules.map(s => s.department);
    const departments = await Department.find({ _id: { $in: departmentIds } }).lean();
    const departmentMap = departments.reduce((acc, dep) => {
      acc[dep._id.toString()] = dep;
      return acc;
    }, {});

    // 3. Gán department thủ công vào từng lịch
    const schedulesWithDepartments = schedules.map(s => ({
      ...s,
      department: departmentMap[s.department?.toString()] || null,
    }));

    // 4. Populate employeeId như bình thường
    const employeeIds = schedules.map(s => s.employeeId);
    const employees = await Employee.find({ _id: { $in: employeeIds } }).lean();
    const employeeMap = employees.reduce((acc, emp) => {
      acc[emp._id.toString()] = emp;
      return acc;
    }, {});

    const result = schedulesWithDepartments.map(s => ({
      ...s,
      employeeId: employeeMap[s.employeeId?.toString()] || null,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Error fetching schedules:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};







exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, department, date, timeSlots } = req.body;
    const updatedBy = req.user?.userId;

    if (!employeeId || !department || !date || !timeSlots) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const schedule = await Schedule.findById(id);
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });

    const changes = {};
    if (String(schedule.employeeId) !== employeeId) {
      changes.employeeId = { from: schedule.employeeId, to: employeeId };
    }
    if (String(schedule.department) !== department) {
      changes.department = { from: schedule.department, to: department };
    }
    if (new Date(schedule.date).toISOString() !== new Date(date).toISOString()) {
      changes.date = { from: schedule.date, to: date };
    }
    if (JSON.stringify(schedule.timeSlots) !== JSON.stringify(timeSlots)) {
      changes.timeSlots = { from: schedule.timeSlots, to: timeSlots };
    }

    // Cập nhật
    schedule.employeeId = employeeId;
    schedule.department = department;
    schedule.date = date;
    schedule.timeSlots = timeSlots;
    await schedule.save();

    // ✅ Ghi log nếu có thay đổi
    if (Object.keys(changes).length > 0) {
      await ScheduleLog.create({
        schedule: schedule._id,
        actionType: "update",
        actionBy: updatedBy,
        changes,
        description: "Cập nhật lịch làm việc"
      });
    }

    return res.status(200).json({ message: "Schedule updated", schedule });
  } catch (error) {
    console.error("❌ Error updating schedule:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Schedule.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ message: "Schedule not found" });

    // ✅ Ghi log xóa
    await ScheduleLog.create({
      schedule: id,
      actionType: "delete",
      actionBy: req.user?.userId || null,
      description: `Xóa lịch ngày ${deleted.date} cho nhân viên ${deleted.employeeId}`
    });

    return res.status(200).json({ message: "Schedule deleted" });
  } catch (error) {
    console.error("❌ Error deleting schedule:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// ✅ Get all departments
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.status(200).json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get employees by department
exports.getEmployeesByDepartment = async (req, res) => {
  const departmentId = req.query.department;

  if (!departmentId) {
    return res.status(400).json({ message: "Department ID is required" });
  }

  try {
    const employees = await Employee.find({
      department: new mongoose.Types.ObjectId(departmentId) 
    });

    res.status(200).json(employees);
  } catch (error) {
    console.error("❌ Error fetching employees:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.getScheduleLogs = async (req, res) => {
  try {
    const scheduleId = req.params.id;

    const logs = await ScheduleLog.find({ schedule: scheduleId })
      .populate("actionBy", "name employeeCode")
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (err) {
    console.error("❌ Error fetching schedule logs:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.toggleScheduleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    const oldStatus = schedule.status;
    schedule.status = oldStatus === "active" ? "inactive" : "active";
    await schedule.save();

    await ScheduleLog.create({
      schedule: schedule._id,
      actionType: "status_change",
      actionBy: userId,
      changes: {
        status: { from: oldStatus, to: schedule.status }
      },
      description: `Cập nhật trạng thái lịch từ ${oldStatus} sang ${schedule.status}`
    });

    res.status(200).json({
      message: "Trạng thái đã được cập nhật",
      status: schedule.status
    });
  } catch (error) {
    console.error("❌ Error toggling schedule status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().lean();
    res.status(200).json(employees);
  } catch (error) {
    console.error("❌ Error fetching employees:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.getAllAttendances = async (req, res) => {
  try {
    const attendances = await Attendance.find()
      .populate('employeeId', 'name employeeCode')
      .populate('scheduleId')
      .populate('department', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(attendances);
  } catch (error) {
    console.error("❌ Error fetching all attendances:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAttendancesBySchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const attendances = await Attendance.find({ scheduleId: id })
      .populate('employeeId', 'name employeeCode')
      .populate('department', 'name');

    res.status(200).json(attendances);
  } catch (error) {
    console.error("❌ Error fetching attendances by schedule:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// ✅ Đánh dấu trạng thái điểm danh là "On-Leave"
exports.markAsOnLeave = async (req, res) => {
  try {
    const { scheduleId } = req.body;
    const userId = req.user?.userId;

    if (!scheduleId) {
      return res.status(400).json({ message: "Missing scheduleId" });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    const existing = await Attendance.findOne({ scheduleId });

    // ❗ Nếu đã có điểm danh (trạng thái khác 'Invalid' hoặc 'On-Leave') → chặn và ghi log
    if (existing && existing.status !== 'Invalid' && existing.status !== 'On-Leave') {
      await ScheduleLog.create({
        schedule: scheduleId,
        actionType: "error",
        actionBy: userId,
        employeeId: schedule.employeeId,
        description: `Không thể chuyển sang nghỉ phép vì nhân viên đã điểm danh (${existing.status})`
      });

      return res.status(400).json({ message: "Không thể chuyển sang nghỉ phép vì đã có điểm danh" });
    }

    if (existing) {
      existing.status = "On-Leave";
      existing.timeSlots = [];
      await existing.save();
    } else {
      await Attendance.create({
        scheduleId,
        employeeId: schedule.employeeId,
        department: schedule.department,
        date: schedule.date,
        status: "On-Leave",
        type: "Regular",
        timeSlots: [],
        createdBy: userId,
      });
    }

    await ScheduleLog.create({
      schedule: scheduleId,
      actionType: "update",
      actionBy: userId,
      employeeId: schedule.employeeId,
      description: `Cập nhật trạng thái điểm danh thành "Nghỉ phép"`
    });

    res.status(200).json({ message: "Đã đánh dấu nghỉ phép" });
  } catch (err) {
    console.error("❌ markAsOnLeave error:", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};


exports.markAttendance = async (req, res) => {
  try {
    const { scheduleId, status } = req.body;
    const receptionistId = req.user?.userId;

    if (!scheduleId || !status) {
      return res.status(400).json({ message: "scheduleId và status là bắt buộc" });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Không tìm thấy lịch làm việc" });
    }

    const attendance = await Attendance.findOne({ scheduleId });

    if (attendance) {
      attendance.status = status;
      await attendance.save();
    } else {
      await Attendance.create({
        employeeId: schedule.employeeId,
        department: schedule.department,
        scheduleId,
        date: schedule.date,
        status,
        type: "Regular", // hoặc "Leave" nếu muốn phân biệt
        createdBy: receptionistId,
        timeSlots: schedule.timeSlots
      });
    }

    return res.status(200).json({ message: "Cập nhật trạng thái điểm danh thành công" });
  } catch (err) {
    console.error("❌ Error marking attendance:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
