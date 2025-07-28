const express = require("express");
const router = express.Router();
const { getByDoctor } = require("../../controller/doctor/workschedule");

router.get("/doctor/:id", getByDoctor);

module.exports = router;
