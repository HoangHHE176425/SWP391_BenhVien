const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const appointmentController = require("../../controller/staff/appointmentScheduleManagementController");

router.get("/", appointmentController.getAllAppointments);
router.post("/", appointmentController.createAppointment);
router.put("/:id", appointmentController.updateAppointment);
router.delete("/:id", appointmentController.deleteAppointment);

router.get("/doctors", appointmentController.getAllDoctors);
router.get("/departments", appointmentController.getAllDepartments);
router.get("/users", appointmentController.getAllUsers);
router.get("/profiles/:userId", appointmentController.getProfilesByUser);
router.get("/profile/:userId", appointmentController.getProfilesByUser2);
router.get("/schedules/:doctorId", appointmentController.getDoctorSchedules);
router.post("/profiles", appointmentController.createProfile);
router.get('/profiles/:userId', appointmentController.getProfilesByUser);
router.get("/profileByIdentity", appointmentController.getProfileByIdentity);
router.get("/profile/detail/:profileId", appointmentController.getProfileDetail);

module.exports = router;
