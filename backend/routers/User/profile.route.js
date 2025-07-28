const express = require('express');
const profileRouter = express.Router();
const { createProfile, getProfilesByUser, updateProfile, deleteProfile } = require("../../controller/user/profileService");
const { authMiddleware } = require("../../middleware/auth.middleware");

profileRouter.get('/', (req, res) => {
    res.send("Profile route is working!");
});

profileRouter.post('/create', authMiddleware, createProfile);
profileRouter.get('/user', authMiddleware, getProfilesByUser);
profileRouter.put('/update/:id', authMiddleware, updateProfile);
profileRouter.delete('/delete/:id', authMiddleware, deleteProfile);

module.exports = profileRouter;
