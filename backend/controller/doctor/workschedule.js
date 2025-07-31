const Schedule = require("../../models/Schedule");
const Department = require("../../models/Department");

const getByDoctor = async (req, res) => {
  const doctorId = req.params.id;
  try {
    const schedules = await Schedule.find({ employeeId: doctorId });

    const enrichedSchedules = await Promise.all(
      schedules.map(async (schedule) => {
        const departmentName = await getDepartmentNameById(schedule.department);
        return {
          ...schedule.toObject(),
          departmentName, 
        };
      })
    );

    res.status(200).json({ data: enrichedSchedules });
  } catch (error) {
    res.status(500).json({ msg: "Lỗi server", error });
  }
};


const getDepartmentNameById = async (id) => {
  const department = await Department.findById(id);
  return department ? department.name : null;
};

module.exports = { getByDoctor };
