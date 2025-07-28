const express = require('express');
const { createProfile, getAllProfiles, getProfileById, updateProfileById } 
= require('../../controller/user/userMedicalProfile.controller');

const router = express.Router();

router.post('/create', createProfile);
router.get('/all', getAllProfiles);
router.get('/all/:profileId', getProfileById);
router.put('/:id', updateProfileById);

module.exports = router;
