const express = require("express");
const adminRouter = express.Router();
const multer = require("multer");
const path = require("path");

const {
  getAllAttendance,
  updateNote,
  createAttendance,
  getAttendConfig,
  updateAttendConfig,
} = require("../../controller/admin/adminAttendance");

const { authAdminMiddleware } = require("../../middleware/auth.middleware");


adminRouter.get("/attend", authAdminMiddleware, getAllAttendance);
adminRouter.put("/attend/note/:id", authAdminMiddleware, updateNote);
adminRouter.post("/createAttend", authAdminMiddleware, createAttendance);
adminRouter.get("/attend-config", authAdminMiddleware, getAttendConfig);
adminRouter.put("/upd-config", authAdminMiddleware, updateAttendConfig);

module.exports = adminRouter;
