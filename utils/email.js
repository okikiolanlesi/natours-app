const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.from = `Natours <${process.env.Email}>`;
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Since my sendgrid account is not verified, Email is not sent
      //   return nodemailer.createTransport({
      //     service: 'SendGrid',
      //     auth: {
      //       // You can find this in your SendGrid account
      //       // Remember to add this to your .env file, i haven't done it yet because I don't have a sendgrid account
      //       user: process.env.SENDGRID_USERNAME,
      //       pass: process.env.SENDGRID_PASSWORD,
      //     },
      //   });
      // }
      return nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          // You can find this in your SendGrid account
          // Remember to add this to your .env file, i haven't done it yet because I don't have a sendgrid account
          user: process.env.GMAIL_USERNAME,
          pass: process.env.GMAIL_PASSWORD,
        },
      });
    }

    // Mailtrap
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );
    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    };
    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  sendWelcome() {
    this.send('welcome', 'Welcome to the Natours Family!');
  }

  sendPasswordReset() {
    this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }

  sendConfirmEmail() {
    this.send('confirmEmail', 'Confirm your email address');
  }
};

// const sendEmail = async (options) => {
//   //   1) Create a transporter
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   // 2) Define email options
//   const mailOptions = {
//     from: 'Okikiola Osunronbi <osunronbiolanlesi@gmail.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//   };
//   // 3) Send the email
//   await transporter.sendMail(mailOptions);
// };

// HOW TO USE GMAIL AS A SERVICE TO SEND EMAILS USING NODEMAILER IN NODE.JS
// const sendEmail = async (options) => {
//   //   1) Create a transporter
//   const transporter = nodemailer.createTransport({
//     // Note that using gmail is not recommended for production apps
//     // It has a limit of 500 emails per day and you'll quickly get marked as a spammer
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

// module.exports = sendEmail;
