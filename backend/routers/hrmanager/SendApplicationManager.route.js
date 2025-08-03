const express = require('express');
const router = express.Router();
const {
  getApplicationsByReceiver,
  updateApplication,
} = require('../../controller/hrmanager/SendApplicationManager');

const SendApplicationLog = require('../../models/SendApplicationLog');
const { authReceptionistMiddleware } = require('../../middleware/auth.middleware');

router.get('/received/:receiverId', authReceptionistMiddleware, getApplicationsByReceiver);
router.put('/:id', authReceptionistMiddleware, updateApplication);
router.get('/:applicationId/logs', authReceptionistMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.params;

    const logs = await SendApplicationLog.find({ applicationId })
      .populate('employee', 'name role employeeCode')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (err) {
    console.error('❌ Lỗi khi lấy log:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy log.' });
  }
});

module.exports = router;
