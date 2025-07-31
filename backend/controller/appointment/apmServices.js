require("dotenv").config();
const User = require("../../models/User");
const Employee = require("../../models/Employee");
const Appointment = require("../../models/Appointment");
const bcrypt = require("bcrypt");
const { default: mongoose } = require("mongoose");

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
    console.log(req.query);
    const { doctorId, status, increaseSort, dateFrom, 
      dateTo, identityNumber, page = 1, limit = 10 } = req.query;

    const filter = doctorId ? { doctorId } : {};
    
    if (status) {
      if (Array.isArray(status)) {
        filter.status = { $in: status };
      } else if (status.includes(',')) {
        filter.status = { $in: status.split(',').map(s => s.trim()) };
      } else {
        filter.status = status;
      }
    }

    if (dateFrom && dateTo) {
      filter.appointmentDate = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
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

module.exports.getAllAppointmentsAggregate = async (req, res) => {
  try {
    const {
      doctorId,
      status,
      increaseSort,
      dateFrom,
      dateTo,
      identityNumber,
      page = 1,
      limit = 10
    } = req.query;

    // Khởi tạo điều kiện lọc
    const matchStage = {};

    if (doctorId) {
      matchStage.doctorId = new mongoose.Types.ObjectId(doctorId);
    }

    if (status) {
      matchStage.status = Array.isArray(status)
        ? { $in: status }
        : status.includes(',')
        ? { $in: status.split(',').map(s => s.trim()) }
        : status;
    }

    if (dateFrom && dateTo) {
      matchStage.appointmentDate = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo),
      };
    }

    // Pipeline chính
    const pipeline = [
      { $match: matchStage },

      // Join với profile
      {
        $lookup: {
          from: 'profiles',
          localField: 'profileId',
          foreignField: '_id',
          as: 'profileId',
        },
      },
      {
        $unwind: {
          path: '$profileId',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lọc theo số CCCD nếu có
      ...(identityNumber
        ? [{ $match: { 'profileId.identityNumber': identityNumber } }]
        : []),

      // Join với doctor
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctorId',
        },
      },
      {
        $unwind: {
          path: '$doctorId',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Tách nhánh: một nhánh để phân trang, một nhánh để đếm tổng
      {
        $facet: {
          data: [
            { $sort: { appointmentDate: increaseSort === 'true' ? 1 : -1 } },
            { $skip: (parseInt(page) - 1) * parseInt(limit) },
            { $limit: parseInt(limit) },
          ],
          totalCount: [{ $count: 'count' }]
        }
      },

      // Chuyển totalCount về dạng số đơn giản
      {
        $addFields: {
          total: { $ifNull: [{ $arrayElemAt: ['$totalCount.count', 0] }, 0] }
        }
      }
    ];

    // Thực thi pipeline
    const result = await Appointment.aggregate(pipeline);
    const { data = [], total = 0 } = result[0] || {};

    // Trả kết quả
    res.status(200).json({
      data,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });

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
