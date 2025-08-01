const express = require('express');
const router = express.Router();
const attendanceController = require("../../controller/doctor/attendanceDoctor");

router.post('/check-in', attendanceController.checkIn);
router.put('/check-out', attendanceController.checkOut);
router.get('/employee/:employeeId', attendanceController.getAttendanceByEmployee);
router.get('/history/:employeeId', attendanceController.getAttendanceHistory);
router.get('/today-schedule/:employeeId', attendanceController.getTodaySchedule);
router.get('/schedules/all/:employeeId', attendanceController.getAllSchedules);

module.exports = router;
