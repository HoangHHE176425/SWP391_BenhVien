const Schedule = require('../../models/Schedule');
const Department = require('../../models/Department');
const Employee = require('../../models/Employee');

// CRUD Schedule
exports.createSchedule = async (req, res) => {
  try {
    const { employeeId, department, date, timeSlots } = req.body;
    if (!employeeId || !department || !date || !timeSlots || !Array.isArray(timeSlots)) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newSchedule = new Schedule({ employeeId, department, date, timeSlots });
    await newSchedule.save();

    return res.status(201).json({ message: "Schedule created successfully", schedule: newSchedule });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getSchedules = async (req, res) => {
  try {
    const query = {};
    if (req.query.employeeId) query.employeeId = req.query.employeeId;
    if (req.query.date) query.date = new Date(req.query.date);

    const schedules = await Schedule.find(query)
      .populate('employeeId')
      .populate('department');

    return res.status(200).json(schedules);
  } catch (error) {
    console.error(error);
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
    const employees = await Employee.find({ department: departmentId }); // nếu lưu theo ObjectId
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

