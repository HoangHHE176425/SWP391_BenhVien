const express = require('express');
const { createLabTest, getAll, findById, create } = require('../../controller/labtest/labTestServices');

const labTestRouter = express.Router();

labTestRouter.post('/create', createLabTest);
labTestRouter.post('/new', create);
labTestRouter.post('/update', create);

labTestRouter.get('/all', getAll);
labTestRouter.get('/all/:testId', findById);

module.exports = labTestRouter;