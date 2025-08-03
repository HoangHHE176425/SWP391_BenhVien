const Profile = require("../../models/Profile");
const Question = require("../../models/Question");
const User = require("../../models/User");
const Patient = require("../../models/Patient");
const Appointment = require("../../models/Appointment");
const Feedback = require("../../models/Feedback");
const Schedule = require("../../models/Schedule"); // Thêm import Schedule để cập nhật timeSlot
const mongoose = require("mongoose"); // Thêm import mongoose để sử dụng ObjectId và kiểm tra hợp lệ

const doctorRepo = require("../../repository/employee.repository");
const serviceRepo = require("../../repository/service.repository");
const departmentRepo = require("../../repository/department.repository");
const medicineRepo = require("../../repository/medicine.repository");

// Đặt lịch khám
const getMyProfiles = async (req, res) => {
  try {
    const UserId = req.user.id;

    // Lấy danh sách ID hồ sơ từ tài khoản
    const user = await User.findById(UserId);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });

    const profileIds = user.profiles || [];

    // Lấy thông tin hồ sơ
    const profiles = await Profile.find({ _id: { $in: profileIds } })
      .populate("doctorId", "name") // chỉ lấy trường name của bác sĩ
      .populate("medicine", "name type") // chỉ lấy name và type thuốc
      .sort({ createdAt: -1 }); // mặc định sort mới nhất trước

    res.json(profiles);
  } catch (err) {
    console.error("Lỗi khi lấy hồ sơ:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const sendQA = async (req, res) => {
  const { userId = null, email, title, message, status = "pending" } = req.body;

  try {
    if (!email || !title || !message) {
      return res
        .status(400)
        .json({ message: "Thiếu thông tin bắt buộc (email, title, message)." });
    }

    const question = new Question({
      userId,
      email,
      title,
      message,
      status,
    });

    await question.save();

    res.status(201).json({
      success: true,
      message: "Yêu cầu hỗ trợ đã được gửi.",
      data: question,
    });
  } catch (error) {
    console.error("Lỗi khi gửi yêu cầu:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi gửi yêu cầu." });
  }
};

const getAllQAUser = async (req, res) => {
  const {
    sort,
    statusfilter,
    search,
    page = 1,
    limit = 10,
    idUser,
  } = req.query;

  try {
    if (!idUser) {
      return res
        .status(401)
        .json({ success: false, message: "Chưa đăng nhập." });
    }

    const filter = { userId: idUser };
    if (statusfilter) filter.status = statusfilter;
    if (search) filter.title = { $regex: search, $options: "i" };

    const sortOption = {};
    if (sort) {
      const [field, order] = sort.split("_");
      sortOption[field] = order === "asc" ? 1 : -1;
    } else {
      sortOption.createdAt = -1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Question.countDocuments(filter);

    const QAs = await Question.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: QAs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách Q&A:", error);
    res.status(500).json({ success: false, message: "Đã xảy ra lỗi máy chủ." });
  }
};

const createAppointment = async (req, res) => {
  const { profileId, doctorId, department, appointmentDate, timeSlot, symptoms, bhytCode, type, room } = req.body;
  const userId = req.user.id;

  // Kiểm tra thông tin bắt buộc
  if (!profileId || !doctorId || !department || !appointmentDate || !timeSlot || !symptoms || !type) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc." });
  }

  // Kiểm tra timeSlot hợp lệ
  if (!timeSlot || !timeSlot.startTime || !timeSlot.endTime) {
    return res.status(400).json({ message: "Thiếu thông tin timeSlot hoặc cấu trúc không hợp lệ." });
  }

  // Kiểm tra doctorId đúng format
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return res.status(400).json({ message: "doctorId không hợp lệ." });
  }

  // Chuẩn hóa ngày appointmentDate để tìm lịch
  const appointmentDateObj = new Date(appointmentDate);
  if (isNaN(appointmentDateObj.getTime())) {
    return res.status(400).json({ message: "appointmentDate không hợp lệ." });
  }

  const y = appointmentDateObj.getFullYear();
  const m = appointmentDateObj.getMonth();
  const d = appointmentDateObj.getDate();

  const startOfDay = new Date(y, m, d, 0, 0, 0, 0);
  const endOfDay = new Date(y, m, d, 23, 59, 59, 999);

  // Tìm lịch bác sĩ theo ngày
  const doctorSchedule = await Schedule.findOne({
    employeeId: new mongoose.Types.ObjectId(doctorId),
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  if (!doctorSchedule) {
    return res.status(404).json({ message: "Không tìm thấy lịch làm việc của bác sĩ trong ngày này." });
  }

  // Tìm timeSlot khớp
  const selectedSlot = doctorSchedule.timeSlots.find(slot => {
    const slotStart = new Date(slot.startTime).setMilliseconds(0); // Bỏ mili giây
    const slotEnd = new Date(slot.endTime).setMilliseconds(0);
    const reqStart = new Date(timeSlot.startTime).setMilliseconds(0);
    const reqEnd = new Date(timeSlot.endTime).setMilliseconds(0);
    return slotStart === reqStart && slotEnd === reqEnd;
  });

  if (!selectedSlot) {
    return res.status(400).json({ message: "Không tìm thấy timeSlot phù hợp trong lịch bác sĩ." });
  }

  if (selectedSlot.status === 'Booked') {
    return res.status(400).json({ message: "Khung giờ đã được đặt. Vui lòng chọn thời gian khác." });
  }

  // Đánh dấu đã đặt và lưu lại lịch
  selectedSlot.status = 'Booked';
  await doctorSchedule.save();

  // Xử lý bhytCode: Optional, fallback null nếu rỗng, validation nếu có giá trị
  let normalizedBhytCode = null;
  if (bhytCode && bhytCode.trim()) {
    normalizedBhytCode = bhytCode.trim();
    const bhytCodeRegex = /^[A-Z]{2}\d{13}$/; // Định dạng 2 chữ cái + 13 số
    if (!bhytCodeRegex.test(normalizedBhytCode)) {
      return res.status(400).json({ message: "Mã BHYT không đúng định dạng (2 chữ cái + 13 số)." });
    }
  } else {
    console.log('[DEBUG] bhytCode rỗng, lưu null.');
  }

  // Tạo cuộc hẹn
  const newAppointment = new Appointment({
    userId: type === 'Online' ? userId : null,
    profileId,
    doctorId,
    department,
    appointmentDate: appointmentDateObj,
    type,
    timeSlot: {
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      status: "Booked",
    },
    symptoms,
    bhytCode: normalizedBhytCode, // Lưu null nếu rỗng
    reminderSent: false,
    createdBy: userId,
    room: type === 'Offline' ? room : null
  });

  await newAppointment.save();
  console.log('[DEBUG] Tạo lịch hẹn thành công với bhytCode:', normalizedBhytCode);
  return res.status(201).json({ message: "Tạo lịch hẹn thành công", appointment: newAppointment });
};

const createOfflineAppointment = async (req, res) => {
  const { profileId, doctorId, department, appointmentDate, timeSlot, symptoms, bhytCode, type, room } = req.body;

  // Kiểm tra thông tin bắt buộc
  if (!profileId || !doctorId || !department || !appointmentDate || !timeSlot || !symptoms || !type) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc." });
  }

  // Kiểm tra timeSlot hợp lệ
  if (!timeSlot || !timeSlot.startTime || !timeSlot.endTime) {
    return res.status(400).json({ message: "Thiếu thông tin timeSlot hoặc cấu trúc không hợp lệ." });
  }

  // Kiểm tra doctorId đúng format
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return res.status(400).json({ message: "doctorId không hợp lệ." });
  }

  // Chuẩn hóa ngày appointmentDate
  const appointmentDateObj = new Date(appointmentDate);
  if (isNaN(appointmentDateObj.getTime())) {
    return res.status(400).json({ message: "appointmentDate không hợp lệ." });
  }

  // Xử lý bhytCode: Optional, fallback null nếu rỗng, validation nếu có giá trị
  let normalizedBhytCode = null;
  if (bhytCode && bhytCode.trim()) {
    normalizedBhytCode = bhytCode.trim();
    const bhytCodeRegex = /^[A-Z]{2}\d{13}$/; // Định dạng 2 chữ cái + 13 số
    if (!bhytCodeRegex.test(normalizedBhytCode)) {
      return res.status(400).json({ message: "Mã BHYT không đúng định dạng (2 chữ cái + 13 số)." });
    }
  } else {
    console.log('[DEBUG] bhytCode rỗng, lưu null.');
  }

  // Tạo cuộc hẹn mới
  try {
    const newAppointment = new Appointment({
      userId: null,
      profileId,
      doctorId,
      department,
      appointmentDate: appointmentDateObj,
      type,
      timeSlot: {
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        status: "Booked",
      },
      symptoms,
      bhytCode: normalizedBhytCode, // Lưu null nếu rỗng
      reminderSent: false,
      createdBy: null,
      room: type === 'Offline' ? room : null
    });

    await newAppointment.save();
    console.log('[DEBUG] Tạo lịch hẹn offline thành công với bhytCode:', normalizedBhytCode);
    return res.status(201).json({ message: "Tạo lịch hẹn thành công", appointment: newAppointment });
  } catch (err) {
    console.error("Lỗi khi tạo lịch hẹn:", err);
    return res.status(500).json({ message: "Lỗi server khi tạo lịch hẹn", error: err.message });
  }
};

// Hiển thị toàn bộ danh sách đặt lịch của chính người dùng
const getAppointmentsByUser = async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1; // Mặc định là trang 1
  const limit = parseInt(req.query.limit) || 10; // Mặc định là 10 bản ghi mỗi trang
  const skip = (page - 1) * limit; // Tính toán số lượng bản ghi bỏ qua

  try {
    // Lấy tổng số cuộc hẹn để tính toán tổng số trang
    const totalAppointments = await Appointment.countDocuments({ userId });
    const totalPages = Math.ceil(totalAppointments / limit);
    const appointments = await Appointment.find({ userId })
      .populate('profileId doctorId')
      .populate("department", "name") // NEW: Populate department để lấy name
      .sort({ appointmentDate: -1 })
      .skip(skip) // Bỏ qua số lượng bản ghi trước đó
      .limit(limit); // Giới hạn số bản ghi trả về

    // Trả về kết quả phân trang
    res.status(200).json({
      appointments,
      totalAppointments,
      totalPages,
      currentPage: page,
      perPage: limit,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get appointments', error: err.message });
  }
};

const cancelAppointment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Tìm lịch hẹn
    const appointment = await Appointment.findOne({ _id: id, userId });
    if (!appointment) {
      return res.status(404).json({ message: 'Lịch hẹn không tồn tại hoặc bạn không có quyền hủy.' });
    }

    // Kiểm tra trạng thái hiện tại có cho phép hủy không
    if (['canceled', 'pending_cancel'].includes(appointment.status)) {
      return res.status(400).json({ message: 'Lịch hẹn đã được hủy hoặc đang chờ duyệt.' });
    }

    // Lấy thời gian hiện tại và thời gian lịch hẹn
    const currentTime = new Date();
    const appointmentTime = new Date(appointment.appointmentDate);
    const timeDiff = appointmentTime - currentTime; // milliseconds

    // Nếu lịch hẹn đã qua, không cho hủy
    if (timeDiff < 0) {
      return res.status(400).json({ message: 'Không thể hủy lịch hẹn đã qua.' });
    }

    // Chuẩn hóa ngày để tìm lịch bác sĩ
    const y = appointmentTime.getFullYear();
    const m = appointmentTime.getMonth();
    const d = appointmentTime.getDate();
    const startOfDay = new Date(y, m, d, 0, 0, 0, 0);
    const endOfDay = new Date(y, m, d, 23, 59, 59, 999);

    // Tìm lịch bác sĩ
    const doctorSchedule = await Schedule.findOne({
      employeeId: new mongoose.Types.ObjectId(appointment.doctorId),
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    let updateSlot = false; // Flag để quyết định có cập nhật slot không

    if (timeDiff > 24 * 60 * 60 * 1000) { // Trước 24h: Hủy ngay
      appointment.status = 'canceled';
      updateSlot = true; // Cập nhật slot về Available
      console.log('[LOG] Hủy ngay lập tức vì trước 24h.');
    } else { // Trong 24h: Chờ duyệt
      appointment.status = 'pending_cancel';
      console.log('[LOG] Chuyển sang pending_cancel vì trong 24h.');
    }

    // Nếu cần cập nhật slot (chỉ khi hủy ngay)
    if (updateSlot && doctorSchedule) {
      const selectedSlot = doctorSchedule.timeSlots.find(slot => {
        const slotStart = new Date(slot.startTime).setMilliseconds(0);
        const slotEnd = new Date(slot.endTime).setMilliseconds(0);
        const reqStart = new Date(appointment.timeSlot.startTime).setMilliseconds(0);
        const reqEnd = new Date(appointment.timeSlot.endTime).setMilliseconds(0);
        return slotStart === reqStart && slotEnd === reqEnd;
      });

      if (selectedSlot && selectedSlot.status === 'Booked') {
        selectedSlot.status = 'Available';
        await doctorSchedule.save();
        console.log('[LOG] Đã cập nhật timeSlot về Available.');
      } else {
        console.warn('[WARN] Không tìm thấy timeSlot phù hợp để cập nhật.');
      }
    } else if (updateSlot && !doctorSchedule) {
      console.warn('[WARN] Không tìm thấy lịch bác sĩ để cập nhật timeSlot.');
    }

    // Lưu thay đổi lịch hẹn
    await appointment.save();

    res.status(200).json({
      message: appointment.status === 'canceled' ? 'Hủy lịch hẹn thành công.' : 'Yêu cầu hủy đã gửi, chờ lễ tân duyệt.',
      appointment
    });
  } catch (err) {
    console.error('Lỗi khi hủy lịch hẹn:', err);
    res.status(500).json({ message: 'Hủy lịch hẹn thất bại.', error: err.message });
  }
};

const getAllDoctors = async (req, res) => {
  const { page = 1, limit = 10, searchTerm = "", specialization = "" } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    // Đếm tổng số bác sĩ
    const totalDoctors = await doctorRepo.countDoctors(searchTerm, specialization);

    // Lấy các bác sĩ với phân trang
    const doctors = await doctorRepo.getDoctorsWithPagination(skip, limit, searchTerm, specialization);

    res.status(200).json({
      doctors,
      totalDoctors,
      totalPages: Math.ceil(totalDoctors / limit),
      currentPage: parseInt(page),
      perPage: parseInt(limit),
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching doctors', error: err.message });
  }
};


const getDoctorById = async (req, res) => {
  try {
    const doctor = await doctorRepo.getDoctorById(req.params.doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.status(200).json({ message: "OK", doctor });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
};

//List Services
const getAllServices = async (req, res) => {
  const page = parseInt(req.query.page) || 1;  // Mặc định trang 1
  const limit = parseInt(req.query.limit) || 10;  // Mặc định 10 dịch vụ mỗi trang
  const skip = (page - 1) * limit;  // Tính toán số lượng dịch vụ cần bỏ qua
  const searchTerm = req.query.searchTerm || "";  // Lấy tham số tìm kiếm từ query

  try {
    // Lấy tổng số dịch vụ để tính số trang
    const totalServices = await serviceRepo.countServices(searchTerm);
    const totalPages = Math.ceil(totalServices / limit);

    // Lấy dịch vụ với phân trang và tìm kiếm
    const services = await serviceRepo.getServicesWithPagination(skip, limit, searchTerm);

    res.status(200).json({
      message: "OK",
      services,
      totalServices,
      totalPages,
      currentPage: page,
      perPage: limit,
    });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
};



const getServiceById = async (req, res) => {
  try {
    const service = await serviceRepo.getServiceById(req.params.serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.status(200).json({ message: "OK", service });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
};

//List Departments
const getAllDepartment = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const searchTerm = req.query.searchTerm || "";  // Lấy tham số tìm kiếm từ query

  try {
    console.log('run day hehe');
    // Lấy tổng số phòng ban để tính số trang
    const totalDepartments = await departmentRepo.countDepartments();
    const totalPages = Math.ceil(totalDepartments / limit);

    // Lấy phòng ban với phân trang
    const departments = await departmentRepo.getDepartmentsWithPagination(skip, limit, searchTerm);

    res.status(200).json({
      message: "OK",
      departments,
      totalDepartments,
      totalPages,
      currentPage: page,
      perPage: limit,
    });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
};


const getDepartmentById = async (req, res) => {
  try {
    const department = await departmentRepo.getDepartmentById(req.params.departmentId);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    res.status(200).json({ message: "OK", department });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
};

//List Medicines
const getAllMedicines = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const searchTerm = req.query.searchTerm || "";  // Lấy tham số tìm kiếm từ query

  try {
    // Lấy tổng số thuốc để tính số trang
    const totalMedicines = await medicineRepo.countMedicines(searchTerm);
    const totalPages = Math.ceil(totalMedicines / limit);

    // Lấy thuốc với phân trang và tìm kiếm
    const medicines = await medicineRepo.getMedicinesWithPagination(skip, limit, searchTerm);

    const filtered = medicines.map(medicine => ({
      _id: medicine._id,
      name: medicine.name,
    }));

    res.status(200).json({
      message: "OK",
      data: filtered,
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
  console.log("REQ PARAMS:", req.params);
  try {
    const medicine = await medicineRepo.getMedicineById(req.params.medicineId);
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    const result = {
      _id: medicine._id,
      name: medicine.name,
      type: medicine.type,
      group: medicine.group,
      ingredient: medicine.ingredient,
      indication: medicine.indication,
      contraindication: medicine.contraindication,
      dosage: medicine.dosage,
      sideEffects: medicine.sideEffects,
      precaution: medicine.precaution,
      interaction: medicine.interaction,
      storage: medicine.storage,
    };
    res.status(200).json({ message: "OK", data: result });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
};

// POST: User gửi feedback
const createFeedback = async (req, res) => {
  const userId = req.user.id;
  try {
    const { content, rating, appointmentId } = req.body;

    // Validation cơ bản
    if (!content || !rating || !appointmentId) {
      return res.status(400).json({ error: 'Thiếu thông tin: content, rating, appointmentId bắt buộc' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating phải từ 1 đến 5' });
    }

    // Kiểm tra appointment tồn tại và thuộc user
    const appointment = await Appointment.findById(appointmentId).select('doctorId userId');
    if (!appointment) {
      return res.status(404).json({ error: 'Không tìm thấy lịch hẹn' });
    }
    if (appointment.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Bạn không phải chủ lịch hẹn này' });
    }

    // Lấy doctorId từ appointment
    const doctorId = appointment.doctorId;

    const feedback = new Feedback({
      userId,
      appointmentId,
      doctorId,  // Set từ appointment
      content,
      rating,
    });
    await feedback.save();
    res.status(201).json({ message: 'Feedback sent successfully', feedback });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send feedback', details: err.message });
  }
};

// POST: Guest gửi feedback (không cần login)
const createGuestFeedback = async (req, res) => {
  try {
    const { guestName, guestEmail, content, rating, doctorId } = req.body; // doctorId optional nếu gửi cho bác sĩ cụ thể

    // Validation cơ bản
    if (!content || !rating) {
      return res.status(400).json({ error: 'Thiếu thông tin: content, rating bắt buộc' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating phải từ 1 đến 5' });
    }
    if (guestEmail && !/\S+@\S+\.\S+/.test(guestEmail)) { // Validate email optional
      return res.status(400).json({ error: 'Email không hợp lệ' });
    }

    const feedback = new Feedback({
      userId: null, // Null cho guest
      appointmentId: null,
      doctorId: doctorId || null, // Optional
      guestName: guestName || 'Ẩn danh',
      content,
      rating,
    });
    await feedback.save();
    res.status(201).json({ message: 'Feedback sent successfully', feedback });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send feedback', details: err.message });
  }
};

// Lấy danh sách tất cả bệnh nhân
const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find({})
      .populate('profileId', 'name dateOfBirth gender identityNumber')
      .select('_id patientId profileId');
    
    // Map để trả về thông tin cần thiết
    const mappedPatients = patients.map(patient => ({
      _id: patient._id,
      patientId: patient.patientId,
      name: patient.profileId?.name || 'Không có tên',
      dateOfBirth: patient.profileId?.dateOfBirth,
      gender: patient.profileId?.gender,
      identityNumber: patient.profileId?.identityNumber
    }));
    
    res.status(200).json(mappedPatients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

module.exports = {
  getMyProfiles,
  sendQA,
  getAllQAUser,
  createAppointment,
  getAppointmentsByUser,
  cancelAppointment,
  getAllDoctors,
  getDoctorById,
  getAllServices,
  getServiceById,
  getAllDepartment,
  getDepartmentById,
  getAllMedicines,
  getMedicineById,
  createFeedback,
  createGuestFeedback,
  createOfflineAppointment,
  getAllPatients,
};

