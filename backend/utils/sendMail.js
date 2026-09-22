const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
    const error = new Error('Email is not configured. Add SMTP credentials to the server environment.');
    error.statusCode = 503;
    throw error;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT || 587, 10),
      secure: process.env.MAIL_PORT === '465',
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });
  }
  return transporter;
};

const sendMail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''),
  };

  const info = await getTransporter().sendMail(mailOptions);
  console.log(`📧 E-posta gönderildi: ${info.messageId}`);
  return info;
};

module.exports = sendMail;
