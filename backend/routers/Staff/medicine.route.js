const express = require("express");
const medicineService = require('../../controller/staff/medicineService');
const staffRouter = express.Router();

staffRouter.post('/medicines', medicineService.createMedicine);
staffRouter.get('/medicinesall', medicineService.getAllMedicines);
staffRouter.get('/medicines/:id', medicineService.getMedicineById);
staffRouter.put('/medicines/:id', medicineService.updateMedicine);
staffRouter.put('/medicines/:id/disable', medicineService.disableMedicine);

module.exports = staffRouter;