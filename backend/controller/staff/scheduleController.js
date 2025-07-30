const mongoose = require('mongoose');
const Schedule = require('../../models/Schedule');
const Department = require('../../models/Department');
const Employee = require('../../models/Employee');

// CRUD Schedule
exports.createSchedule = async (req, res) => {
  console.log("🧪 req.user =", req.user); // kiểm tra thực tế

  try {
    const { employeeId, department, date, timeSlots } = req.body;

    if (!employeeId || !department || !date || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const createdBy = req.user?.userId;

    if (!createdBy) {
      return res.status(401).json({ message: "Missing createdBy from token" });
    }

    const newSchedule = new Schedule({
      employeeId,
      department,
      date,
      timeSlots,
      createdBy
    });

    await newSchedule.save();

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

    if (!employeeId || !department || !date || !timeSlots) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const updatedSchedule = await Schedule.findByIdAndUpdate(
      id,
      { employeeId, department, date, timeSlots },
      { new: true }
    );

    if (!updatedSchedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    return res.status(200).json({ message: "Schedule updated", schedule: updatedSchedule });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Schedule.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    return res.status(200).json({ message: "Schedule deleted" });
  } catch (error) {
    console.error(error);
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
