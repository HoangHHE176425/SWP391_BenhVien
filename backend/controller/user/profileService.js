const Profile = require("../../models/Profile");
const User = require("../../models/User");
const Patient = require("../../models/Patient");

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
            return res.json({profile });
        }
        return res.json({ profile: null});
    } catch (error) {
        res.status(500).json({ error: error.message || 'Lỗi server' });
    }

};

// Cập nhật hồ sơ bệnh nhân
exports.updateProfile = async (req, res) => {
    const { id } = req.params;
    const { name, dateOfBirth, identityNumber, gender } = req.body;
    const userId = req.user.id;

    try {
        const birthDate = new Date(dateOfBirth);
        const now = new Date();

        if (birthDate > now) {
            return res.status(400).json({ message: 'Date of birth cannot be in the future' });
        }

        const profile = await Profile.findOneAndUpdate(
            { _id: id, userId },
            { name, dateOfBirth, identityNumber, gender },
            { new: true }
        );

        if (!profile) {
            return res.status(404).json({ message: 'Profile not found or unauthorized' });
        }

        res.status(200).json({ message: 'Profile updated successfully', profile });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update profile', error: err.message });
    }
};

// Xóa hồ sơ bệnh nhân
exports.deleteProfile = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const profile = await Profile.findOneAndDelete({ _id: id, userId });

        if (!profile) {
            return res.status(404).json({ message: 'Profile not found or unauthorized' });
        }

        res.status(200).json({ message: 'Profile deleted successfully', profile });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete profile', error: err.message });
    }
};
