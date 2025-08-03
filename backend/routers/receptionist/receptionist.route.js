const express = require("express");
const { authReceptionistMiddleware } = require("../../middleware/auth.middleware");
const receptionistRouter = express.Router();
const {
  getNotifications,
  createNotification,
  markUrgent,
  deleteNotification,
  getAllUserEmails,
} = require("../../controller/receptionist/notificationService");
const { getAllQA, replyQA, createCheckup, createSchedule, getSchedules, updateSchedule, deleteSchedule, getFeedbacksForReceptionist, approveCancellation} = require('../../controller/receptionist/receptionistService');
const { getAllServices, createService, deleteService, getServiceById, updateService, toggleServiceStatus, getServiceLogs, } = require('../../controller/admin/servicesControlelr');
const receptionistController = require('../../controller/receptionist/receptionistService');
receptionistRouter.post('/qa/:id/mark-as-faq',receptionistController.markAsFAQ); // them api moi
const { createMedicalRecord, allMedicalRecord, editMedicalRecord, createProfile, getAllProfiles } = require('../../controller/receptionist/medicalRecordController');
const paymentController = require('../../controller/receptionist/PaymentController');
const doctorServices = require('../../controller/doctor/doctorService');
const invoiceController = require('../../controller/receptionist/InvoiceController');
receptionistRouter.post('/create-payment-link', paymentController.createPaymentLink);
receptionistRouter.post('/webhook', paymentController.handleWebhook);
receptionistRouter.get('/success/:paymentId', paymentController.paymentSuccess);
receptionistRouter.get('/cancel', paymentController.paymentCancel);
receptionistRouter.get('/medical-records', getAllProfiles);
receptionistRouter.post('/medical-record', createProfile);
receptionistRouter.put('/medical-records/:id', editMedicalRecord);
receptionistRouter.get('/invoices', invoiceController.getAllInvoices);
receptionistRouter.get('/services/:invoiceId', invoiceController.getServices);
receptionistRouter.post('/invoices', invoiceController.CreateInvoices);
receptionistRouter.post('/appointmentinvoices', invoiceController.CreateInvoices2);
receptionistRouter.get("/services", invoiceController.getAllServices);
receptionistRouter.put('/services/paid/:invoiceId', paymentController.paidServices);
receptionistRouter.delete('/services/delete/:invoiceId', paymentController.deleteInvoice);
receptionistRouter.get('/payments', paymentController.getPayments);
receptionistRouter.get("/payments/summary", paymentController.getPaymentSummary);
receptionistRouter.get("/profiles/:userId", invoiceController.getProfilesByUserId)
receptionistRouter.get('/doctors', doctorServices.getAllDoctors);
receptionistRouter.get('/:userId/profiles', doctorServices.getProfilesByUserId);
receptionistRouter.get("/abc/services", invoiceController.getAllServices);
receptionistRouter.put('/toggle/services/:id', authReceptionistMiddleware, toggleServiceStatus);
receptionistRouter.get('/logs/services/:id', authReceptionistMiddleware, getServiceLogs);
// Checkup
receptionistRouter.post('/checkup', createCheckup);

// Schedule
receptionistRouter.post('/schedule', createSchedule);
receptionistRouter.get('/schedule', getSchedules);
receptionistRouter.put('/schedule/:id', updateSchedule);
receptionistRouter.delete('/schedule/:id', deleteSchedule);
receptionistRouter.get("/getNoti", getNotifications);
receptionistRouter.post("/createNoti", createNotification);
receptionistRouter.put("/urgent/:id", markUrgent);
receptionistRouter.delete("/deleteNoti/:id", deleteNotification);
receptionistRouter.get("/getAllUserEmails", getAllUserEmails);

// Services routes
receptionistRouter.get('/all/services', getAllServices); // GET /api/receptionist/services - Get all services with pagination, sorting, search
receptionistRouter.get('/get/services/:id', getServiceById); // GET /api/receptionist/services/:id - Get a single service by ID
receptionistRouter.post('/create/services', authReceptionistMiddleware, createService); // POST /api/receptionist/services - Create a new service
receptionistRouter.put('/update/services/:id', updateService); // PUT /api/receptionist/services/:id - Update a service
receptionistRouter.delete('/delete/services/:id', deleteService); // DELETE /api/receptionist/services/:id - Delete a service
// receptionistRouter.get('/labtestresult/:profileId', LabTestbyProfileId);
receptionistRouter.get('/qa',getAllQA);
receptionistRouter.put('/qa/:id',replyQA);

// Feedback
receptionistRouter.get('/feedback', getFeedbacksForReceptionist);
receptionistRouter.post('/:id/approve', authReceptionistMiddleware, approveCancellation);


module.exports = receptionistRouter;
