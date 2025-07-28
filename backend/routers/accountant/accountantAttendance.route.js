const express = require('express');
const router = express.Router();
const attendanceController = require("../../controller/staff/attendanceController");

router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.get('/employee/:employeeId', attendanceController.getAttendanceByEmployee);
router.get('/', attendanceController.getAllAttendance);
router.get("/history/:employeeId", attendanceController.getAttendanceHistory);

module.exports = router;
