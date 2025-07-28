// employee.repository.js
const Employee = require("../models/Employee");

// Lấy danh sách bác sĩ (role Doctor)
async function getAllDoctors() {
  return await Employee.find({ role: "Doctor" });
}

// Lấy chi tiết bác sĩ theo id
async function getDoctorById(id) {
  return await Employee.findOne({ _id: id, role: "Doctor" });
}

const countDoctors = async (searchTerm, specialization) => {
    const query = { role: "Doctor" };

    // Nếu có searchTerm, thêm vào query để tìm kiếm theo tên bác sĩ
    if (searchTerm) {
        query.name = { $regex: searchTerm, $options: 'i' }; // Tìm kiếm không phân biệt chữ hoa/thường
    }

    // Nếu có chuyên khoa, thêm vào query để lọc theo chuyên khoa
    if (specialization) {
        query.specialization = specialization;
    }

    const result = await Employee.countDocuments(query);
    return result;
};

const getDoctorsWithPagination = async (skip, limit, searchTerm, specialization) => {
    const query = { role: "Doctor" };

    // Nếu có searchTerm, thêm vào query để tìm kiếm theo tên bác sĩ
    if (searchTerm) {
        query.name = { $regex: searchTerm, $options: 'i' }; // Tìm kiếm không phân biệt chữ hoa/thường
    }

    // Nếu có chuyên khoa, thêm vào query để lọc theo chuyên khoa
    if (specialization) {
        query.specialization = specialization;
    }

    const doctors = await Employee.find(query) // Thực hiện truy vấn để lấy các bác sĩ
        .skip(skip)  // Bỏ qua các bản ghi trước đó
        .limit(limit) // Giới hạn số bản ghi trả về
        .exec();
    return doctors;
};



module.exports = {
  getAllDoctors,
  getDoctorById,
  countDoctors,
  getDoctorsWithPagination,
};