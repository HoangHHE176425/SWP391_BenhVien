const express = require("express");
const staffController = require("../../controller/staff/scheduleController");
const { authStaffMiddleware } = require("../../middleware/auth.middleware");

const scheduleRouter = express.Router();

scheduleRouter.post('/schedule-management/schedule', authStaffMiddleware, staffController.createSchedule);
scheduleRouter.get('/schedule-management/schedule', authStaffMiddleware, staffController.getSchedules);
scheduleRouter.put('/schedule-management/schedule/:id', authStaffMiddleware, staffController.updateSchedule);
scheduleRouter.delete('/schedule-management/schedule/:id', authStaffMiddleware, staffController.deleteSchedule);

scheduleRouter.get('/departments', authStaffMiddleware, staffController.getAllDepartments);
scheduleRouter.get('/employees', authStaffMiddleware, staffController.getEmployeesByDepartment);

module.exports = scheduleRouter;
