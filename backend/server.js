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
app.use("/api/admin", require("./routers/Admin/admin.route"));
app.use("/api/auth", require("./routers/auth/auth.route"));
app.use("/api/doctor", require("./routers/Doctor/doctor.route"));
app.use("/api/staff", require("./routers/Staff/blog.route"));
app.use("/api/staff", require("./routers/Staff/news.route"));
app.use("/api/staff", require("./routers/Staff/medicalrecord.route"));
app.use("/api/staff", require("./routers/Staff/medicine.route"));
app.use("/api/work-schedule", require("./routers/Doctor/workschedule.route"));
app.use("/api/staff", require("./routers/Staff/staff.route"));
app.use("/api/staff/blog", require("./routers/Staff/blog.route"));
app.use("/api/staff/news", require("./routers/Staff/news.route"));
app.use("/api/staff/medical-record", require("./routers/Staff/medicalrecord.route"));
app.use("/api/attendance", require("./routers/Doctor/attendance.routes"));
app.use("/api/attendance", require("./routers/Staff/attendance.route"));

// Routers import
const userRouter = require("./routers/User/user.route");
const userMedicalProfile = require("./routers/User/userMedicalProfile.route");
const workschedule = require("./routers/Doctor/workschedule.route");
const adminRouter = require("./routers/Admin/admin.route");
const authRouter = require("./routers/auth/auth.route");
const doctorRouter = require("./routers/Doctor/doctor.route");
const staffRouter = require("./routers/Staff/staff.route");
const userProfileRouter = require("./routers/User/profile.route");
// 15-7
const foodrouter = require("./routers/User/api.food");
const scheduleRouter = require('./routers/Staff/schedule.route');
// Mount routers
app.use("/api/user", userRouter);
app.use("/api/user-profile", userMedicalProfile);
app.use("/api/work-schedule", workschedule);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/staff", staffRouter);

// 15-7
app.use("/api/food", foodrouter);
app.use(
  "/api/appointmentScheduleManagement",
  require("./routers/Staff/appointmentScheduleManagement.route")
);
app.use("/api/users", require("./routers/Staff/userManagement.route"));
app.use(
  "/api/departments",
  require("./routers/Staff/departmentManagement.route")
);
app.use("/api/profile", userProfileRouter);
app.use('/api/staff', scheduleRouter);
app.use("/api/services", require("./routers/Service/service.route"));
app.use("/api", require("./routers/medicine/medicine.route"));
app.use("/api", require("./routers/appointment/appointment.routes"));

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
