const express = require('express');
const router = express.Router();

const { createSendApplication, getEmployeeById, getApplicationsBySender } = require('../../controller/doctor/SendApplicationDoctor');

router.post('/', createSendApplication);
router.get('/:id', getEmployeeById);
router.get('/sender/:senderId', getApplicationsBySender);

module.exports = router;
