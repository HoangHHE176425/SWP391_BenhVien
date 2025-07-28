const Profile = require("../../models/Profile");
const User = require("../../models/User");
// Tạo hồ sơ bệnh nhân
exports.createProfile = async (req, res) => {
    try {
        const { name, dateOfBirth, identityNumber, gender } = req.body;
        const userId = req.user.id;

        const birthDate = new Date(dateOfBirth);
        const now = new Date();

        if (birthDate > now) {
            return res.status(400).json({ message: 'Date of birth cannot be in the future' });
        }

        const newProfile = new Profile({ userId, name, dateOfBirth, identityNumber, gender });
        await newProfile.save();

        await User.findByIdAndUpdate(userId, {
            $push: { profiles: newProfile._id }
        });

        res.status(201).json({ message: 'Profile created successfully', profile: newProfile });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create profile', error: err.message });
    }
};

// Lấy danh sách hồ sơ của chính người dùng
exports.getProfilesByUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const profiles = await Profile.find({ userId })
            .populate('medicine', 'name')  // Populate tên thuốc từ Medicine
            .populate('service', 'name')   // Populate tên dịch vụ từ Services
            .populate('doctorId', 'name') // Populate tên bác sĩ từ Employee
            .populate({
                path: 'labTestId',         // Populate LabTest
                populate: { path: 'services', select: 'name' }  // Populate services trong LabTest
            });
        res.status(200).json(profiles);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch profiles', error: err.message });
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
