const express = require('express');
const ProfileRouter = express.Router();
const {
  getAllProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  getAllMedicines,
  getDoctors,
  getAllServices,
  getProfileByUserId
} = require("../../controller/staff/MedicalRecord");
const {
  authStaffMiddleware,
  authMiddleware,
  authUserMiddleware
} = require("../../middleware/auth.middleware");

// Profile Routes
ProfileRouter.get("/profiles", authStaffMiddleware, getAllProfile);
ProfileRouter.get("/profiles/user/:user_id", authUserMiddleware, getProfileByUserId);
ProfileRouter.get("/medicines", authStaffMiddleware, getAllMedicines);
ProfileRouter.get("/doctors", authStaffMiddleware, getDoctors);
ProfileRouter.get("/services", authStaffMiddleware, getAllServices);
ProfileRouter.post("/profiles", authStaffMiddleware, createProfile);
ProfileRouter.put("/profiles/:profileId", authStaffMiddleware, updateProfile);
ProfileRouter.delete("/profiles/:id", authStaffMiddleware, deleteProfile);

module.exports = ProfileRouter;