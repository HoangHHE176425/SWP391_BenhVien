// routes/attendance.routes.js
const express = require('express');
const router = express.Router();
const Attendance = require('../../models/Attendance');

// ✅ POST /api/attendance/checkin – cho phép nhiều lần check-in trong ngày
router.post('/checkin', async (req, res) => {
  const { employeeId } = req.body;

  if (!employeeId) {
    return res.status(400).json({ message: 'employeeId is required' });
  }

  try {
    const attendance = new Attendance({
      employeeId,
      checkInTime: new Date(),
      date: new Date(), // vẫn lưu ngày để dễ thống kê
      status: 'Present',
    });

    await attendance.save();
    res.status(201).json({ message: 'Checked in successfully', attendance });
  } catch (err) {
    console.error('❌ Check-in error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ PUT /api/attendance/checkout – check-out bản ghi gần nhất chưa checkout
router.put('/checkout', async (req, res) => {
  const { employeeId } = req.body;

  if (!employeeId) {
    return res.status(400).json({ message: 'employeeId is required' });
  }

  try {
    const record = await Attendance.findOne({
      employeeId,
      checkOutTime: { $exists: false },
    }).sort({ checkInTime: -1 });

    if (!record) {
      return res.status(404).json({ message: 'No check-in found to check out' });
    }

    record.checkOutTime = new Date();
    await record.save();
    res.json({ message: 'Checked out successfully', attendance: record });
  } catch (err) {
    console.error('❌ Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET /api/attendance/status/:employeeId – lấy bản ghi gần nhất trong ngày
router.get('/status/:employeeId', async (req, res) => {
  const { employeeId } = req.params;
  const today = new Date();
  const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  try {
    const record = await Attendance.findOne({
      employeeId,
      date: { $gte: dateOnly },
    }).sort({ checkInTime: -1 });

    res.json(record || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
