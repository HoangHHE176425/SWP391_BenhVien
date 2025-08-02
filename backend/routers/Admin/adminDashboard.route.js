const express = require("express");
const router = express.Router();

const {
  getAppointmentTypeStats,
  getRevenueByMethod,
  getDashboardSummaries,
  getUserRegistrationTrend,
  getAppointmentTrend,
  getRevenueTrend,
  getUserGrowthStats,
  getEmployeeStats,
} = require("../../controller/admin/adminDashboard");

const { authAdminMiddleware } = require("../../middleware/auth.middleware");

router.get("/user-registrations", authAdminMiddleware, getUserRegistrationTrend);
router.get("/appointments", authAdminMiddleware, getAppointmentTrend);
router.get("/revenue", authAdminMiddleware, getRevenueTrend);
router.get("/appointment-types", authAdminMiddleware, getAppointmentTypeStats);
router.get("/revenue-methods", authAdminMiddleware, getRevenueByMethod);
router.get("/summaries", authAdminMiddleware, getDashboardSummaries);
router.get("/user-growth-stats", authAdminMiddleware, getUserGrowthStats);
router.get("/employee-stats", authAdminMiddleware, getEmployeeStats);

module.exports = router;
