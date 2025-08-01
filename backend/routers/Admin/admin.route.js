const express = require("express");
const adminRouter = express.Router();

const {
  getUserAccs,
  editUsers,
  delUsers,
  createUser,
  getEmployees,
  editEmployees,
  delEmployees,
  createEmployees,
  changeStatus,
  getAllDepartments,
  getUserLog,
  getEmployeeLog,
} = require("../../controller/admin/adminService");

const {
  getAppointmentTypeStats,
  getRevenueByMethod,
  getDashboardSummaries,
  getUserRegistrationTrend,
  getAppointmentTrend,
  getRevenueTrend,
  getUserGrowthStats,
  getEmployeeStats,
} = require("../../controller/admin/statisService");

const {
  getAllAttendance,
  updateNote,
  createAttendance,
  getAttendConfig,
  updateAttendConfig,
} = require("../../controller/admin/attendanceService");

const { authAdminMiddleware } = require("../../middleware/auth.middleware");


// ---------------------- USER MANAGEMENT ----------------------

// 🔐 Gắn middleware để req.user._id tồn tại trong controller (ghi log được)
adminRouter.get("/users", authAdminMiddleware, getUserAccs);
adminRouter.post("/createUser", authAdminMiddleware, createUser);
adminRouter.put("/updateUser/:id", authAdminMiddleware, editUsers);
adminRouter.put("/changeStatus/:id", authAdminMiddleware, changeStatus);
adminRouter.delete("/delUser/:id", authAdminMiddleware, delUsers);
adminRouter.get("/user-log/:id", authAdminMiddleware, getUserLog);

// ---------------------- EMPLOYEE MANAGEMENT ----------------------

adminRouter.get("/employees", authAdminMiddleware, getEmployees);
adminRouter.post("/createEmp", authAdminMiddleware, createEmployees);
adminRouter.put("/updEmp/:id", authAdminMiddleware, editEmployees);
adminRouter.delete("/delEmp/:id", authAdminMiddleware, delEmployees);
adminRouter.get("/getDepart", authAdminMiddleware, getAllDepartments);
adminRouter.get("/employee-log/:id", authAdminMiddleware, getEmployeeLog);

// ---------------------- STATISTICS ----------------------

adminRouter.get("/user-registrations", authAdminMiddleware, getUserRegistrationTrend);
adminRouter.get("/appointments", authAdminMiddleware, getAppointmentTrend);
adminRouter.get("/revenue", authAdminMiddleware, getRevenueTrend);
adminRouter.get("/appointment-types", authAdminMiddleware, getAppointmentTypeStats);
adminRouter.get("/revenue-methods", authAdminMiddleware, getRevenueByMethod);
adminRouter.get("/summaries", authAdminMiddleware, getDashboardSummaries);
adminRouter.get("/user-growth-stats", authAdminMiddleware, getUserGrowthStats);
adminRouter.get("/employee-stats", authAdminMiddleware, getEmployeeStats);

// ---------------------- ATTENDANCE ----------------------

adminRouter.get("/attend", authAdminMiddleware, getAllAttendance);
adminRouter.put("/attend/note/:id", authAdminMiddleware, updateNote);
adminRouter.post("/createAttend", authAdminMiddleware, createAttendance);
adminRouter.get("/attend-config", authAdminMiddleware, getAttendConfig);
adminRouter.put("/upd-config", authAdminMiddleware, updateAttendConfig);

module.exports = adminRouter;
