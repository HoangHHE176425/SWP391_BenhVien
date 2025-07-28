const Department = require('../models/Department');

async function getAllDepartment() {
  return await Department.find();
}

async function getDepartmentById(id) {
  return await Department.findById(id);
}

const countDepartments = async (searchTerm) => {
  const query = searchTerm ? { name: { $regex: searchTerm, $options: 'i' } } : {}; // Tìm kiếm theo tên phòng ban

  const result = await Department.countDocuments();
  return result;
};

const getDepartmentsWithPagination = async (skip, limit, searchTerm) => {
  const query = searchTerm ? { name: { $regex: searchTerm, $options: 'i' } } : {}; // Tìm kiếm theo tên phòng ban

  const departments = await Department.find()
    .skip(skip)
    .limit(limit)
    .exec();
    
  return departments;
};


module.exports = {
  getAllDepartment,
  getDepartmentById,
  countDepartments,
  getDepartmentsWithPagination,
};