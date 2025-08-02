const express = require("express");
const { authStaffMiddleware } = require("../../middleware/auth.middleware");
const staffRouter = express.Router();
const {
  getNotifications,
  createNotification,
  markUrgent,
  deleteNotification,
  getAllUserEmails,
} = require("../../controller/staff/notificationService");
const { getAllQA, replyQA, createCheckup, createSchedule, getSchedules, updateSchedule, deleteSchedule, getFeedbacks, approveCancellation } = require('../../controller/staff/staffService');
const { getAllServices, createService, deleteService, getServiceById, updateService } = require('../../controller/staff/servicesControlelr');
const staffController = require('../../controller/staff/staffService');
staffRouter.post('/qa/:id/mark-as-faq',staffController.markAsFAQ); // them api moi
const { createMedicalRecord, allMedicalRecord, editMedicalRecord, createProfile, getAllProfiles } = require('../../controller/staff/medicalRecordController');
const paymentController = require('../../controller/staff/PaymentController');
const doctorServices = require('../../controller/doctor/doctorService');
const invoiceController = require('../../controller/staff/InvoiceController');
staffRouter.post('/create-payment-link', paymentController.createPaymentLink);
staffRouter.post('/webhook', paymentController.handleWebhook);
staffRouter.get('/success/:paymentId', paymentController.paymentSuccess);
staffRouter.get('/cancel', paymentController.paymentCancel);
staffRouter.get('/medical-records', getAllProfiles);
staffRouter.post('/medical-record', createProfile);
staffRouter.put('/medical-records/:id', editMedicalRecord);
staffRouter.get('/invoices', invoiceController.getAllInvoices);
staffRouter.get('/services/:invoiceId', invoiceController.getServices);
staffRouter.post('/invoices', invoiceController.CreateInvoices);
staffRouter.post('/appointmentinvoices', invoiceController.CreateInvoices2);
staffRouter.get("/services", invoiceController.getAllServices);
staffRouter.put('/services/paid/:invoiceId', paymentController.paidServices);
staffRouter.delete('/services/delete/:invoiceId', paymentController.deleteInvoice);
staffRouter.get('/payments', paymentController.getPayments);
staffRouter.get("/payments/summary", paymentController.getPaymentSummary);
staffRouter.get("/profiles/:userId", invoiceController.getProfilesByUserId)
staffRouter.get('/doctors', doctorServices.getAllDoctors);
staffRouter.get('/:userId/profiles', doctorServices.getProfilesByUserId);
staffRouter.get("/abc/services", invoiceController.getAllServices);
// Checkup
staffRouter.post('/checkup', createCheckup);

// Schedule
staffRouter.post('/schedule', createSchedule);
staffRouter.get('/schedule', getSchedules);
staffRouter.put('/schedule/:id', updateSchedule);
staffRouter.delete('/schedule/:id', deleteSchedule);
staffRouter.get("/getNoti", getNotifications);
staffRouter.post("/createNoti", createNotification);
staffRouter.put("/urgent/:id", markUrgent);
staffRouter.delete("/deleteNoti/:id", deleteNotification);
staffRouter.get("/getAllUserEmails", getAllUserEmails);

// Services routes
staffRouter.get('/all/services', getAllServices); // GET /api/staff/services - Get all services with pagination, sorting, search
staffRouter.get('/get/services/:id', getServiceById); // GET /api/staff/services/:id - Get a single service by ID
staffRouter.post('/create/services', createService); // POST /api/staff/services - Create a new service
staffRouter.put('/update/services/:id', updateService); // PUT /api/staff/services/:id - Update a service
staffRouter.delete('/delete/services/:id', deleteService); // DELETE /api/staff/services/:id - Delete a service
// staffRouter.get('/labtestresult/:profileId', LabTestbyProfileId);
staffRouter.get('/qa',getAllQA);
staffRouter.put('/qa/:id',replyQA);

// Feedback
staffRouter.get('/feedback', getFeedbacks);
staffRouter.post('/:id/approve', authStaffMiddleware, approveCancellation);

module.exports = staffRouter;