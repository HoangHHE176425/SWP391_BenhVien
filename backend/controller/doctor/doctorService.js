const mongoose = require('mongoose'); // Thêm dòng này
const Employee = require("../../models/Employee");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const Schedule = require("../../models/Schedule");
const moment = require('moment');

// Lấy tất cả bác sĩ
const getAllDoctors = async (req, res) => {
    try {
        const doctors = await Employee.find({ role: 'Doctor' })
            .select('name email department specialization phone');
        res.status(200).json({
            success: true,
            count: doctors.length,
            data: doctors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};
// Tìm kiếm bác sĩ theo tên
const searchDoctorsByName = async (req, res) => {
    try {
        const { name } = req.body; // Lấy name từ body JSON
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp tên để tìm kiếm'
            });
        }

        const doctors = await Employee.find({
            role: 'Doctor',

            name: { $regex: name, $options: 'i' }
        }).select('name email department specialization phone');

        res.status(200).json({
            success: true,
            count: doctors.length,
            data: doctors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Lấy bác sĩ theo phân trang
const getDoctorsPaginated = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const doctors = await Employee.find({ role: 'Doctor' })
            .select('name email department specialization phone')
            .skip(skip)
            .limit(limit);

        const total = await Employee.countDocuments({ role: 'Doctor' });

        res.status(200).json({
            success: true,
            count: doctors.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: doctors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Lấy tất cả hồ sơ theo Employee ID
const getProfilesByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'ID người dùng không hợp lệ'
            });
        }

        const user = await User.findById(userId)
            .populate({
                path: 'profiles',
                select: 'name dateOfBirth gender diagnose note issues doctorId',
                populate: {
                    path: 'doctorId',
                    select: 'name email specialization'
                }
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        res.status(200).json({
            success: true,
            count: user.profiles.length,
            data: user.profiles
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};


module.exports = {
    getAllDoctors, searchDoctorsByName, getDoctorsPaginated, getProfilesByUserId
}

require("dotenv").config();
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

module.exports.getDoctorsByDepartment = async (req, res) => {
    const { departmentId } = req.query;

    try {
        const doctors = await Employee.find({ role: 'Doctor', ...(departmentId && {department: departmentId}) }).select('name _id specialization');
        res.json({ doctors });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Lỗi server' });
    }
};

module.exports.getAvailableSlotsInWeek = async (req, res) => {
    const doctorId = req.params.doctorId;
    const { startDate } = req.query;

    if (!startDate) {
        return res.status(400).json({ error: 'Cần startDate (YYYY-MM-DD)' });
    }

    try {
        // Normalize startDate thành UTC và startOf('day')
        const start = moment.utc(startDate, 'YYYY-MM-DD').startOf('day');
        if (!start.isValid()) {
            return res.status(400).json({ error: 'startDate không hợp lệ' });
        }

        const end = moment.utc(start).add(6, 'days').endOf('day');

        // Log để debug
        console.log('Query range:', start.toISOString(), 'to', end.toISOString());

        // Query Schedule trong khoảng thời gian
        const schedules = await Schedule.find({
            employeeId: doctorId,
            date: { $gte: start.toDate(), $lte: end.toDate() }
        });

        // Log schedules tìm thấy
        console.log('Found schedules:', schedules.length);

        let availableSlots = [];
        schedules.forEach(schedule => {
            const slots = schedule.timeSlots.filter(slot => slot.status === 'Available');
            slots.forEach(slot => {
                availableSlots.push({
                    date: schedule.date,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    status: slot.status
                });
            });
        });

        // Sắp xếp theo ngày và giờ
        availableSlots.sort((a, b) => {
            if (a.date.getTime() !== b.date.getTime()) return a.date.getTime() - b.date.getTime();
            return a.startTime.getTime() - b.startTime.getTime();
        });

        res.json({ slots: availableSlots });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message || 'Lỗi server' });
    }

    module.exports.getAllDoctorsForApm = async (req, res) => {
        try {
            const {services} = req.query;
            const doctors = await Employee.find({ role: 'Doctor', status: 'active', ...(services ? { services: { $all: Array.isArray(services) ? services.map(id => new mongoose.Types.ObjectId(id.trim())) : [new mongoose.Types.ObjectId(services.trim())] } } : {}) })
                .select('name department expYear avatar degree'); // CHỈ lấy các trường cần thiết
    
            res.status(200).json(doctors);
        } catch (err) {
            console.error("Error fetching doctors:", err);
            res.status(500).json({ message: "Server error", error: err.message });
        }
    };
};
