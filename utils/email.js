const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //   1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Define email options
  const mailOptions = {
    from: 'Okikiola Osunronbi <osunronbiolanlesi@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  // 3) Send the email
  await transporter.sendMail(mailOptions);
};

// HOW TO USE GMAIL AS A SERVICE TO SEND EMAILS USING NODEMAILER IN NODE.JS
// const sendEmail = async (options) => {
//   //   1) Create a transporter
//   const transporter = nodemailer.createTransport({
//     // Note that using gmail is not recommended for production apps
//     // It has a limit of 500 emails per day and you''ll quickly get marked as a spammer
//     service: 'Gmail',
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       // Activate in gmail 2FA and add a new application password
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });
//   // 2) Define email options
// options = {
//   from: 'hello@example.com',
//   to: 'reciever@gmail.com',
//   subject: 'Subject',
//   text: 'Email content'
// };
//   // 3) Send the email
//   transporter.sendEmail(options, (err, info) => {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log(info);
//     }
//   });
// };

module.exports = sendEmail;
