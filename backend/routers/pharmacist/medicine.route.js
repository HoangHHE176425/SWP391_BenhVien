const express = require("express");
const medicineService = require('../../controller/pharmacist/medicineService');
const router = express.Router();

router.post('/medicines', medicineService.createMedicine);
router.get('/medicinesall', medicineService.getAllMedicines);
router.get('/medicines/:id', medicineService.getMedicineById);
router.put('/medicines/:id', medicineService.updateMedicine);
router.put('/medicines/:id/disable', medicineService.disableMedicine);
router.post('/transactions', medicineService.processPharmacyTransaction);
router.get('/transactions', medicineService.getTransactionHistory);
router.get('/patients', medicineService.getPatientsByCCCD);

module.exports = router;