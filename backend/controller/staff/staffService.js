const Profile = require("../../models/Profile");
const Question = require("../../models/Question");
const Feedback = require("../../models/Feedback");
const User = require("../../models/User");
const sendEmail = require('../../utils/sendEmail');
const createCheckup = async (req, res) => {
  try {
    const { patientId, doctorId, date, time, symptoms } = req.body;
    if (!patientId || !doctorId || !date || !time || !symptoms) {
      return res.status(400).json({ message: "All fields are required" });
    }

    return res.status(201).json({ message: "Checkup created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const replyQA = async (req, res) => {
  const { id } = req.params;
  const { replyMessage } = req.body;

  try {
    const question = await Question.findById(id);
    if (!question) return res.status(404).json({ message: "Không tìm thấy yêu cầu." });

    question.reply = replyMessage;
    question.status = 'answered';
    question.repliedAt = new Date();
    await question.save();

    // Gửi email phản hồi
    await sendEmail({
      to: question.email,
      subject: `Phản hồi yêu cầu hỗ trợ: ${question.title}`,
      text: `Chào bạn,\n\nChúng tôi đã phản hồi yêu cầu của bạn:\n\n${replyMessage}\n\nTrân trọng,\nBệnh viện`
    });

    res.json({ success: true, message: "Đã phản hồi và gửi email cho người dùng." });

  } catch (error) {
    console.error("Lỗi phản hồi yêu cầu:", error);
    res.status(500).json({ message: "Lỗi phản hồi yêu cầu." });
  }
};

const getAllQA = async (req, res) => {
  const { sort, searchId, statusfilter, page = 1, limit = 10 } = req.query; //Dùng req.query

  try {
    let filter = {};

    if (searchId) {
      filter.title = searchId;
    }

    if (statusfilter) {
      filter.status = statusfilter;
    }

    let sortOption = {};
    if (sort) {
      const [field, order] = sort.split('_');
      sortOption[field] = order === 'asc' ? 1 : -1;
    } else {
      sortOption = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;
    const total = await Question.countDocuments(filter);

    const QAs = await Question.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit)); // Chuyển limit thành số

    res.status(200).json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
      data: QAs
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách Q&A:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau."
    });
  }
}

// them ham xu li moi cho FAQ
const getAllFAQ = async (req, res) => {
  const { sort, title, message, page = 1, limit = 10, searchId } = req.query;

  try {
    let filter = {};

    if (searchId) {
      filter.userId = searchId;
    }
    if (title) {
      filter.title = title;
    }
    if (message) {
      filter.message = message;
    }

    // Chỉ lấy các câu đã được đánh dấu là FAQ
    filter.isFaq = true;

    // Xử lý sắp xếp
    let sortOption = {};
    if (sort) {
      const [field, order] = sort.split('_');
      sortOption[field] = order === 'asc' ? 1 : -1;
    } else {
      sortOption = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;
    const total = await Question.countDocuments(filter);

    const QAs = await Question.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit)); // Chuyển limit thành số

    res.status(200).json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
      isFaq: QAs.isFaq,
      data: QAs
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách Q&A:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau.",
      error: error.message
    });
  }
};


////// ham mark as FAQ
const markAsFAQ = async (req, res) => {
  const { id } = req.params;

  try {
    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({ success: false, message: "Câu hỏi không tồn tại." });
    }

    question.isFaq = true;
    await question.save();

    return res.status(200).json({ success: true, message: "Đã đánh dấu câu hỏi là FAQ." });
  } catch (error) {
    console.error("Lỗi khi đánh dấu FAQ:", error);
    return res.status(500).json({ success: false, message: "Lỗi server." });
  }
};
//


const Schedule = require('../../models/Schedule');

const createSchedule = async (req, res) => {
  try {
    const { employeeId, department, date, timeSlots } = req.body;

    if (!employeeId || !department || !date || !timeSlots || !Array.isArray(timeSlots)) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newSchedule = new Schedule({ employeeId, department, date, timeSlots });
    await newSchedule.save();

    return res.status(201).json({ message: "Schedule created successfully", schedule: newSchedule });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getSchedules = async (req, res) => {
  try {
    const query = {};
    if (req.query.employeeId) query.employeeId = req.query.employeeId;
    if (req.query.date) query.date = new Date(req.query.date);

    const schedules = await Schedule.find(query).populate('employeeId');

    return res.status(200).json(schedules);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, department, date, timeSlots } = req.body;

    if (!employeeId || !department || !date || !timeSlots) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const updatedSchedule = await Schedule.findByIdAndUpdate(id, {
      employeeId,
      department,
      date,
      timeSlots,
    }, { new: true });

    if (!updatedSchedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    return res.status(200).json({ message: "Schedule updated successfully", schedule: updatedSchedule });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Schedule.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    return res.status(200).json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getFeedbacksForStaff = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('userId', 'name')
      .populate({
        path: 'appointmentId',
        populate: { path: 'doctorId', select: 'name' }, // Populate nested để lấy tên bác sĩ
        select: 'appointmentDate doctorId'
      });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
};

const approveCancellation = async (req, res) => {
  const { id } = req.params; // appointmentId
  const staffId = req.user.id;

  // Kiểm tra role
  if (req.user.role !== 'Staff' && req.user.role !== 'Admin') {
    return res.status(403).json({ message: "Bạn không có quyền duyệt" });
  }

  try {
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Lịch hẹn không tồn tại" });
    }

    if (appointment.status !== 'PendingCancel') {
      return res.status(400).json({ message: "Lịch hẹn không ở trạng thái chờ duyệt" });
    }

    // Cập nhật trạng thái thành Canceled
    appointment.status = 'Canceled';
    await appointment.save();

    // Tạo notification cho user
    const userNotification = new Notification({
      title: "Lịch hẹn đã được hủy",
      content: `Lịch hẹn ID: ${id} của bạn đã được hủy thành công bởi staff.`,
      isUrgent: false,
      receiver: appointment.userId, // Gửi cho user cụ thể
    });
    await userNotification.save();

    res.status(200).json({ message: "Hủy lịch hẹn thành công", appointment });
  } catch (err) {
    res.status(500).json({ message: "Duyệt hủy thất bại", error: err.message });
  }
};
module.exports = {
  createCheckup,
  replyQA,
  getAllQA,
  createSchedule,
  getSchedules,
  updateSchedule,
  deleteSchedule,
  getFeedbacksForStaff,
  getAllFAQ,
  markAsFAQ,
  approveCancellation,
};
