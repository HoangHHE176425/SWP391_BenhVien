const express = require('express');
const authRouter = express.Router();
const {
  Login,
  Signup,
  check,
  changePassword,
  forgotPassword,
  resetPassword,
  googleLogin,
  googleRegister,
  googleCompleteRegister,
  checkPhone,
} = require('../../controller/auth/authServices');
const { authMiddleware, ismeomeo } = require('../../middleware/auth.middleware');

// Đăng nhập / đăng ký truyền thống
authRouter.post('/login', Login);
authRouter.post('/signup', Signup);

// Đổi / quên mật khẩu
authRouter.post('/updatePassword', changePassword);
authRouter.post('/forgotPassword', forgotPassword);
authRouter.post('/resetPassword', resetPassword);

// Google Auth
authRouter.post('/google-login', googleLogin); // Đăng nhập bằng Google
authRouter.post('/google-register', googleRegister); // Đăng ký mới bằng Google
authRouter.post('/complete-profile', googleCompleteRegister); // Hoàn thiện hồ sơ sau khi Google xác thực

// Kiểm tra số điện thoại
authRouter.post("/check-phone", checkPhone);

module.exports = authRouter;
