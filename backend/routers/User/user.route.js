const { authMiddleware } = require("../../middleware/auth.middleware");
const express = require("express");
const verifyToken = require("../../middleware/verifyToken");
const userService = require("../../controller/user/userService");
const userRouter = express.Router();
const User = require("../../models/User"); // đường dẫn đúng đến file User.js
const Department = require("../../models/Department");

const { verifyToken1 } = require("../../middleware/tokencheck");
const Employee = require("../../models/Employee");
// Update user by ID
userRouter.put("/update", async (req, res) => {
  try {
    const { email, name, phone, status, department, specialization } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Chuẩn bị field chung cần cập nhật
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (status !== undefined) updateFields.status = status;

    // Thử cập nhật trong User trước
    let updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: updateFields },
      { new: true }
    );

    // Nếu không có trong User thì kiểm tra trong Employee
    if (!updatedUser) {
      const employee = await Employee.findOne({ email });

      if (!employee) {
        return res
          .status(404)
          .json({ message: "User or employee not found with this email" });
      }

      // Nếu là Doctor, cho phép cập nhật thêm department và specialization
      if (employee.role === "Doctor") {
        if (department !== undefined) {
          const deptDoc = await Department.findById(department);
          if (!deptDoc) {
            return res.status(400).json({
              message: "Department not found with id: " + department,
            });
          }
          updateFields.department = deptDoc._id;
        }

        if (specialization !== undefined)
          updateFields.specialization = specialization;
      }

      updatedUser = await Employee.findOneAndUpdate(
        { email },
        { $set: updateFields },
        { new: true }
      );
    }

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});
const {
  createPaymentLinkEmbedded, createPaymentLinkEmbeddedForBookAppointment
} = require("../../controller/staff/PaymentController");
const {
  getAllInvoices4User,
  CompletedInvoices,
} = require("../../controller/staff/InvoiceController");
const {
  createAppointment,
  getAppointmentsByUser,
  cancelAppointment,
  createFeedback,
  createGuestFeedback,
} = require("../../controller/user/userService");
const { getAllFAQ, markAsFAQ } = require("../../controller/staff/staffService");

userRouter.get(
  "/getNoti",
  authMiddleware,
  require("../../controller/staff/notificationService").getUserNotifications
);
userRouter.put(
  "/markRead/:id",
  authMiddleware,
  require("../../controller/staff/notificationService").markAsRead
);

userRouter.get("/invoices", verifyToken1, getAllInvoices4User);
userRouter.post("/create-link", createPaymentLinkEmbedded);
userRouter.post("/create-link-appointment", createPaymentLinkEmbeddedForBookAppointment);

userRouter.put("/pay/success", CompletedInvoices);

userRouter.get("/profile/my-records", verifyToken1, userService.getMyProfiles);
userRouter.post("/qa", userService.sendQA);
userRouter.get("/qahistory", userService.getAllQAUser);

// them router FAQ
userRouter.get('/faqs',getAllFAQ);

////

userRouter.get("/", (req, res) => {
  res.send("User route is working!");
});

userRouter.post("/create", authMiddleware, createAppointment);
userRouter.get("/user", authMiddleware, getAppointmentsByUser);
userRouter.post("/cancel/:id", authMiddleware, cancelAppointment);
userRouter.post('/createFeedback', authMiddleware, createFeedback);
userRouter.post('/feedback/guest', createGuestFeedback);

userRouter.get('/doctor', userService.getAllDoctors);
userRouter.get('/doctor/:doctorId', userService.getDoctorById);
userRouter.get('/service', userService.getAllServices);
userRouter.get('/service/:serviceId', userService.getServiceById);
userRouter.get('/department', userService.getAllDepartment);
userRouter.get('/department/:departmentId', userService.getDepartmentById);
userRouter.get('/medicines', userService.getAllMedicines);
userRouter.get('/medicines/:medicineId', userService.getMedicineById);

module.exports = userRouter;