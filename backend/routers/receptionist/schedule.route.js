const express = require("express");
const receptionistController = require("../../controller/receptionist/scheduleController");
const { authReceptionistMiddleware } = require("../../middleware/auth.middleware");

const scheduleRouter = express.Router();

scheduleRouter.post('/schedule-management/schedule', authReceptionistMiddleware, receptionistController.createSchedule);
scheduleRouter.get('/schedule-management/schedule', authReceptionistMiddleware, receptionistController.getSchedules);
scheduleRouter.put('/schedule-management/schedule/:id', authReceptionistMiddleware, receptionistController.updateSchedule);
scheduleRouter.delete('/schedule-management/schedule/:id', authReceptionistMiddleware, receptionistController.deleteSchedule);

scheduleRouter.get('/departments', authReceptionistMiddleware, receptionistController.getAllDepartments);
scheduleRouter.get('/employees', authReceptionistMiddleware, receptionistController.getEmployeesByDepartment);
scheduleRouter.get('/schedule-management/schedule-log/:id',authReceptionistMiddleware,receptionistController.getScheduleLogs);
scheduleRouter.put('/schedule-management/schedule/:id/toggle-status',authReceptionistMiddleware,receptionistController.toggleScheduleStatus);
scheduleRouter.get('/employees/all', authReceptionistMiddleware, receptionistController.getAllEmployees);


module.exports = scheduleRouter;
