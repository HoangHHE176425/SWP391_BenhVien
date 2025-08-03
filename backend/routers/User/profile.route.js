const express = require('express');
const profileRouter = express.Router();
const { CreateProfile, updateProfile, getByCccd, getRecordsByProfileId, getAllProfiles } = require("../../controller/user/profileService");
const { authMiddleware } = require("../../middleware/auth.middleware");

profileRouter.get('/', (req, res) => {
    res.send("Profile route is working!");
});

profileRouter.post('/create', CreateProfile);
profileRouter.get('/cccd', getByCccd);
profileRouter.put('/update/:id', updateProfile);
// profileRouter.delete('/delete/:id', authMiddleware, deleteProfile);
profileRouter.get('/record/:profileId', getRecordsByProfileId);
profileRouter.get('/all', getAllProfiles);

module.exports = profileRouter;
