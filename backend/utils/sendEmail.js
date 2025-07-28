const nodemailer = require("nodemailer");
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: "gmail", // hoặc SMTP khác như Mailtrap, Outlook...
  auth: {
    user: process.env.EMAIL_USER,      // ví dụ: support.benhvien@gmail.com
    pass: process.env.EMAIL_PASSWORD   // ứng dụng mật khẩu (app password)
  }
});

const sendEmail = async ({ to, subject, text, html = null }) => {
  const mailOptions = {
    from: `"Bệnh viện" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    ...(html && { html }) // nếu bạn có HTML
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
