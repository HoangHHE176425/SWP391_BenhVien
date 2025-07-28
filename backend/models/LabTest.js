const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    result: {
        type: String,
    },
    dayTest: {
        type: Date
    },
    services: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Services"
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('LabTest', labTestSchema)