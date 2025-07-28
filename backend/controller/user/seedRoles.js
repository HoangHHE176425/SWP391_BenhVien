// controller/user/createUser.js

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../../models/User");

(async () => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const email = "user@example.com";
    const password = "123"; // plaintext password
    const name = "Test User";
    const phone = "0123456789";

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("⚠️ User already exists:", email);
      return process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
    });

    console.log("✅ User created successfully:");
    console.log("📧 Email:", newUser.email);
    console.log("🔐 Password (plaintext):", password);
    console.log("🆔 user_code:", newUser.user_code);

    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  } catch (err) {
    console.error("❌ Error creating user:", err);
    process.exit(1);
  }
})();
