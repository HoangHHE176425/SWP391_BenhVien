const express = require("express");
const medicineService = require('../../controller/receptionist/medicineService');
const receptionistRouter = express.Router();

receptionistRouter.post('/medicines', medicineService.createMedicine);
receptionistRouter.get('/medicinesall', medicineService.getAllMedicines);
receptionistRouter.get('/medicines/:id', medicineService.getMedicineById);
receptionistRouter.put('/medicines/:id', medicineService.updateMedicine);
receptionistRouter.delete('/medicines/:id', medicineService.deleteMedicine);

module.exports = receptionistRouter;