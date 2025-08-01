const medicineRepo = require('../../repository/medicine.repository');
const PharmacyTransaction = require('../../models/PharmacyTransaction');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Tạo thuốc mới
const createMedicine = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token" });
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET);
        const payload = { ...req.body, supplier: decode.id, isActive: true };
        const medicine = await medicineRepo.createMedicine(payload);
        res.status(201).json({ message: "Created", medicine });
    } catch (err) {
        res.status(400).json({ message: "Error creating medicine", error: err.message });
    }
};

// Lấy danh sách thuốc đang kinh doanh
const getAllMedicines = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token" });
        }

        jwt.verify(token, process.env.JWT_SECRET);

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const skip = (page - 1) * limit;
        const searchTerm = req.query.searchTerm || '';
        const filterMode = req.query.filterMode || 'all';

        const totalMedicines = await medicineRepo.countMedicines(searchTerm, filterMode);
        const totalPages = Math.ceil(totalMedicines / limit);
        const medicines = await medicineRepo.getMedicinesWithPagination(skip, limit, searchTerm, filterMode);

        console.log("Service Response:", { medicines: medicines.length, totalMedicines, totalPages, currentPage: page, perPage: limit });

        res.status(200).json({
            message: "OK",
            medicines,
            totalMedicines,
            totalPages,
            currentPage: page,
            perPage: limit,
        });
    } catch (err) {
        console.error("Error in getAllMedicines:", err);
        res.status(500).json({ message: "Error retrieving medicines", error: err.message });
    }
};

// Lấy thuốc theo ID
const getMedicineById = async (req, res) => {
    try {
        const medicine = await medicineRepo.getMedicineById(req.params.id);
        if (!medicine) return res.status(404).json({ message: "Medicine not found" });

        res.status(200).json({ message: "OK", medicine });
    } catch (err) {
        res.status(500).json({ message: "Error retrieving medicine", error: err.message });
    }
};

// Cập nhật thông tin thuốc
const updateMedicine = async (req, res) => {
    try {
        const medicine = await medicineRepo.updateMedicine(req.params.id, req.body);
        if (!medicine) return res.status(404).json({ message: "Medicine not found" });

        res.status(200).json({ message: "Updated", medicine });
    } catch (err) {
        res.status(400).json({ message: "Error updating medicine", error: err.message });
    }
};

// Ngừng kinh doanh thuốc + lý do
const disableMedicine = async (req, res) => {
    const { reason } = req.body;

    if (!reason) {
        return res.status(400).json({ message: "Disable reason is required" });
    }

    try {
        const medicine = await medicineRepo.updateMedicine(req.params.id, {
            isActive: false,
            disableReason: reason,
        });

        if (!medicine) return res.status(404).json({ message: "Medicine not found" });

        res.status(200).json({ message: "Medicine disabled", medicine });
    } catch (err) {
        res.status(500).json({ message: "Error disabling medicine", error: err.message });
    }
};

// Xử lý giao dịch mua thuốc
const processPharmacyTransaction = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { patientId, prescriptionId, paymentMethod, items } = req.body;

        if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Patient ID and items are required" });
        }

        // Calculate total amount and prepare transaction items
        const transactionItems = [];
        let totalAmount = 0;

        for (const item of items) {
            const { medicineId, quantity } = item;
            if (!medicineId || !quantity || quantity <= 0) {
                return res.status(400).json({ message: "Invalid item data" });
            }

            const medicine = await medicineRepo.getMedicineById(medicineId);
            if (!medicine || !medicine.isActive) {
                return res.status(400).json({ message: `Medicine ${medicineId} is unavailable` });
            }

            const price = medicine.unitPrice * quantity;
            totalAmount += price;
            transactionItems.push({
                medicine: medicineId,
                quantity,
                price,
            });
        }

        // Process stock updates
        const updatedMedicines = await medicineRepo.processTransaction(
            items.map(item => ({ medicineId: item.medicineId, quantity: item.quantity }))
        );

        // Create pharmacy transaction
        const transaction = await PharmacyTransaction.create({
            prescription: prescriptionId || null,
            pharmacist: decoded.id || null,
            patient: patientId,
            items: transactionItems,
            totalAmount,
            paid: true, // Assume payment is confirmed
            paymentMethod: paymentMethod || 'cash',
            createdAt: new Date(),
        });

        res.status(201).json({
            message: "Transaction completed",
            transaction,
            updatedMedicines,
        });
    } catch (err) {
        console.error("Error in processPharmacyTransaction:", err);
        res.status(500).json({ message: "Error processing transaction", error: err.message });
    }
};

// Export các hàm chính
module.exports = {
    createMedicine,
    getAllMedicines,
    getMedicineById,
    updateMedicine,
    disableMedicine,
    processPharmacyTransaction,
};