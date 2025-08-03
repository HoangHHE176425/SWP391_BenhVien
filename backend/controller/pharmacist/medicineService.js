const medicineRepo = require('../../repository/medicine.repository');
const PharmacyTransaction = require('../../models/PharmacyTransaction');
const Records = require('../../models/Records');
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
        const { patientId, recordId, prescriptionId, paymentMethod, items } = req.body;

        console.log("Received transaction data:", { patientId, recordId, prescriptionId, paymentMethod, items });

        // Validate items only if not a patient or no prescription
        if (patientId === "not_a_patient" || !recordId) {
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ message: "Items are required for non-patients or when no prescription exists" });
            }
        }

        // Handle patient validation based on CCCD
        let patientIdentifier = "Không phải bệnh nhân"; // Default for non-patients
        let recordInfo = null;
        let hasPrescription = false;
        
        if (patientId && patientId !== "not_a_patient") {
            // Validate CCCD as a non-empty string for actual patients
            if (typeof patientId !== 'string' || patientId.trim() === '') {
                return res.status(400).json({ message: "CCCD phải là chuỗi hợp lệ" });
            }

            // Validate patient existence using Records model with CCCD
            const record = await Records.findOne({ identityNumber: patientId });
            if (!record) {
                return res.status(400).json({ message: `CCCD ${patientId} không tồn tại trong hệ thống` });
            }

            // Validate recordId if provided
            if (recordId) {
                const specificRecord = await Records.findOne({ 
                    _id: recordId, 
                    identityNumber: patientId 
                });
                if (!specificRecord) {
                    return res.status(400).json({ message: `Record ${recordId} không tồn tại cho CCCD ${patientId}` });
                }
                recordInfo = {
                    recordId: specificRecord._id,
                    admissionDate: specificRecord.admissionDate,
                    dischargeDate: specificRecord.dischargeDate,
                    admissionReason: specificRecord.admissionReason
                };
                // Kiểm tra xem có prescription không
                hasPrescription = specificRecord.prescription && specificRecord.prescription.length > 0;
                console.log("Record prescription check:", { 
                    recordId: specificRecord._id, 
                    hasPrescription, 
                    prescriptionLength: specificRecord.prescription ? specificRecord.prescription.length : 0 
                });
            }
            
            patientIdentifier = patientId; // Use CCCD as patient identifier
        }

        // Calculate total amount and prepare transaction items
        const transactionItems = [];
        let totalAmount = 0;
        let updatedMedicines = null; // Khởi tạo biến updatedMedicines

        // Only process items if they exist and are valid
        if (items && Array.isArray(items) && items.length > 0) {
            console.log("Processing items:", items);
            for (const item of items) {
                const { medicineId, quantity } = item;
                console.log("Processing item:", { medicineId, quantity });
                console.log("MedicineId type:", typeof medicineId);
                console.log("Quantity type:", typeof quantity);
                if (!medicineId || !quantity || quantity <= 0) {
                    console.log("Validation failed:", { 
                        medicineId, 
                        quantity, 
                        medicineIdValid: !!medicineId, 
                        quantityValid: quantity > 0,
                        medicineIdType: typeof medicineId,
                        quantityType: typeof quantity
                    });
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

            // Process stock updates only if there are items
            updatedMedicines = await medicineRepo.processTransaction(
                items.map(item => ({ medicineId: item.medicineId, quantity: item.quantity }))
            );
        } else if (patientId !== "not_a_patient" && recordId && !hasPrescription) {
            // Nếu là bệnh nhân nhưng không có prescription và không có items
            return res.status(400).json({ message: "Items are required when no prescription exists for the selected record" });
        }

        // Create pharmacy transaction
        const transaction = await PharmacyTransaction.create({
            prescription: prescriptionId || null,
            pharmacist: decoded.id || null,
            patient: patientIdentifier, // Use patientIdentifier which handles both cases
            record: recordInfo, // Add record information
            items: transactionItems,
            totalAmount,
            paid: true,
            paymentMethod: paymentMethod || 'tien mat',
            createdAt: new Date(),
        });

        res.status(201).json({
            message: "Transaction completed",
            transaction,
            updatedMedicines: updatedMedicines,
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

// Lấy danh sách bệnh nhân theo CCCD từ bảng Records
const getPatientsByCCCD = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token" });
        }

        jwt.verify(token, process.env.JWT_SECRET);

        // Lấy tất cả records có identityNumber (CCCD)
        const records = await Records.find({ 
            identityNumber: { $exists: true, $ne: null, $ne: '' } 
        })
        .select('identityNumber fullName gender dateOfBirth address admissionDate dischargeDate admissionReason prescription')
        .populate({
            path: 'prescription.medicine',
            select: 'name',
            model: 'Medicine'
        })
        .sort({ createdAt: -1 }); // Sắp xếp theo thời gian tạo mới nhất

        // Nhóm records theo CCCD
        const patientsByCCCD = {};
        records.forEach(record => {
            const cccd = record.identityNumber;
            if (!patientsByCCCD[cccd]) {
                patientsByCCCD[cccd] = {
                    _id: record._id,
                    patientId: record.identityNumber,
                    name: record.fullName,
                    gender: record.gender,
                    dateOfBirth: record.dateOfBirth,
                    address: record.address,
                    cccd: record.identityNumber,
                    records: []
                };
            }
            patientsByCCCD[cccd].records.push({
                recordId: record._id,
                admissionDate: record.admissionDate,
                dischargeDate: record.dischargeDate,
                admissionReason: record.admissionReason,
                prescription: record.prescription,
                createdAt: record.createdAt
            });
        });

        const patients = Object.values(patientsByCCCD);

        res.status(200).json({
            message: "OK",
            patients: patients
        });
    } catch (err) {
        console.error("Error in getPatientsByCCCD:", err);
        res.status(500).json({ message: "Error retrieving patients", error: err.message });
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
    getPatientsByCCCD,
};