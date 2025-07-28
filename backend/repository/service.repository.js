const Service = require("../models/Service");

async function getAllServices() {
  return await Service.find();
}

async function getServiceById(id) {
  return await Service.find({ _id: id });
}

const countServices = async (searchTerm) => {
  const query = searchTerm ? { name: { $regex: searchTerm, $options: 'i' } } : {};  // Tìm kiếm theo tên dịch vụ

  const result = await Service.countDocuments(query);
  return result;
};

const getServicesWithPagination = async (skip, limit, searchTerm) => {
  const query = searchTerm ? { name: { $regex: searchTerm, $options: 'i' } } : {};  // Tìm kiếm theo tên dịch vụ

  const services = await Service.find(query)
    .skip(skip)  // Bỏ qua các bản ghi trước đó
    .limit(limit) // Giới hạn số bản ghi trả về
    .exec();

  return services;
};



module.exports = {
  getAllServices,
  getServiceById,
  countServices,
  getServicesWithPagination,
};