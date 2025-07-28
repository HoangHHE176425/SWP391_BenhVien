require("dotenv").config();
const User = require("../../models/User");
const Employee = require("../../models/Employee");
const Appointment = require("../../models/Appointment");
const bcrypt = require("bcrypt");

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
    const { doctorId } = req.query;

    const filter = doctorId ? { doctorId } : {};

    const appointments = await Appointment.find(filter)
        .populate('userId', 'name email')
        .populate('profileId', 'fullName gender dateOfBirth')
        .populate('doctorId', 'name department')
        .sort({ appointmentDate: -1 });

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
