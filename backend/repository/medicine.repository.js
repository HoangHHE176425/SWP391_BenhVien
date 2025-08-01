const Medicine = require('../models/Medicine');
const mongoose = require('mongoose');

async function createMedicine(data) {
    return await Medicine.create(data);
}

async function getAllMedicines() {
    return await Medicine.find().populate('supplier');
}

const countMedicines = async (searchTerm = '', filterMode = 'all') => {
    let query = {};
    if (searchTerm) {
        query.name = { $regex: searchTerm, $options: 'i' };
    }
    query.isActive = true;

    if (filterMode === 'low-stock') {
        query.quantity = { $lt: 10 };
    } else if (filterMode === 'expiring') {
        const now = new Date();
        const in30Days = new Date(now);
        in30Days.setDate(now.getDate() + 30);
        query.expirationDate = { $lte: in30Days };
    }

    console.log("Count Query:", JSON.stringify(query));
    const result = await Medicine.countDocuments(query);
    console.log("Total medicines counted:", result);
    return result;
};

const getMedicinesWithPagination = async (skip, limit, searchTerm = '', filterMode = 'all') => {
    try {
        let query = {};
        if (searchTerm) {
            query.name = { $regex: searchTerm, $options: 'i' };
        }
        query.isActive = true;

        if (filterMode === 'low-stock') {
            query.quantity = { $lt: 10 };
        } else if (filterMode === 'expiring') {
            const now = new Date();
            const in30Days = new Date(now);
            in30Days.setDate(now.getDate() + 30);
            query.expirationDate = { $lte: in30Days };
        }

        console.log("Query:", JSON.stringify(query));
        console.log("Skip:", skip, "Limit:", limit);

        const medicines = await Medicine.find(query)
            .populate('supplier')
            .skip(skip)
            .limit(limit)
            .exec();

        console.log("Medicines found:", medicines.length);

        return medicines || [];
    } catch (error) {
        console.error("Error in getMedicinesWithPagination:", error);
        throw new Error(`Failed to fetch medicines: ${error.message}`);
    }
};

async function getMedicineById(id) {
    return await Medicine.findById(id);
}

async function updateMedicine(id, data) {
    return await Medicine.findByIdAndUpdate(id, data, { new: true });
}

async function deleteMedicine(id) {
    return await Medicine.findByIdAndDelete(id);
}

async function processTransaction(items) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const updatedMedicines = [];

        // Validate and update stock for each item
        for (const item of items) {
            const { medicineId, quantity } = item;
            if (!mongoose.isValidObjectId(medicineId)) {
                throw new Error(`Invalid medicine ID: ${medicineId}`);
            }

            const medicine = await Medicine.findOne({
                _id: medicineId,
                isActive: true,
                quantity: { $gte: quantity },
            }).session(session);

            if (!medicine) {
                throw new Error(`Medicine ${medicineId} is unavailable or has insufficient stock`);
            }

            medicine.quantity -= quantity;
            medicine.lastUpdated = new Date();
            await medicine.save({ session });
            updatedMedicines.push(medicine);
        }

        await session.commitTransaction();
        return updatedMedicines;
    } catch (error) {
        await session.abortTransaction();
        console.error("Transaction error:", error);
        throw new Error(`Transaction failed: ${error.message}`);
    } finally {
        session.endSession();
    }
}

module.exports = {
    createMedicine,
    getAllMedicines,
    countMedicines,
    getMedicinesWithPagination,
    getMedicineById,
    updateMedicine,
    deleteMedicine,
    processTransaction,
};