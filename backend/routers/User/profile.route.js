const express = require('express');
const profileRouter = express.Router();
const { CreateProfile, updateProfile, deleteProfile, getByCccd } = require("../../controller/user/profileService");
const { authMiddleware } = require("../../middleware/auth.middleware");

profileRouter.get('/', (req, res) => {
    res.send("Profile route is working!");
});

profileRouter.post('/create', CreateProfile);
profileRouter.get('/cccd', getByCccd);
profileRouter.put('/update/:id', authMiddleware, updateProfile);
profileRouter.delete('/delete/:id', authMiddleware, deleteProfile);

module.exports = profileRouter;
