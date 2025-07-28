// routers/Doctor/service.route.js
const express = require("express");
const router = express.Router();
const Service = require("../../models/Service"); // ← đường dẫn đúng từ thư mục Doctor

// GET /api/services
router.get("/", async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch services" });
    }
});

module.exports = router;
