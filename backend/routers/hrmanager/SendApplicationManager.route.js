const express = require('express');
const router = express.Router();
const {getApplicationsByReceiver,updateApplication,} = require('../../controller/hrmanager/SendApplicationManager');
const { authReceptionistMiddleware } = require('../../middleware/auth.middleware');

router.get('/received/:receiverId', authReceptionistMiddleware, getApplicationsByReceiver);
router.put('/:id', authReceptionistMiddleware, updateApplication);

module.exports = router;
