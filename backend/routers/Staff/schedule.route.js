const express = require("express");
const staffController = require("../../controller/staff/scheduleController");

const scheduleRouter = express.Router();

// Schedule routes
scheduleRouter.post('/schedule', staffController.createSchedule);
scheduleRouter.get('/schedule', staffController.getSchedules);
scheduleRouter.put('/schedule/:id', staffController.updateSchedule);
scheduleRouter.delete('/schedule/:id', staffController.deleteSchedule);

// Department & employee routes (lấy từ cùng controller)
scheduleRouter.get('/departments', staffController.getAllDepartments);
scheduleRouter.get('/employees', staffController.getEmployeesByDepartment);

module.exports = scheduleRouter;
