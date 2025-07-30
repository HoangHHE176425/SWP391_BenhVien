const express = require("express");
const { RecordService } = require("../../controller/record/record.service");
const router = express.Router();

const recordService = new RecordService();

router.get("/", (req, res) => recordService.getRecords(req, res));

router.post("/", (req, res) => recordService.createRecord(req, res));

router.get("/:id", (req, res) => recordService.getRecordById(req, res));

router.put("/:id", (req, res) => recordService.updateRecord(req, res));

router.delete("/:id", (req, res) => recordService.deleteRecord(req, res));

module.exports = router;