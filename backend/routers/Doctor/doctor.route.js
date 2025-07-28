const express = require("express");
const router = express.Router();
const {getAllDoctorsForApm} = require("../../controller/doctor/doctorService");

// Route mẫu
router.get("/", (req, res) => {
  res.send("Doctor route is working!");
}); 
router.get("/doctor", getAllDoctorsForApm);
const profileController = require("../../controller/user/userMedicalProfile.controller");

// Tạo hồ sơ mới
router.post("/", profileController.createProfile);

// Lấy tất cả hồ sơ
router.get("/", profileController.getAllProfiles);

// Lấy hồ sơ theo doctorId
router.get("/all/:doctorId", profileController.getProfilesByDoctor);

// 🔥 Thêm dòng này để lấy hồ sơ theo identityNumber
// router.get("/by-identity/:identityNumber", profileController.getProfileById);

router.get("/by-identity/:identityNumber", profileController.searchByIdentityNumber);

// Lấy hồ sơ theo ID
router.get("/:profileId", profileController.getProfileById);

// Cập nhật hồ sơ theo ID
router.put("/:id", profileController.updateProfileById);

// Xoá hồ sơ theo ID
router.delete("/:id", profileController.deleteProfileById);

module.exports = router;
