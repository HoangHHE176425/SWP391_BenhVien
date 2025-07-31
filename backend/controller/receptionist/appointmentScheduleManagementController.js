const express = require("express");
const receptionistRouter = express.Router();
const Appointment = require("../../models/Appointment");
const User = require("../../models/User");
const Employee = require("../../models/Employee");
const Schedule = require('../../models/Schedule');
const Profile = require('../../models/Profile');
const Department = require("../../models/Department");
const mongoose = require("mongoose");


// Lấy danh sách lịch hẹn có kèm tên bác sĩ, người dùng, số điện thoại và user_code với phân trang
exports.getAllAppointments = async (req, res) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 10,
      status,
      department,
      startDate,
      endDate
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    let query = {};
    if (status) query.status = status;
    if (department) query.department = department;

    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate && !isNaN(new Date(startDate).getTime())) {
        query.appointmentDate.$gte = new Date(startDate);
      }
      if (endDate && !isNaN(new Date(endDate).getTime())) {
        query.appointmentDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      }
    }

    // Fetch appointments with profile reference for later enrich
    const appointments = await Appointment.find(query)
      .sort({ createdAt: -1 })
      .populate("profileId", "name identityNumber")
      .skip(skip)
      .limit(limitNum);

    const doctorIds = [...new Set(appointments.map(a => a.doctorId?.toString()).filter(Boolean))];
    const userIds = [...new Set(appointments.map(a => a.userId?.toString()).filter(Boolean))];

    const [doctors, users] = await Promise.all([
      Employee.find({ _id: { $in: doctorIds } }, { _id: 1, name: 1 }),
      User.find({ _id: { $in: userIds } }, { _id: 1, name: 1, phone: 1, user_code: 1 })
    ]);

    const doctorMap = Object.fromEntries(doctors.map(doc => [doc._id.toString(), doc.name]));
    const userMap = Object.fromEntries(users.map(user => [
      user._id.toString(),
      {
        name: user.name,
        phone: user.phone || "N/A",
        user_code: user.user_code || "N/A",
      },
    ]));

    let enrichedAppointments = appointments.map(a => ({
      ...a._doc,
      doctorName: doctorMap[a.doctorId?.toString()] || "Unknown Doctor",
      userName: userMap[a.userId?.toString()]?.name || "Unknown User",
      userPhone: userMap[a.userId?.toString()]?.phone || "N/A",
      userCode: userMap[a.userId?.toString()]?.user_code || "N/A",
      profileName: a.profileId?.name || "N/A",
      identityNumber: a.profileId?.identityNumber || "",
    }));

    // ✅ Gộp tất cả logic tìm kiếm vào đây
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      enrichedAppointments = enrichedAppointments.filter(a =>
        a.doctorName?.toLowerCase().includes(searchLower) ||
        a.userName?.toLowerCase().includes(searchLower) ||
        a.userPhone?.toLowerCase().includes(searchLower) ||
        a.userCode?.toLowerCase().includes(searchLower) ||
        a.status?.toLowerCase().includes(searchLower) ||
        a.identityNumber?.toLowerCase().includes(searchLower) // ✅ Gộp identityNumber
      );
    }

    res.status(200).json({
      appointments: enrichedAppointments,
      pagination: {
        total: enrichedAppointments.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(enrichedAppointments.length / limitNum),
      },
    });
  } catch (error) {
    console.error("Error in getAllAppointments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



exports.getProfileDetail = async (req, res) => {
  try {
    const { profileId } = req.params;

    // Populate doctorId, medicine, and service fields
    const profile = await Profile.findById(profileId)
      .populate("doctorId", "name")  // Populate doctorId to show the doctor's name
      .populate("medicine", "name")  // Populate medicine field and show name
      .populate("service", "name");  // Populate service field and show name

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error("Error fetching profile detail:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Tạo cuộc hẹn mới
exports.createAppointment = async (req, res) => {
  try {
      const data = { ...req.body };

      if (!data.timeSlot || !data.timeSlot.startTime || !data.timeSlot.endTime) {
        return res.status(400).json({ message: "Missing timeSlot or invalid structure." });
      }
    // ✅ Log kiểm tra
    //console.log("👨‍⚕️ doctorId:", data.doctorId);
    //console.log("📅 Ngày hẹn:", data.appointmentDate);

    // ✅ Kiểm tra doctorId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(data.doctorId)) {
      return res.status(400).json({ message: "Invalid doctorId format." });
    }

    // ✅ Chuẩn hóa ngày tìm schedule
    const appointmentDate = new Date(data.appointmentDate);
    const y = appointmentDate.getFullYear();
    const m = appointmentDate.getMonth();
    const d = appointmentDate.getDate();

    const startOfDay = new Date(y, m, d, 0, 0, 0, 0);
    const endOfDay = new Date(y, m, d, 23, 59, 59, 999);


    // ✅ Tìm schedule chính xác
    const doctorSchedule = await Schedule.findOne({
      employeeId: new mongoose.Types.ObjectId(data.doctorId),
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    //console.log("📅 Schedule tìm được:", doctorSchedule?.date);
    if (doctorSchedule) {
      doctorSchedule.timeSlots.forEach((slot, i) => {
        //console.log(`⏰ Slot ${i + 1}:`, slot.startTime, "-", slot.endTime, "|", slot.status);
      });
    }

    const selectedSlot = doctorSchedule?.timeSlots.find(slot =>
      new Date(slot.startTime).getTime() === new Date(data.timeSlot.startTime).getTime() &&
      new Date(slot.endTime).getTime() === new Date(data.timeSlot.endTime).getTime()
    );

    if (!selectedSlot) {
      console.warn("❌ Không tìm thấy slot tương ứng trong Schedule.");
    } else {
      if (selectedSlot.status === 'Booked') {
        return res.status(400).json({
          message: "The selected time slot is already booked. Please choose another time."
        });
      }

      // ✅ Đánh dấu đã đặt
      selectedSlot.status = 'Booked';
      await doctorSchedule.save();
      //console.log("✅ Đã cập nhật status = Booked cho slot.");
    }

    // ✅ Tạo cuộc hẹn như cũ
// ✅ Tạo cuộc hẹn
const newAppointment = new Appointment({
  appointmentDate: data.appointmentDate,
  department: data.department,
  doctorId: data.doctorId,
  timeSlot: {
    startTime: data.timeSlot.startTime,
    endTime: data.timeSlot.endTime,
    status: 'Booked',
  },
  type: data.type || "Offline",
  status: data.status || "Booked",
  reminderSent: data.reminderSent || false,
  profileId: data.profileId,
  userId: data.userId,
});


    await newAppointment.save();
    res.status(201).json(newAppointment);

  } catch (error) {
    console.error("Lỗi tạo appointment:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};







// Cập nhật lịch hẹn
exports.updateAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const newData = { ...req.body };

    const existingAppointment = await Appointment.findById(appointmentId);
    if (!existingAppointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    console.log("✏️ Updating appointment:", appointmentId);
    console.log("📅 New appointment date:", newData.appointmentDate);
    console.log("⏰ New timeSlot:", newData.timeSlot);

    // ✅ BƯỚC 1: Trả lại slot cũ (nếu có timeSlot cũ)
    if (existingAppointment.timeSlot?.startTime && existingAppointment.timeSlot?.endTime) {
      const oldDate = new Date(existingAppointment.appointmentDate);
      const startOfOldDay = new Date(oldDate.setHours(0, 0, 0, 0));
      const endOfOldDay = new Date(oldDate.setHours(23, 59, 59, 999));

      const oldSchedule = await Schedule.findOne({
        employeeId: existingAppointment.doctorId,
        date: { $gte: startOfOldDay, $lte: endOfOldDay },
      });

      if (oldSchedule) {
        const oldSlot = oldSchedule.timeSlots.find(
          slot =>
            new Date(slot.startTime).getTime() === new Date(existingAppointment.timeSlot.startTime).getTime() &&
            new Date(slot.endTime).getTime() === new Date(existingAppointment.timeSlot.endTime).getTime()
        );
        if (oldSlot) {
          oldSlot.status = "Available";
          await oldSchedule.save();
          console.log("🔄 Slot cũ đã chuyển về Available");
        }
      }
    }

    // ✅ BƯỚC 2: Đánh dấu slot mới là Booked
    if (newData.timeSlot?.startTime && newData.timeSlot?.endTime) {
      const newDate = new Date(newData.appointmentDate);
      const startOfNewDay = new Date(newDate.setHours(0, 0, 0, 0));
      const endOfNewDay = new Date(newDate.setHours(23, 59, 59, 999));

      const newSchedule = await Schedule.findOne({
        employeeId: newData.doctorId || existingAppointment.doctorId,
        date: { $gte: startOfNewDay, $lte: endOfNewDay },
      });

      if (newSchedule) {
        const newSlot = newSchedule.timeSlots.find(
          slot =>
            new Date(slot.startTime).getTime() === new Date(newData.timeSlot.startTime).getTime() &&
            new Date(slot.endTime).getTime() === new Date(newData.timeSlot.endTime).getTime()
        );
        if (newSlot) {
          if (newSlot.status === "Booked") {
            return res.status(400).json({ message: "The selected time slot is already booked." });
          }
          newSlot.status = "Booked";
          await newSchedule.save();
          console.log("✅ Slot mới đã được đánh dấu là Booked");
        } else {
          console.warn("⚠️ Không tìm thấy slot mới trong Schedule.");
        }
      } else {
        console.warn("⚠️ Không tìm thấy Schedule tương ứng cho ngày mới.");
      }
    }

    // ✅ BƯỚC 3: Cập nhật thông tin appointment
    const updated = await Appointment.findByIdAndUpdate(appointmentId, newData, { new: true });

    res.json(updated);
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật cuộc hẹn:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};


// Xóa lịch hẹn và cập nhật lại trạng thái slot
exports.deleteAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    //console.log("🗑 Deleting appointment:", appointmentId);

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    // ✅ Log chi tiết appointment
    //console.log("👨‍⚕️ Doctor ID:", appointment.doctorId);
    //console.log("📅 Appointment date:", appointment.appointmentDate);
    //console.log("📄 Appointment full object:\n", appointment);

    const { doctorId, appointmentDate, timeSlot } = appointment;

    if (!timeSlot || !timeSlot.startTime || !timeSlot.endTime) {
      console.warn("⚠️ Không có thông tin timeSlot để cập nhật.");
    } else {
      // ✅ Xác định ngày để tìm Schedule
      const dateObj = new Date(appointmentDate);
      const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
      const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));

      const schedule = await Schedule.findOne({
        employeeId: doctorId,
        date: { $gte: startOfDay, $lte: endOfDay },
      });

      if (schedule) {
        const slotToUpdate = schedule.timeSlots.find(
          (slot) =>
            new Date(slot.startTime).getTime() === new Date(timeSlot.startTime).getTime() &&
            new Date(slot.endTime).getTime() === new Date(timeSlot.endTime).getTime()
        );

        if (slotToUpdate) {
          slotToUpdate.status = "Available";
          await schedule.save();
          //console.log("✅ Slot status set back to 'Available'");
        } else {
          console.warn("⚠️ Không tìm thấy slot tương ứng trong Schedule.");
        }
      } else {
        console.warn("⚠️ Không tìm thấy Schedule tương ứng.");
      }
    }

    // ✅ Xóa appointment
    await Appointment.findByIdAndDelete(appointmentId);
    //console.log("🗑 Appointment đã bị xóa.");
    res.json({ message: "Appointment deleted and schedule updated successfully" });
  } catch (error) {
    console.error("❌ Lỗi khi xóa cuộc hẹn:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};








// Lấy tất cả bác sĩ có role = 'Doctor' và thêm department, lọc theo department và ngày nếu có
exports.getAllDoctors = async (req, res) => {
  try {
    const { department, date } = req.query;
    const query = { role: "Doctor", status: "active" };

    // ✅ Lọc theo khoa (ObjectId)
    if (department) {
      if (!mongoose.Types.ObjectId.isValid(department)) {
        return res.status(400).json({ message: "Invalid department ID" });
      }
      query.department = new mongoose.Types.ObjectId(department);
    }

    // Nếu có ngày -> tìm lịch có slot Available
    if (date) {
      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const scheduleQuery = {
        date: { $gte: startOfDay, $lte: endOfDay },
        timeSlots: { $elemMatch: { status: "Available" } },
      };

      // ⚠️ Nếu có department => lọc thêm ở Schedule luôn
      if (department) {
        if (!mongoose.Types.ObjectId.isValid(department)) {
          return res.status(400).json({ message: "Invalid department ID" });
        }
        scheduleQuery.department = new mongoose.Types.ObjectId(department);
        query.department = scheduleQuery.department; // lọc ở employee luôn
      }

      const schedules = await Schedule.find(scheduleQuery);
      const availableDoctorIds = schedules
        .map((s) => s.employeeId?.toString())
        .filter(Boolean);

      if (availableDoctorIds.length === 0) {
        return res.status(200).json([]); // No available doctors for that date
      }

      query._id = { $in: availableDoctorIds }; // Filter doctors based on the available schedules
    }

    const doctors = await Employee.find(query, {
      _id: 1,
      name: 1,
      department: 1,
    }).populate("department", "name"); // (tuỳ chọn) nếu bạn muốn trả cả tên khoa

    res.status(200).json(doctors);
  } catch (error) {
    console.error("Error in getAllDoctors:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




// Lấy danh sách tất cả department (không trùng)
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find({}, { _id: 1, name: 1 });
    res.status(200).json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Lấy danh sách tất cả user
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, { _id: 1, name: 1, phone: 1, user_code: 1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Lấy profiles theo userId
exports.getProfilesByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const profiles = await Profile.find({ userId });
    res.status(200).json(profiles);
  } catch (error) {
    console.error("Error fetching profiles:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getProfilesByUser2 = async (req, res) => {
  try {
    const userId = req.params.userId;
    const profiles = await Profile.find({ identityNumber: userId });
    console.log(profiles.length);
    let userIdOfProfile = "";
    if (profiles.length > 0) {
      userIdOfProfile = profiles[0].userId;
    } else {
      console.log("Không tìm thấy profile nào.");
    }
    res.status(200).json({ profiles: profiles, uid: userIdOfProfile });
  } catch (error) {
    console.error("Error fetching profiles:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Lấy schedules theo doctorId
exports.getDoctorSchedules = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ message: "Missing doctorId or date" });
    }

    const targetDate = new Date(date);

    // ✅ Start and end of day in local time
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    //console.log("🕒 Searching schedules for doctor:", doctorId);
    //console.log("📆 Between:", startOfDay.toISOString(), endOfDay.toISOString());

    const schedules = await Schedule.find({
      employeeId: doctorId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    res.status(200).json(schedules);
  } catch (err) {
    console.error("❌ Error fetching schedules:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



// Tạo profile mới
exports.createProfile = async (req, res) => {
  try {
    let { userId, name, gender, dateOfBirth, diagnose, note, issues, doctorId, medicine } = req.body;
    if (!userId || !gender || !dateOfBirth) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (!name) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      name = user.name;
    }
    const profile = new Profile({
      name,
      dateOfBirth,
      gender,
      diagnose: diagnose || "",
      note: note || "",
      issues: issues || "",
      doctorId: doctorId || null,
      medicine: medicine || null,
      userId
    });
    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    console.error("Error creating profile:", error);
    res.status(500).json({ message: "Error creating profile", error: error.message });
  }


};

exports.getProfileByIdentity = async (req, res) => {
  try {
    const { identityNumber } = req.query;
    if (!identityNumber) {
      return res.status(400).json({ message: "Missing identityNumber" });
    }

    const profiles = await Profile.find({ identityNumber });

    if (profiles.length === 0) {
      return res.status(404).json({ message: "No profiles found" });
    }

    res.status(200).json(profiles);
  } catch (err) {
    console.error("Error fetching profiles:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getProfilesByUser2 = async (req, res) => {
  try {
    const userId = req.params.userId;
    const profiles = await Profile.find({ identityNumber: userId });
    console.log(profiles.length);
    let userIdOfProfile = "";
    if (profiles.length > 0) {
      userIdOfProfile = profiles[0].userId;
    } else {
      console.log("Không tìm thấy profile nào.");
    }
    res.status(200).json({ profiles: profiles, uid: userIdOfProfile });
  } catch (error) {
    console.error("Error fetching profiles:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};