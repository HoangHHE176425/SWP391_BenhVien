const Medicine = require('../models/Medicine');

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

        // Log the query for debugging
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

module.exports = {
    createMedicine,
    getAllMedicines,
    countMedicines,
    getMedicinesWithPagination,
    getMedicineById,
    updateMedicine,
    deleteMedicine,
};