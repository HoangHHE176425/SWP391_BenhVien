require("dotenv").config();
const User = require("../../models/User");
const Employee = require("../../models/Employee");
const Appointment = require("../../models/Appointment");
const bcrypt = require("bcrypt");
const Queue = require("../../models/Queue");
const { default: mongoose } = require("mongoose");
const Schedule = require("../../models/Schedule");

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

module.exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const appointmentId = req.params.id;

  // Kiểm tra status có hợp lệ hay không
  if (!status || !Appointment.schema.path('status').enumValues.includes(status)) {
    return res.status(400).json({ error: 'Status không hợp lệ' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Tìm lịch hẹn theo ID
    const appointment = await Appointment.findById(appointmentId).session(session);
    if (!appointment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Lịch hẹn không tồn tại' });
    }

    // Kiểm tra trạng thái hiện tại để áp dụng quy tắc
    if (appointment.status === 'pending_confirmation') {
      // Cho phép cập nhật từ pending_confirmation (như cũ)
      if (['confirmed', 'rejected'].includes(status)) {
        appointment.status = status;
      } else {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: 'Chỉ có thể update thành confirmed hoặc rejected từ pending_confirmation' });
      }
    } else if (appointment.status === 'pending_cancel') {
      // Cho phép duyệt hủy từ pending_cancel
      if (status === 'canceled') {
        // Đồng ý hủy: Cập nhật thành canceled và giải phóng timeSlot
        appointment.status = status;
        // Cập nhật timeSlot trong Appointment
        appointment.timeSlot.status = 'Available';

        // Tìm và cập nhật timeSlot trong Schedule
        const schedule = await Schedule.findOne({
          employeeId: appointment.doctorId,
          date: {
            $gte: new Date(appointment.appointmentDate.setHours(0, 0, 0, 0)),
            $lt: new Date(appointment.appointmentDate.setHours(23, 59, 59, 999))
          }
        }).session(session);

        if (!schedule) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({ error: 'Schedule không tồn tại' });
        }

        const timeSlot = schedule.timeSlots.find(slot =>
          slot.startTime.getTime() === appointment.timeSlot.startTime.getTime() &&
          slot.endTime.getTime() === appointment.timeSlot.endTime.getTime()
        );

        if (!timeSlot) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({ error: 'TimeSlot không tồn tại trong Schedule' });
        }

        timeSlot.status = 'Available';
        await schedule.save({ session });
      } else if (status === 'confirmed') {
        // Từ chối hủy: Giữ nguyên confirmed, không giải phóng timeSlot
        appointment.status = status;
      } else {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: 'Chỉ có thể update thành canceled (đồng ý hủy) hoặc confirmed (từ chối hủy) từ pending_cancel' });
      }
    } else {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Chỉ có thể update từ trạng thái pending_confirmation hoặc pending_cancel' });
    }

    // Lưu lịch hẹn
    await appointment.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Cập nhật status thành công', appointment });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: error.message || 'Lỗi server' });
  }
};

module.exports.pushToQueue = async (req, res) => {
  const appointmentId = req.params.appointmentId;

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || appointment.status !== 'confirmed') {
      return res.status(400).json({ error: 'Lịch hẹn không hợp lệ hoặc chưa confirmed' });
    }

    appointment.status = 'waiting_for_doctor';
    await appointment.save();

    let queue = await Queue.findOne({
      doctorId: appointment.doctorId,
      department: appointment.department,
      date: appointment.appointmentDate,
      type: appointment.type
    });

    if (!queue) {
      queue = new Queue({
        doctorId: appointment.doctorId,
        department: appointment.department,
        date: appointment.appointmentDate,
        type: appointment.type,
        queueEntries: []
      });
    }

    const position = queue.queueEntries.length + 1;

    queue.queueEntries.push({
      appointmentId: appointment._id,
      profileId: appointment.profileId,
      doctorId: appointment.doctorId,
      status: 'waiting_for_doctor',
      position: position
    });

    await queue.save();

    res.json({
      message: 'Đẩy vào hàng đợi thành công',
      queueEntry: queue.queueEntries[queue.queueEntries.length - 1]
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Lỗi server' });
  }
};

module.exports.callPatientInQueue = async (req, res) => {
  const { appointmentId } = req.params;

  try {
    // Tìm queue chứa entry với appointmentId
    const queue = await Queue.findOne({ "queueEntries.appointmentId": appointmentId });

    if (!queue) {
      return res.status(404).json({ message: "Không tìm thấy hàng đợi chứa lịch hẹn này." });
    }

    // Tìm entry trong queueEntries
    const entry = queue.queueEntries.find(entry => entry.appointmentId.toString() === appointmentId);

    if (!entry) {
      return res.status(404).json({ message: "Không tìm thấy entry cho lịch hẹn này." });
    }

    // Kiểm tra status hiện tại (ví dụ: chỉ cho gọi nếu 'waiting_for_doctor')
    if (entry.status !== 'waiting_for_doctor') {
      return res.status(400).json({ message: "Bệnh nhân không ở trạng thái chờ gọi." });
    }

    // Đổi status sang 'in_progress'
    entry.status = 'in_progress';

    // Lưu lại queue
    await queue.save();

    res.status(200).json({ message: "Đã gọi bệnh nhân vào khám thành công.", queueEntry: entry });
  } catch (err) {
    console.error("Lỗi khi gọi bệnh nhân vào khám:", err);
    res.status(500).json({ message: "Lỗi server khi gọi bệnh nhân.", error: err.message });
  }
};

// SỬA: Lấy danh sách lịch hẹn, populate thêm room, symptoms, lọc mặc định cho online và pending/confirmed
module.exports.getAppointments = async (req, res) => {
  const { profileId, status, startDate, endDate, createdBy, page = 1, limit = 10 } = req.query;

  try {
    const query = {}; // SỬA: Lọc mặc định cho online
    if (profileId) query.profileId = profileId;
    if (status) query.status = status;
    if (createdBy) query.createdBy = createdBy;
    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) query.appointmentDate.$gte = new Date(startDate);
      if (endDate) query.appointmentDate.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query)
      .populate('profileId', 'name gender dateOfBirth identityNumber phone')
      .populate('doctorId', 'name department room') // SỬA: Populate thêm room từ doctor
      .populate('department', 'name')
      .populate('userId', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ appointmentDate: 1, createdAt: -1 });

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Lỗi server' });
  }
};

//Lấy danh sách lịch cần xác nhận
module.exports.getPendingAppointments = async (req, res) => {
  const { type } = req.query;

  try {
    const filter = { status: 'pending_confirmation' };
    if (type) filter.type = type;

    const appointments = await Appointment.find(filter)
      .populate('profileId', 'fullName gender dateOfBirth phone') // Thêm phone để lễ tân gọi điện
      .populate('doctorId', 'name department')
      .populate('department', 'name')
      .sort({ appointmentDate: 1 }); // Sắp xếp theo ngày gần nhất    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Lỗi server' });
  }
};


// module.exports.getDoctorRoomMapping = async (req, res) => {
//   try {
//     const doctors = await Employee.find({ role: 'Doctor', status: 'active' }, '_id room');
//     const mapping = {};
//     doctors.forEach(doc => {
//       mapping[doc._id.toString()] = doc.room || 'Phòng mặc định'; // SỬA: Gán mặc định nếu thiếu
//     });
//     res.json({ mapping });
//   } catch (error) {
//     res.status(500).json({ error: error.message || 'Lỗi fetch mapping' });
//   }
// };

module.exports.getAllQueues = async (req, res) => {
  const { room, doctorId, page = 1, limit = 10 } = req.query; // SỬA: Thêm doctorId vào query params

  try {
    const filter = {};
    if (room) {
      filter['queueEntries.room'] = room; // Giữ filter theo room
    }
    if (doctorId) {
      filter['queueEntries.doctorId'] = doctorId; // SỬA: Filter theo doctorId trong array queueEntries
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Lấy tổng số Queue để pagination
    const total = await Queue.countDocuments(filter);

    // Lấy danh sách Queue, populate queueEntries
    const queues = await Queue.find(filter)
      .populate({
        path: 'queueEntries.appointmentId',
        select: 'appointmentDate symptoms type status'
      })
      .populate({
        path: 'queueEntries.profileId',
        select: 'name phone'
      })
      .populate({
        path: 'queueEntries.doctorId',
        select: 'name'
      })
      .populate('department', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      queues,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("[ERROR] getAllQueues:", error);
    res.status(500).json({ error: error.message || 'Lỗi server' });
  }
};