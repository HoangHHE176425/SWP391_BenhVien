const Appointment = require("../../models/Appointment");
const Records = require("../../models/Records");

class RecordService {
    async createRecord(req, res) {
       console.log("🚀 ~ RecordService ~ createRecord ~ req:", req.body)
       try {
        const {department, ...rest} = req.body;
        const prescriptionCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const newRecord = new Records({
            ...rest,
            ...(department && {department: department}),
            ...(rest.prescription
                && rest.prescription.length > 0 && {prescriptionCode: prescriptionCode}),
            createdAt: new Date(),
            updatedAt: new Date(),
            status: "done",
        });
        const savedRecord = await newRecord.save();
        console.log('rest.docterAct', rest.docterAct);
        await Appointment.findByIdAndUpdate(rest.appointmentId, {
            ...(rest.docterAct && {doctorId: rest.docterAct}),
            ...(!rest.docterAct && {status: "done"}),
            updatedAt: new Date(),
        });
        res.status(201).json({ success: true, data: savedRecord, message: "Record created successfully" });
       } catch (err) {
        console.log("🚀 ~ RecordService ~ createRecord ~ err:", err)
        res.status(500).json({ success: false, message: err.message });
       }
    }

    async getRecords(req, res) {
        const { status, patientId, appointmentId, docterAct } = req.query;
        try {
            const records = await Records.find({
                ...(status && {status}), 
                ...(patientId && {patientId}), 
                ...(appointmentId && {appointmentId}),
                ...(docterAct && {docterAct: docterAct})
            })
            .populate('appointmentId', 'appointmentDate type status reminderSent')
            .populate('profileId')
            .populate('doctorId')
            .populate({
                path: 'prescription.medicine'
              })
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
            console.log(req.body);
            const updatedRecord = await Records.findByIdAndUpdate(
                req.params.id,
                {
                    ...req.body,
                    updatedAt: new Date()
                }
            ).populate('services')
             .populate('appointmentId')
             .populate('profileId')
             .populate('doctorId')
             .populate('department');


            if (req.body.status === "done") {
                await Appointment.findByIdAndUpdate(req.body.appointmentId, {
                    status: "done",
                    updatedAt: new Date(),
                });
            } else if (req.body.status === "pending_re-examination") {
                await Appointment.findByIdAndUpdate(req.body.appointmentId, {
                    status: "pending_re-examination",
                    updatedAt: new Date(),
                });
            }
            
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