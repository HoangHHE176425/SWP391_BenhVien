const medicineRepo = require('../../repository/medicine.repository');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const createMedicine = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: "fel" });
    }
    //co token
    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      console.log("decode", JSON.stringify(decode));
      const payload = { ...req.body, supplierId: decode.id };
      const medicine = await medicineRepo.createMedicine(payload);
      res.status(201).json({ message: "Created", medicine });
    } catch (error) {
      console.log("error", error)
      return res.status(401).json({ message: "fel1" });
    }

  } catch (err) {
    res.status(400).json({ message: "Error", error: err.message });
  }
};

const getAllMedicines = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;
  const searchTerm = req.query.searchTerm || "";  // Lấy tham số tìm kiếm từ query

  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log("token", token);

    if (!token) {
      return res.status(401).json({ message: "fel" });
    }
    //co token
    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      console.log("decode", JSON.stringify(decode));
    } catch (error) {
      console.log("error", error)
      return res.status(401).json({ message: "fel1" });
    }

    // Lấy tổng số thuốc để tính số trang, sử dụng searchTerm để lọc
    const totalMedicines = await medicineRepo.countMedicines(searchTerm);
    const totalPages = Math.ceil(totalMedicines / limit);

    // Lấy thuốc với phân trang
    const medicines = await medicineRepo.getMedicinesWithPagination(skip, limit, searchTerm);

    res.status(200).json({
      message: "OK",
      medicines,
      totalMedicines,
      totalPages,
      currentPage: page,
      perPage: limit,
    });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
};

const getMedicineById = async (req, res) => {
  try {
    const medicine = await medicineRepo.getMedicineById(req.params.id);
    if (!medicine) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "OK", medicine });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
};

const updateMedicine = async (req, res) => {
  try {
    const medicine = await medicineRepo.updateMedicine(req.params.id, req.body);
    if (!medicine) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "OK", medicine });
  } catch (err) {
    res.status(400).json({ message: "Error", error: err.message });
  }
};

const deleteMedicine = async (req, res) => {
  try {
    const medicine = await medicineRepo.deleteMedicine(req.params.id);
    if (!medicine) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Deleted", medicine });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
};

module.exports = {
  createMedicine,
  getAllMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
}