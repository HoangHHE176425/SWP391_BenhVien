const mongoose = require("mongoose");
const dayjs = require("dayjs");
const Attendance = require("../../models/Attendance");
const Employee = require("../../models/Employee");
const Schedule = require("../../models/Schedule");

// ✅ Check-in: tạo bản ghi mới nếu hợp lệ
// ✅ Check-in: tạo bản ghi mới nếu hợp lệ
// ✅ Check-in
exports.checkIn = async (req, res) => {
  try {
    const { employeeId, scheduleId, department, timeSlots, date, ipAddress, location } = req.body;

    // Kiểm tra thông tin bắt buộc
    if (!employeeId || !scheduleId || !department || !date || !timeSlots || !Array.isArray(timeSlots)) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc để điểm danh" });
    }

    const now = dayjs();

    // Không cho check-in nếu đã quá giờ làm (giờ kết thúc của slot muộn nhất)
    const latestEnd = Math.max(...timeSlots.map(slot => new Date(slot.endTime).getTime()));
    if (now.valueOf() > latestEnd) {
      return res.status(400).json({ message: "Đã quá giờ làm, không thể check-in." });
    }

    // Tránh double check-in
    const existing = await Attendance.findOne({ employeeId, scheduleId });
    if (existing) {
      return res.status(400).json({ message: "Bạn đã check-in ca này rồi." });
    }

    // ✅ Lấy giờ bắt đầu sớm nhất trong timeSlots
    const earliestSlot = timeSlots.reduce((min, slot) =>
      new Date(slot.startTime) < new Date(min.startTime) ? slot : min
    );
    const startTime = dayjs(earliestSlot.startTime);
    const graceUntil = startTime.add(1, "minute");

    // 🕒 Log thời gian để debug
    console.log("🕒 checkInTime:", now.format("HH:mm:ss"));
    console.log("🕒 startTime:", startTime.format("HH:mm:ss"));
    console.log("🕒 graceUntil:", graceUntil.format("HH:mm:ss"));

    // ✅ Gán status
    const status = now.isAfter(graceUntil) ? "Late-Arrival" : "Present";

    // ✅ Tạo bản ghi chấm công
    const newAttendance = new Attendance({
      employeeId,
      scheduleId,
      department,
      timeSlots,
      date: new Date(date),
      checkInTime: now.toDate(),
      ipAddress: ipAddress || req.ip,
      location: location || null,
      status,
    });

    await newAttendance.save();
    return res.status(201).json({ message: "✅ Check-in thành công", attendance: newAttendance });
  } catch (err) {
    console.error("Lỗi check-in:", err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// ✅ Check-out
// ✅ Check-out
exports.checkOut = async (req, res) => {
  try {
    const { employeeId, scheduleId, ipAddress, location } = req.body;

    if (!employeeId || !scheduleId) {
      return res.status(400).json({ message: "Thiếu employeeId hoặc scheduleId" });
    }

    const attendance = await Attendance.findOne({
      employeeId,
      scheduleId,
      checkOutTime: { $exists: false },
    });

    if (!attendance) {
      return res.status(404).json({
        message: "Không tìm thấy bản ghi cần check-out (bạn đã check-in chưa?)",
      });
    }

    // Không cho check-out nếu đã bị Missed-Checkout
    if (attendance.status === "Missed-Checkout" || attendance.status === "Absent") {
      return res.status(400).json({
        message: "Bạn đã quá thời gian cho phép check-out.",
      });
    }

    const now = dayjs();

    // ✅ Tính thời điểm kết thúc ca + 10 phút
    const latestSlot = attendance.timeSlots.reduce((max, slot) =>
      new Date(slot.endTime) > new Date(max.endTime) ? slot : max
    );
    const endTime = dayjs(latestSlot.endTime);
    const grace = 10; // phút

    // Nếu hiện tại đã quá thời gian cho phép check-out thì từ chối
    if (now.isAfter(endTime.add(grace, "minute"))) {
      attendance.status = "Absent"; // Nếu muốn đánh dấu luôn
      await attendance.save();
      return res.status(400).json({
        message: "Đã quá 10 phút sau giờ kết thúc. Không thể check-out.",
      });
    }

    attendance.checkOutTime = now.toDate();
    if (ipAddress) attendance.ipAddress = ipAddress;
    if (location) attendance.location = location;

    // ✅ Gán trạng thái phù hợp
    const early = now.isBefore(endTime.subtract(1, "minute"));
    const late = now.isAfter(endTime.add(1, "minute"));

    if (early) {
      attendance.status = "Left-Early";
    } else if (late) {
      attendance.status = "Left-Late";
    } else {
      if (attendance.status !== "Late-Arrival") {
        attendance.status = "Present";
      }
    }

    await attendance.save();
    return res.status(200).json({
      message: "✅ Check-out thành công",
      attendance,
    });
  } catch (err) {
    console.error("Lỗi check-out:", err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};




// ✅ Lấy toàn bộ chấm công của một nhân viên
exports.getAttendanceByEmployee = async (req, res) => {
  const { employeeId } = req.params;
  try {
    await generateAbsentRecords();
    const records = await Attendance.find({ employeeId }).sort({ date: -1 });

    if (!records.length) return res.status(404).json({ message: "Không có bản ghi" });

    // ✅ Cập nhật Missed-Checkout nếu cần
    for (const att of records) {
      await updateToAbsentIfNoCheckout(att);
    }

    res.status(200).json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};


// ✅ Lấy lịch sử chấm công (mới nhất -> cũ)
exports.getAttendanceHistory = async (req, res) => {
  const { employeeId } = req.params;
  try {
    await generateAbsentRecords();
    const records = await Attendance.find({ employeeId });

    for (const att of records) {
      await updateToAbsentIfNoCheckout(att);
    }

    res.status(200).json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};



// ✅ Lấy toàn bộ chấm công
exports.getAllAttendance = async (req, res) => {
  try {
    await generateAbsentRecords();
    const records = await Attendance.find().sort({ date: -1 });

    if (!records.length) {
      return res.status(404).json({ message: "Không có bản ghi nào" });
    }

    for (const att of records) {
      await updateToAbsentIfNoCheckout(att);
    }

    return res.status(200).json(records);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};


// ✅ Lấy lịch hôm nay của chính mình
exports.getMyTodaySchedule = async (req, res) => {
  try {
    const employeeId = req.user?.userId;
    if (!employeeId) return res.status(401).json({ message: "Unauthorized" });

    const today = {
      $gte: dayjs().startOf("day").toDate(),
      $lte: dayjs().endOf("day").toDate(),
    };

    const schedules = await Schedule.find({ employeeId, date: today })
      .populate("department");

    return res.status(200).json(schedules);
  } catch (error) {
    console.error("Lỗi lấy lịch hôm nay:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// ✅ Lấy toàn bộ lịch của nhân viên đang đăng nhập
exports.getMySchedule = async (req, res) => {
  try {
    const employeeId = req.user?.userId;
    if (!employeeId) return res.status(401).json({ message: "Unauthorized" });

    const schedules = await Schedule.find({ employeeId })
      .populate("department")
      .sort({ date: 1 });

    return res.status(200).json(schedules);
  } catch (error) {
    console.error("Lỗi lấy lịch:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// ✅ Lấy lịch hôm nay cho nhân viên cụ thể (dành cho lễ tân / admin)
exports.getTodaySchedule = async (req, res) => {
  const { employeeId } = req.params;
  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  try {
    const schedules = await Schedule.find({
      employeeId,
      date: todayStr,
    }).populate("department");
    res.status(200).json(schedules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// ✅ Lấy tất cả lịch làm việc theo employeeId
exports.getAllSchedules = async (req, res) => {
  const { employeeId } = req.params;
  const data = await Schedule.find({ employeeId }).populate("department");
  res.status(200).json({ schedules: data });
};


exports.getDoctorSchedules = async (req, res) => {
  const { employeeId } = req.params;
  try {
    const schedules = await Schedule.find({ employeeId }).populate("department").lean();
    res.status(200).json({ schedules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};
exports.getAllAttendance = async (req, res) => {
  try {
    const records = await Attendance.find().sort({ date: -1 });
    res.status(200).json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const updateToAbsentIfNoCheckout = async (attendance) => {
  if (
    attendance?.checkInTime instanceof Date &&
    !attendance.checkOutTime &&
    attendance.status === "Checked-In" &&
    Array.isArray(attendance.timeSlots) &&
    attendance.timeSlots.length > 0
  ) {
    const latestEnd = Math.max(
      ...attendance.timeSlots.map(slot => new Date(slot.endTime).getTime())
    );
    const now = Date.now();
    const grace = 10 * 60 * 1000;

    if (now > latestEnd + grace) {
      attendance.status = "Absent";
      await attendance.save();
      console.log(`Đã chuyển sang Absent do quên check-out: ${attendance.employeeId}`);
    }
  }
};
const generateAbsentRecords = async () => {
  const todayStart = dayjs().startOf("day").toDate();
  const todayEnd = dayjs().endOf("day").toDate();
  const now = Date.now();

  const schedules = await Schedule.find({
    date: { $gte: todayStart, $lte: todayEnd },
  });

  for (const schedule of schedules) {
    const { _id: scheduleId, employeeId, department, timeSlots, date } = schedule;

    if (!timeSlots || timeSlots.length === 0) continue;

    const latestEnd = Math.max(...timeSlots.map(slot => new Date(slot.endTime).getTime()));
    if (now <= latestEnd) continue; // ⏳ Ca chưa kết thúc

    const existing = await Attendance.findOne({ employeeId, scheduleId });
    if (existing) continue; // Đã có bản ghi (check-in hoặc absent)

    const absent = new Attendance({
      employeeId,
      scheduleId,
      department,
      timeSlots,
      date,
      status: "Absent",
    });

    await absent.save();
    console.log(`✅ Tạo bản ghi Absent cho ${employeeId}`);
  }
};

