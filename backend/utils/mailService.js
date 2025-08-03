// utils/mailService.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER, // email gửi
        pass: process.env.MAIL_PASS  // mật khẩu app password
    }
});

const sendAppointmentConfirmation = async ({ to, patientName, doctorName, date, type }) => {
    const mailOptions = {
        from: `"Hospital Appointment" <${process.env.MAIL_USER}>`,
        to,
        subject: 'Appointment Confirmation',
        html: `
      <h3>Appointment Confirmation</h3>
      <p>Hi <b>${patientName}</b>,</p>
      <p>Your appointment with <b>Dr. ${doctorName}</b> has been successfully booked.</p>
      <p><b>Date:</b> ${new Date(date).toLocaleString()}</p>
      <p><b>Type:</b> ${type}</p>
      <br/>
      <p>Thank you for choosing our hospital!</p>
    `
    };

    return transporter.sendMail(mailOptions);
};

// NEW: Function gửi reminder 1 giờ trước lịch hẹn
const sendAppointmentReminder = async ({ to, patientName, doctorName, date }) => {
    const mailOptions = {
        from: `"Hospital Reminder" <${process.env.MAIL_USER}>`,
        to,
        subject: 'Appointment Reminder - 1 Hour Left',
        html: `
      <h3>Appointment Reminder</h3>
      <p>Hi <b>${patientName}</b>,</p>
      <p>Your appointment with <b>Dr. ${doctorName}</b> is starting in 1 hour.</p>
      <p><b>Date & Time:</b> ${new Date(date).toLocaleString()}</p>
      <p>Please arrive on time. If you need to reschedule, contact us immediately.</p>
      <br/>
      <p>Thank you!</p>
      <p>Vietcare Team</p>
    `
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendAppointmentConfirmation, sendAppointmentReminder };