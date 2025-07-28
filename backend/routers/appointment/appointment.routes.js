const express = require('express');
const appointmentRouter = express.Router();
const apmServices = require('../../controller/appointment/apmServices');

appointmentRouter.get('/appointments', apmServices.getAllAppointments);

// Lấy tất cả bác sĩ
appointmentRouter.get('/doctors', apmServices.getAllDoctors);
// Tìm kiếm bác sĩ theo tên
appointmentRouter.post('/search', apmServices.searchDoctorsByName);
// Lấy bác sĩ theo phân trang
appointmentRouter.get('/paginated', apmServices.getDoctorsPaginated);
//lay profile theo userid
appointmentRouter.get('/:userId/profiles', apmServices.getProfilesByUserId);

module.exports = appointmentRouter;