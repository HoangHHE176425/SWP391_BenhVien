const Profile = require("../../models/Profile");
const User = require("../../models/User");
const Patient = require("../../models/Patient");
const Records = require("../../models/Records");

//tạo hồ sơ
exports.CreateProfile = async (req, res) => {
    const { identityNumber, name, dateOfBirth, gender, phone } = req.body;

    // Validate input
    if (!identityNumber || !name || !dateOfBirth || !gender || !phone) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    try {
        const existing = await Profile.findOne({ identityNumber });
        if (existing) {
            return res.status(400).json({ error: 'CCCD đã tồn tại' });
        }

        // Tạo Profile
        const profile = new Profile({ name, dateOfBirth, gender, identityNumber, phone });
        await profile.save();

        // Tạo Patient 1-1
        const patient = new Patient({ profileId: profile._id, createdBy: null });
        await patient.save();

        // Gán patientId vào Profile
        profile.patientId = patient._id;
        await profile.save();

        res.status(201).json({ message: 'Tạo Profile và Patient mới thành công', profile, patient });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Lỗi server' });
    }
};

exports.getByCccd = async (req, res) => {
    const { identityNumber } = req.query;

    try {
        const profile = await Profile.findOne({ identityNumber }).populate('patientId');
        if (profile) {
            return res.json({ profile });
        }
        return res.json({ profile: null });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Lỗi server' });
    }

};


// Cập nhật profile
exports.updateProfile = async (req, res) => {
    const { id } = req.params;
    const { name, dateOfBirth, gender, identityNumber, phone } = req.body;

    try {
        const birthDate = new Date(dateOfBirth);
        const now = new Date();

        if (birthDate > now) {
            return res.status(400).json({
                success: false,
                message: 'Ngày sinh không thể ở tương lai'
            });
        }

        if (!/^0\d{9}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Số điện thoại phải là 10 chữ số, bắt đầu bằng 0'
            });
        }

        const profile = await Profile.findOneAndUpdate(
            { _id: id }, // Bỏ điều kiện userId
            { name, dateOfBirth, gender, identityNumber, phone },
            { new: true }
        );

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Hồ sơ không tìm thấy'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Cập nhật hồ sơ thành công',
            profile
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

exports.getRecordsByProfileId = async (req, res) => {
    const { profileId } = req.params; // Lấy profileId từ params (ví dụ: /api/records/profile/:profileId)

    try {
        // Query records theo profileId
        const records = await Records.find({ profileId })
            .populate('doctorId', 'name specialty') // Populate doctorId, chỉ lấy name và specialty
            .populate('appointmentId', 'appointmentDate status') // Populate appointmentId, lấy các trường cần
            // .populate('department', 'name') // Populate department
            .populate('prescription.medicine', 'name dosage') // Populate mảng medicine trong prescription
            .populate('docterAct', 'name') // Populate docterAct
            .sort({ createdAt: -1 }) // Sắp xếp theo createdAt giảm dần (mới nhất đầu tiên)
            .exec(); // Thực thi query

        if (!records || records.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy records cho profile này'
            });
        }

        return res.status(200).json({
            success: true,
            data: records
        });
    } catch (error) {
        console.error('Lỗi khi lấy records theo profileId:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

exports.getAllProfiles = async (req, res) => {
  const { search = "" } = req.query;

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { identityNumber: { $regex: search, $options: 'i' } }
    ];
  }

  try {
    const profiles = await Profile.find(query).sort({ createdAt: -1 });

    res.json({ profiles });
  } catch (error) {
    console.error("[ERROR] getAllProfiles:", error);
    res.status(500).json({ error: error.message || 'Lỗi server' });
  }
};