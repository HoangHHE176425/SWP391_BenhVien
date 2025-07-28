const Profile = require("../../models/Profile");
const Employee = require('../../models/Employee');
const Medicine = require("../../models/Medicine");
const User = require("../../models/User");
const Service = require("../../models/Service");

// Hàm kiểm tra ngày sinh hợp lệ
const isValidDateOfBirth = (dateOfBirth) => {
  const currentDate = new Date();
  const inputDate = new Date(dateOfBirth);
  return inputDate <= currentDate;
};

// Get all profiles with userId
exports.getAllProfile = async (req, res) => {
  try {
    const profiles = await Profile.find()
      .populate('userId', 'name')
      .populate('doctorId', 'name email role')
      .populate('medicine', 'name type unitPrice')
      .populate('service', 'name price')
      .populate('labTestId', 'result dayTest');

    const formattedProfiles = profiles.map(profile => ({
      _id: profile._id,
      name: profile.name,
      userName: profile.userId?.name || "N/A",
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      identityNumber: profile.identityNumber,
      diagnose: profile.diagnose,
      note: profile.note,
      issues: profile.issues,
      doctor: profile.doctorId ? {
        _id: profile.doctorId._id,
        name: profile.doctorId.name,
        email: profile.doctorId.email,
        role: profile.doctorId.role
      } : null,
      medicines: profile.medicine?.map(med => ({
        _id: med._id,
        name: med.name,
        type: med.type,
        unitPrice: med.unitPrice
      })) || [],
      services: profile.service?.map(serv => ({
        _id: serv._id,
        name: serv.name,
        price: serv.price
      })) || [],
      labTest: profile.labTestId ? {
        _id: profile.labTestId._id,
        result: profile.labTestId.result,
        dayTest: profile.labTestId.dayTest
      } : null,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    }));

    res.json({
      success: true,
      data: formattedProfiles
    });
  } catch (error) {
    console.error('Lỗi khi lấy tất cả hồ sơ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách hồ sơ',
      error: error.message
    });
  }
};



// Create profile (luồng STAFF)
exports.createProfile = async (req, res) => {
  try {

    // Chỉ lấy các trường cần thiết từ req.body
    const { name, identityNumber, dateOfBirth, gender } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name?.trim() || !identityNumber?.trim() || !dateOfBirth || !gender) {
      return res.status(400).json({
        success: false,
        message: 'Tên, CCCD, ngày sinh, và giới tính là bắt buộc'
      });
    }

    // Kiểm tra định dạng ngày sinh
    if (!isValidDateOfBirth(dateOfBirth)) {
      return res.status(400).json({
        success: false,
        message: 'Ngày sinh không hợp lệ hoặc vượt quá ngày hiện tại'
      });
    }

    // Kiểm tra giới tính
    if (!['Male', 'Female', 'Other'].includes(gender)) {
      return res.status(400).json({
        success: false,
message: 'Giới tính không hợp lệ'
      });
    }

    // Tạo hồ sơ với các trường khác là null
    const profile = new Profile({
      name,
      identityNumber,
      dateOfBirth,
      gender,
      userId: null,
      diagnose: null,
      note: null,
      issues: null,
      doctorId: null,
      medicine: null,
      service: null
    });

    const savedProfile = await profile.save();

    res.status(201).json({
      success: true,
      data: {
        _id: savedProfile._id,
        name: savedProfile.name,
        identityNumber: savedProfile.identityNumber,
        dateOfBirth: savedProfile.dateOfBirth,
        gender: savedProfile.gender,
        userId: savedProfile.userId,
        diagnose: savedProfile.diagnose,
        note: savedProfile.note,
        issues: savedProfile.issues,
        doctorId: savedProfile.doctorId,
        medicine: savedProfile.medicine,
        service: savedProfile.service,
        createdAt: savedProfile.createdAt
      }
    });
  } catch (error) {
    console.error('Lỗi khi tạo hồ sơ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo hồ sơ',
      error: error.message
    });
  }
};

// Update profile (luồng STAFF)
exports.updateProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { name, identityNumber, dateOfBirth, gender } = req.body;

    // Tìm profile theo ID
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ'
      });
    }

    // Chuẩn bị dữ liệu cập nhật
    const updateData = {};

    // Chỉ cho phép cập nhật các trường được phép
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tên không được để trống'
        });
      }
      updateData.name = name;
    }
    if (identityNumber !== undefined) {
      if (!identityNumber.trim()) {
        return res.status(400).json({
          success: false,
          message: 'CCCD không được để trống'
        });
      }
      updateData.identityNumber = identityNumber;
    }
    if (dateOfBirth !== undefined) {
      if (!isValidDateOfBirth(dateOfBirth)) {
        return res.status(400).json({
          success: false,
          message: 'Ngày sinh không hợp lệ hoặc vượt quá ngày hiện tại'
        });
      }
      updateData.dateOfBirth = dateOfBirth;
    }
    if (gender !== undefined) {
      if (!['Male', 'Female', 'Other'].includes(gender)) {
        return res.status(400).json({
          success: false,
          message: 'Giới tính không hợp lệ'
        });
      }
      updateData.gender = gender;
    }

    // Kiểm tra xem có dữ liệu nào để cập nhật không
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
success: false,
        message: 'Không có trường hợp lệ nào được cung cấp để cập nhật'
      });
    }

    // Cập nhật hồ sơ
    const updatedProfile = await Profile.findByIdAndUpdate(
      profileId,
      { $set: updateData },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật hồ sơ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật hồ sơ',
      error: error.message
    });
  }
};

// Delete profile
exports.deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await Profile.findByIdAndDelete(id);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Hồ sơ không tìm thấy'
      });
    }

    // Chỉ cập nhật User nếu profile có userId
    if (profile.userId) {
      await User.findByIdAndUpdate(profile.userId, {
        $pull: { profiles: profile._id }
      });
    }

    res.json({
      success: true,
      message: 'Hồ sơ đã được xóa thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa hồ sơ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa hồ sơ',
      error: error.message
    });
  }
};

// Get doctors
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await Employee.find({ role: 'Doctor' }).select('name email role');
    res.json({
      success: true,
      data: doctors
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bác sĩ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách bác sĩ',
      error: error.message
    });
  }
};

// Get all medicines
exports.getAllMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find().select('name type unitPrice');
    res.json({
      success: true,
      data: medicines
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách thuốc:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thuốc',
      error: error.message
    });
  }
};

// Get all services
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find().select('name price');
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách dịch vụ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách dịch vụ',
      error: error.message
    });
  }
};

// Get profiles by user_id
exports.getProfileByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        success: false,
message: 'ID người dùng là bắt buộc'
      });
    }

    const user = await User.findById(user_id).select('name');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const profiles = await Profile.find({ userId: user_id })
      .populate('userId', 'name')
      .populate('doctorId', 'name email role')
      .populate('medicine', 'name type unitPrice')
      .populate('service', 'name price');

    const formattedProfiles = profiles.map(profile => ({
      _id: profile._id,
      name: profile.name,
      userName: profile.userId?.name || "N/A",
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      identityNumber: profile.identityNumber,
      diagnose: profile.diagnose,
      note: profile.note,
      issues: profile.issues,
      doctor: profile.doctorId ? {
        _id: profile.doctorId._id,
        name: profile.doctorId.name,
        email: profile.doctorId.email,
        role: profile.doctorId.role
      } : null,
      medicine: profile.medicine ? {
        _id: profile.medicine._id,
        name: profile.medicine.name,
        type: profile.medicine.type,
        unitPrice: profile.medicine.unitPrice
      } : null,
      service: profile.service ? {
        _id: profile.service._id,
        name: profile.service.name,
        price: profile.service.price
      } : null,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    }));

    res.json({
      success: true,
      data: formattedProfiles
    });
  } catch (error) {
    console.error('Lỗi khi lấy hồ sơ theo user_id:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy hồ sơ theo user_id',
      error: error.message
    });
  }
};
