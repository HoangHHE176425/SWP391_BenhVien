const mongoose = require("mongoose");
const LabTestSchema = require("../../models/LabTest");
const UserSchema = require("../../models/User");

module.exports.create = async (req, res) => {
    const { services } = req.body;
    await createLab(services);

    res.status(201).json({
        message: "Created successfully",
        data: entity
    });
}

module.exports.updateModel = async (id, result, dayTest) => {
    const model = await LabTestSchema.findById(id);
    if (model) {
        model.result = result;
        model.dayTest = dayTest
        return await model.save();
    }
}

module.exports.createLab = async (services) => {
    const model = new LabTestSchema({
        services
    });

    return await model.save();
}

module.exports.createLabTest = async (req, res) => {
    const {
        fullName,
        gender,
        sampleType,
        collectionDate,
        containerType
    } = req.body;

    const entity = new LabTestSchema({
        fullName,
        gender,
        sampleType,
        collectionDate,
        collectedBy: "abc",
        containerType
    });

    await entity.save();

    res.status(201).json({
        message: "Created successfully",
        data: entity
    });
}

module.exports.getAll = async (req, res) => {
   const data = await LabTestSchema.find({})
    res.status(200).json({
        data,
        message: "Created successfully"
    });
}

module.exports.findById = async (req, res) => {
    const id = req.params.testId

    const testLab = await LabTestSchema.findById(id);
    res.status(200).json({
        data: testLab
    })
}

