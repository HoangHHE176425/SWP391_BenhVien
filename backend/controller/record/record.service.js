const Appointment = require("../../models/Appointment");
const Records = require("../../models/Records");

class RecordService {
    async createRecord(req, res) {
       try {
        const newRecord = new Records({
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: req.body.services.length > 0 ? "pending_clinical" : "done",
        });
        const savedRecord = await newRecord.save();
        await Appointment.findByIdAndUpdate(req.body.appointmentId, {
            status: req.body.services.length > 0 ? "pending_clinical" : "done",
            updatedAt: new Date(),
        });
        res.status(201).json({ success: true, data: savedRecord, message: "Record created successfully" });
       } catch (err) {
        res.status(500).json({ success: false, message: err.message });
       }
    }

    async getRecords(req, res) {
        const { status, patientId, appointmentId } = req.query;
        try {
            const records = await Records.find({
                ...(status && {status}), 
                ...(patientId && {patientId}), 
                ...(appointmentId && {appointmentId})
            })
            .populate('services')
            .populate('appointmentId', 'appointmentDate type status reminderSent')
            .populate('profileId')
            .populate('doctorId')
            .populate('department')
            .sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: records });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getRecordById(req, res) {
        try {
            const record = await Records.findById(req.params.id)
                .populate('services')
                .populate('appointmentId')
                .populate('profileId')
                .populate('doctorId')
                .populate('department');
            if (!record) {
                return res.status(404).json({ success: false, message: "Record not found" });
            }
            res.status(200).json({ success: true, data: record });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateRecord(req, res) {
        try {
            const updatedRecord = await Records.findByIdAndUpdate(
                req.params.id,
                {
                    ...req.body,
                    updatedAt: new Date()
                },
                { new: true }
            ).populate('services')
             .populate('appointmentId')
             .populate('profileId')
             .populate('doctorId')
             .populate('department');
            
            if (!updatedRecord) {
                return res.status(404).json({ success: false, message: "Record not found" });
            }
            res.status(200).json({ success: true, data: updatedRecord, message: "Record updated successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async deleteRecord(req, res) {
        try {
            const deletedRecord = await Records.findByIdAndDelete(req.params.id);
            if (!deletedRecord) {
                return res.status(404).json({ success: false, message: "Record not found" });
            }
            res.status(200).json({ success: true, message: "Record deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = { RecordService };