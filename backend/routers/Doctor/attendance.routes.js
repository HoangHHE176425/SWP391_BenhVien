// routes/attendance.routes.js
const express = require('express');
const router = express.Router();
const Attendance = require('../../models/Attendance');

// POST /api/attendance/checkin
router.post('/checkin', async (req, res) => {
  const { employeeId } = req.body;
  const today = new Date();
  const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  try {
    const existing = await Attendance.findOne({ employeeId, date: dateOnly });
    if (existing) return res.status(400).json({ message: 'Already checked in today' });

    const attendance = new Attendance({
      employeeId,
      checkInTime: new Date(),
      date: dateOnly,
      status: 'Present',
    });

    await attendance.save();
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/attendance/checkout
router.put('/checkout', async (req, res) => {
  const { employeeId } = req.body;
  const today = new Date();
  const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  try {
    const record = await Attendance.findOne({ employeeId, date: dateOnly });
    if (!record) return res.status(404).json({ message: 'No check-in found for today' });

    record.checkOutTime = new Date();
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/status/:employeeId (optional)
router.get('/status/:employeeId', async (req, res) => {
  const { employeeId } = req.params;
  const today = new Date();
  const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  try {
    const record = await Attendance.findOne({ employeeId, date: dateOnly });
    res.json(record || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
