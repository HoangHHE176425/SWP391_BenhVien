const express = require("express");
const router = express.Router(); 
const multer = require("multer");
const path = require("path");

const {
  getUserAccs,
  editUsers,
  delUsers,
  createUser,
  changeStatus,
  getUserLog,
} = require("../../controller/admin/adminUserController");

const { authAdminMiddleware } = require("../../middleware/auth.middleware");

// ---------------------- USER MANAGEMENT ----------------------
router.get("/users", authAdminMiddleware, getUserAccs);
router.post("/createUser", authAdminMiddleware, createUser);
router.put("/updateUser/:id", authAdminMiddleware, editUsers);
router.put("/changeStatus/:id", authAdminMiddleware, changeStatus);
router.delete("/delUser/:id", authAdminMiddleware, delUsers);
router.get("/user-log/:id", authAdminMiddleware, getUserLog);

module.exports = router;
