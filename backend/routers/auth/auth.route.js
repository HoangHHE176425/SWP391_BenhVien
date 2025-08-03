const express = require('express');
const authRouter = express.Router();
const { Login, Signup, check, changePassword, forgotPassword, resetPassword, googleLogin, googleCompleteRegister, checkPhone,} = require('../../controller/auth/authServices');
const { authMiddleware, ismeomeo } = require('../../middleware/auth.middleware');

authRouter.post('/login', Login);
authRouter.post('/signup', Signup);
authRouter.post('/updatePassword', changePassword);

// authRouter.post('/authMiddleware', authMiddleware, ismeomeo, check);
authRouter.post('/forgotPassword', forgotPassword);
authRouter.post('/resetPassword', resetPassword);
authRouter.post('/google-login', googleLogin);
authRouter.post('/google-complete-register', googleCompleteRegister);
authRouter.post("/check-phone", checkPhone);

module.exports = authRouter;