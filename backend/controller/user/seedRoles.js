const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Employee = require("../../models/Employee");

(async () => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const defaultPassword = "123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const employees = [
      { name: "Nguyễn Lễ Tân", email: "receptionist@example.com", role: "Receptionist" },
      { name: "Trần Dược Sĩ", email: "pharmacist@example.com", role: "Pharmacist" },
      { name: "Lê Bác Sĩ", email: "doctor@example.com", role: "Doctor" },
      { name: "Phạm Quản Lý", email: "hrmanager@example.com", role: "HRManager" },
      { name: "Vũ Kế Toán", email: "accountant@example.com", role: "Accountant" },
      { name: "Đặng Admin", email: "admin@example.com", role: "Admin" },
    ];

    const countExisting = await Employee.countDocuments();
    let codeIndex = countExisting;

    for (const emp of employees) {
      const existing = await Employee.findOne({ email: emp.email });
      if (existing) {
        console.log(`⚠️ Employee already exists: ${emp.email}`);
        continue;
      }

      codeIndex++;
      const employeeCode = "EMP" + String(codeIndex).padStart(3, "0");

      const newEmp = await Employee.create({
        ...emp,
        employeeCode,
        password: hashedPassword,
        status: 'active',
        phone: '0123456789',
      });

      console.log(`✅ Created employee: ${newEmp.name} (${newEmp.role}) - Code: ${newEmp.employeeCode}`);
    }

    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
})();
