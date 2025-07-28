const Profile = require("../../models/Profile");
const Service = require("../../models/Service");
const Employee = require('../../models/Employee');
const { createLab, updateModel } = require("../doctor/labTestServices")

const findUserByIdentity = async (req, res) => {
  try {
    // Lấy identityNumber từ URL mà frontend gửi lên
    const { identityNumber } = req.params;

    // Dùng Mongoose để tìm MỘT người dùng có identityNumber khớp
    // Giả sử trong User model của bạn có trường là 'identityNumber'
    const user = await User.findOne({ identityNumber: identityNumber });

    // Nếu không tìm thấy người dùng
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng với số ID này.' });
    }

    // Nếu tìm thấy, trả về thông tin người dùng với status 200 OK
    res.status(200).json(user);

  } catch (error) {
    // Nếu có lỗi server
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports = {
  findUserByIdentity,
};

module.exports.createProfile = async (req, res) => {
  const {
    name,
    dateOfBirth,
    gender,
    diagnose,
    note,
    issues,
    doctorId,
    medicine,
  } = req.body;

  try {
    const profile = new Profile({
      name,
      dateOfBirth,
      gender,
      diagnose,
      note,
      issues,
      doctorId,
      medicine,
    });

    await profile.save();

    res.status(201).json({
      message: "Created successfully",
      data: profile,
    });
  } catch (err) {
    console.error("Create error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getAllProfiles = async (req, res) => {
  try {
    const data = await Profile.find({}).populate("doctorId medicine");
    res.status(200).json({ data, message: "Retrieved successfully" });
  } catch (err) {
    console.error("Fetch all error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getProfilesByDoctor = async (req, res) => {
  const { doctorId } = req.params;

  try {
    const data = await Profile.find({ doctorId }).populate("doctorId medicine");
    res.status(200).json({ data });
  } catch (err) {
    console.error("Fetch by doctor ID error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getProfileById = async (req, res) => {
  const id = req.params.profileId;

  try {
    const profile = await Profile.findById(id).populate("doctorId medicine");

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({ data: profile });
  } catch (err) {
    console.error("Fetch by ID error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.deleteProfileById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Profile.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.updateProfileById = async (req, res) => {
  const { id } = req.params;

  const {
    name,
    dateOfBirth,
    gender,
    diagnose,
    note,
    issues,
    doctorId,
    medicine,
    service,
    result,
    dayTest
  } = req.body;

  console.log("Request: ", req.body)

  try {

    const doctor = await Employee.findById(doctorId);
    console.log("Doctor", doctor)

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    const serviceObj = await Service.find({
      _id: {
        $in: service
      }
    });

    let profile = await Profile.findById(id);
    let labTest;
    console.log("profile.labTestId", profile.labTestId)
    if (!profile.labTestId) {
      console.log("Create labtest")
      labTest = await createLab(serviceObj);
    } else if (result && dayTest) {
      updateModel(profile.labTestId, result, dayTest)
      labTest = profile.labTestId;
    }

    profile.name = name ? name : profile.name;
    profile.dateOfBirth = dateOfBirth ? dateOfBirth : profile.dateOfBirth;
    profile.gender = gender ? gender : profile.gender;
    profile.diagnose = diagnose ? diagnose : profile.diagnose;
    profile.note = note ? note : profile.note;
    profile.issues = issues ? issues : profile.issues;
    profile.doctorId = doctor._id;
    profile.medicine = medicine;
    profile.service = serviceObj;
    profile.labTestId = labTest ? labTest._id : null;

    // const updatedProfile = await Profile.findByIdAndUpdate(
    //   id,
    //   {
    //     name,
    //     dateOfBirth,
    //     gender,
    //     diagnose,
    //     note,
    //     issues,
    //     doctorId,
    //     medicine,
    //     service: serviceObj
    //   },
    //   { new: true }
    // ).populate("doctorId medicine labTestId");

    const savedProfile = await profile.save()

    const updatedProfile = await Profile.findById(id)
      .populate('doctorId')
      .populate('medicine')
      .populate('labTestId');
    if (!profile) {
      return res.status(404).json({ message: "Profile not found." });
    }

    res.status(200).json({
      message: "Updated successfully",
      data: updatedProfile,
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.searchByIdentityNumber = async (req, res) => {
  const { identityNumber } = req.params;

  try {
    const profiles = await Profile.find({ identityNumber })
      .populate("labTestId userId doctorId")
      .populate("medicine", "name");
    res.status(200).json({ data: profiles });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


