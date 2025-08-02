const medicineRepo = require('../../repository/medicine.repository');
const PharmacyTransaction = require('../../models/PharmacyTransaction');
const mongoose = require('mongoose');
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

        // Kiểm tra trước khi nhập kho (theo quy trình PDF)
        if (!payload.name || !payload.quantity || payload.quantity <= 0 || !payload.unitPrice || payload.unitPrice <= 0) {
            return res.status(400).json({ message: "Invalid medicine data: name, quantity, and unitPrice are required and must be valid" });
        }
        if (!payload.expirationDate || new Date(payload.expirationDate) <= new Date()) {
            return res.status(400).json({ message: "Expiration date must be in the future" });
        }

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

        // Thêm logic lập kế hoạch dự trữ (theo quy trình PDF)
        const totalMedicines = await medicineRepo.countMedicines(searchTerm, filterMode);
        const medicines = await medicineRepo.getMedicinesWithPagination(skip, limit, searchTerm, filterMode);
        
        // Tính toán dự trữ dựa trên tồn kho và báo cáo định kỳ
        const lowStockMedicines = medicines.filter(m => m.quantity < 10); // Giả định ngưỡng thấp là 10
        if (lowStockMedicines.length > 0) {
            console.log("Low stock alert for planning:", lowStockMedicines.map(m => ({ name: m.name, quantity: m.quantity })));
        }

        const totalPages = Math.ceil(totalMedicines / limit);

        console.log("Service Response:", { medicines: medicines.length, totalMedicines, totalPages, currentPage: page, perPage: limit });

        res.status(200).json({
            message: "OK",
            medicines,
            totalMedicines,
            totalPages,
            currentPage: page,
            perPage: limit,
            lowStockAlert: lowStockMedicines.length > 0 ? lowStockMedicines : null,
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

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Items are required" });
        }

        // Handle patient validation based on patientId
        let patientIdentifier = "Không phải bệnh nhân"; // Default for non-patients
        
        if (patientId && patientId !== "not_a_patient") {
            // Validate patientId as a non-empty string for actual patients
            if (typeof patientId !== 'string' || patientId.trim() === '') {
                return res.status(400).json({ message: "Mã bệnh nhân phải là chuỗi hợp lệ" });
            }

            // Validate patient existence using Patient model
            const patient = await mongoose.model('Patient').findOne({ patientId: patientId });
            if (!patient) {
                return res.status(400).json({ message: `Mã bệnh nhân ${patientId} không tồn tại` });
            }
            
            patientIdentifier = patientId; // Use actual patient ID
        }

        // Calculate total amount and prepare transaction items
        const transactionItems = [];
        let totalAmount = 0;

        for (const item of items) {
            const { medicineId, quantity } = item;
            if (!medicineId || !quantity || quantity <= 0) {
                return res.status(400).json({ message: `Invalid item data: medicineId=${medicineId}, quantity=${quantity}` });
            }

            const medicine = await medicineRepo.getMedicineById(medicineId);
            console.log(`Validating medicine ${medicineId}:`, medicine);
            if (!medicine || !medicine.isActive) {
                return res.status(400).json({ message: `Medicine ${medicineId} (${medicine?.name || 'unknown'}) is unavailable or inactive` });
            }
            if (medicine.quantity < quantity) {
                return res.status(400).json({ message: `Insufficient stock for ${medicine.name}: available=${medicine.quantity}, requested=${quantity}` });
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
            patient: patientIdentifier, // Use patientIdentifier which handles both cases
            items: transactionItems,
            totalAmount,
            paid: true,
            paymentMethod: paymentMethod || 'tien mat',
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

const getTransactionHistory = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token" });
        }

        jwt.verify(token, process.env.JWT_SECRET);

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const patientId = req.query.patientId || '';
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        let query = {};
        if (patientId) {
            query.patient = patientId;
        }

        const totalTransactions = await PharmacyTransaction.countDocuments(query);
        const totalPages = Math.ceil(totalTransactions / limit);
        const transactions = await PharmacyTransaction.find(query)
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit)
            .populate('items.medicine', 'name unitPrice') // Populate medicine name and price
            .exec();

        res.status(200).json({
            message: "OK",
            transactions,
            totalTransactions,
            totalPages,
            currentPage: page,
            perPage: limit,
        });
    } catch (err) {
        console.error("Error in getTransactionHistory:", err);
        res.status(500).json({ message: "Error retrieving transaction history", error: err.message });
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
    getTransactionHistory,
};