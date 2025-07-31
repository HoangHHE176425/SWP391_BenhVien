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
} = require("../../controller/receptionist/MedicalRecord");
const {
  authReceptionistMiddleware,
  authMiddleware,
  authUserMiddleware
} = require("../../middleware/auth.middleware");

// Profile Routes
ProfileRouter.get("/profiles", authReceptionistMiddleware, getAllProfile);
ProfileRouter.get("/profiles/user/:user_id", authUserMiddleware, getProfileByUserId);
ProfileRouter.get("/medicines", authReceptionistMiddleware, getAllMedicines);
ProfileRouter.get("/doctors", authReceptionistMiddleware, getDoctors);
ProfileRouter.get("/services", authReceptionistMiddleware, getAllServices);
ProfileRouter.post("/profiles", authReceptionistMiddleware, createProfile);
ProfileRouter.put("/profiles/:profileId", authReceptionistMiddleware, updateProfile);
ProfileRouter.delete("/profiles/:id", authReceptionistMiddleware, deleteProfile);

module.exports = ProfileRouter;