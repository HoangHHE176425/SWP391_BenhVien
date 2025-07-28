const express = require('express');
const router = express.Router();

const { getAllInvoices, createInvoice, getAllMedicines } = require('../../controller/medicine/medServices');

// Route xử lý GET /invoices
router.get('/invoices', getAllInvoices);
router.post('/invoices', createInvoice);
router.get('/medicines', getAllMedicines);

module.exports = router;

//2, 4, 5
