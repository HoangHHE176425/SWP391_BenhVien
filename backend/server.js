// Load environment variables early
require("dotenv").config();
const cron = require("node-cron");
const autoMarkAbsent = require('./utils/autoMarkAbsentJob');
// Import packages
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");

// App initialization
const app = express();
const connectDb = require("./config/db");

// CORS configuration
const corsOptions = {
  origin: ["http://localhost:5173"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Middleware setup
app.use(morgan("dev"));
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/user", require("./routers/User/user.route"));
// app.use("/api/admin", require("./routers/Admin/admin.route"));
app.use("/api/auth", require("./routers/auth/auth.route"));
app.use("/api/doctor", require("./routers/Doctor/doctor.route"));
app.use("/api/receptionist", require("./routers/Admin/blog.route"));
app.use("/api/receptionist", require("./routers/Receptionist/news.route"));
app.use("/api/receptionist", require("./routers/Receptionist/medicalrecord.route"));
app.use("/api/receptionist", require("./routers/Receptionist/medicine.route"));
app.use("/api/work-schedule", require("./routers/Doctor/workschedule.route"));
app.use("/api/receptionist", require("./routers/Receptionist/receptionist.route"));
app.use("/api/receptionist/blog", require("./routers/Admin/blog.route"));
app.use("/api/receptionist/news", require("./routers/Receptionist/news.route"));
app.use("/api/receptionist/medical-record", require("./routers/Receptionist/medicalrecord.route"));
app.use("/api/attendance", require("./routers/Doctor/attendance.routes"));
app.use("/api/attendance", require("./routers/Receptionist/attendance.route"));
app.use("/api/attendance/accountant", require("./routers/accountant/accountantAttendance.route"));
app.use("/api/pharmacist/accountant", require("./routers/pharmacist/pharmacistAttendance.route"));
app.use("/api/hrmanager/accountant", require("./routers/hrmanager/hrmanagerAttendance.route"));
app.use("/api/record", require("./routers/record/record.route"));
app.use("/api/applications", require("./routers/Doctor/sendApplication.routes"));
app.use("/api/applications", require("./routers/hrmanager/SendApplicationManager.route"));
// Routers import
const userRouter = require("./routers/User/user.route");
const userMedicalProfile = require("./routers/User/userMedicalProfile.route");
const workschedule = require("./routers/Doctor/workschedule.route");
// const adminRouter = require("./routers/Admin/admin.route");
const authRouter = require("./routers/auth/auth.route");
const doctorRouter = require("./routers/Doctor/doctor.route");
const receptionistRouter = require("./routers/Receptionist/receptionist.route");
const userProfileRouter = require("./routers/User/profile.route");
const adminUserManagerRouter = require("./routers/Admin/adminUserManager.route");
const adminEmployeeManagerRouter = require("./routers/Admin/adminEmployeeManager.route");
const adminStatsRouter = require("./routers/Admin/adminDashboard.route");
// 15-7
const foodrouter = require("./routers/User/api.food");
const scheduleRouter = require('./routers/hrmanager/schedule.route');
// Mount routers
app.use("/api/user", userRouter);
app.use("/api/user-profile", userMedicalProfile);
app.use("/api/work-schedule", workschedule);
// app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/receptionist", receptionistRouter);
app.use("/api/admin", adminUserManagerRouter);
app.use("/api/admin", adminEmployeeManagerRouter);
app.use("/api/admin", adminStatsRouter);
// 15-7
app.use("/api/food", foodrouter);
app.use(
  "/api/appointmentScheduleManagement",
  require("./routers/Receptionist/appointmentScheduleManagement.route")
);
app.use("/api/users", require("./routers/Receptionist/userManagement.route"));
app.use(
  "/api/departments",
  require("./routers/Admin/departmentManagement.route")
);
app.use("/api/profile", userProfileRouter);
app.use('/api/receptionist', scheduleRouter);
app.use("/api/services", require("./routers/Service/service.route"));
app.use("/api", require("./routers/medicine/medicine.route"));
app.use("/api/apm", require("./routers/appointment/appointment.routes"));

// app.use("/api", require("./routers/appointment/appointment.routes"));
app.use("/api/attendance/doctor", require("./routers/Doctor/attendance.routes"));
const PORT = process.env.PORT || 9999;

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });

    cron.schedule("5 8 * * *", () => {
      console.log("🔔 Running autoMarkAbsent...");
      autoMarkAbsent();
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
  });
