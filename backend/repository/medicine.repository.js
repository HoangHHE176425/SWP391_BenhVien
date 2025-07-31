const Medicine = require('../models/Medicine');

async function createMedicine(data) {
    return await Medicine.create(data);
}

async function getAllMedicines() {
    return await Medicine.find().populate('supplier');
}

const countMedicines = async (searchTerm) => {
    const query = searchTerm ? { name: { $regex: searchTerm, $options: 'i' } } : {}; // Tìm kiếm theo tên thuốc
    const result = await Medicine.countDocuments(query);
    return result;
};

const getMedicinesWithPagination = async (skip, limit, searchTerm) => {
    const query = searchTerm ? { name: { $regex: searchTerm, $options: 'i' } } : {}; // Tìm kiếm theo tên thuốc

    query['isActive'] = true;
    const medicines = await Medicine.find(query)
        .populate('supplier')
        .skip(skip) // Bỏ qua các bản ghi trước đó
        .limit(limit) // Giới hạn số bản ghi trả về
        .exec();
    return medicines;
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