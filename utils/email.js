// // backend/utils/email.js
// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,      // e.g. smtp.gmail.com
//   port: process.env.EMAIL_PORT,      // e.g. 587
//   secure: false,                     // false for 587
//   auth: {
//     user: process.env.EMAIL_USER,    // your Gmail
//     pass: process.env.EMAIL_PASS,    // your app password
//   },
//   tls: {
//     rejectUnauthorized: false,
//   },
// });

// module.exports = transporter;



// backend/utils/email.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,      // sandbox.smtp.mailtrap.io
  port: process.env.EMAIL_PORT,      // 2525
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

module.exports = transporter;
