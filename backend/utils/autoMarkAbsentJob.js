const cron = require("node-cron");
const dayjs = require("dayjs");
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const AttendanceConfig = require("../models/AttendanceConfig");

const autoMarkAbsentJob = () => {
  // ⚠️ Cron job chạy lúc 08:31 sáng mỗi ngày
  cron.schedule("31 8 * * *", async () => {
    try {
      const todayStart = dayjs().startOf("day");

      // 👉 Lấy deadline từ config trong DB
      const config = await AttendanceConfig.findOne();
      const CHECK_IN_DEADLINE = config?.checkInDeadline || "08:30";

      const deadlineTime = dayjs(
        `${todayStart.format("YYYY-MM-DD")}T${CHECK_IN_DEADLINE}`
      );

      const employees = await Employee.find();

      for (const emp of employees) {
        const existing = await Attendance.findOne({
          employeeId: emp._id,
          date: todayStart.toDate(),
        });

        if (!existing) {
          await Attendance.create({
            employeeId: emp._id,
            date: todayStart.toDate(),
            status: "Absent",
            checkInTime: null,
            checkOutTime: null,
            notes: `Did not check in before deadline (${CHECK_IN_DEADLINE})`,
          });

          console.log(
            `❌ ${emp.name} bị đánh dấu vắng mặt vì không điểm danh trước ${CHECK_IN_DEADLINE}`
          );
        }
      }

      console.log(
        `[CRON] ✅ Đã kiểm tra vắng mặt lúc ${new Date().toLocaleString()}`
      );
    } catch (err) {
      console.error("❌ Lỗi cron autoMarkAbsent:", err);
    }
  });
};

module.exports = autoMarkAbsentJob;
