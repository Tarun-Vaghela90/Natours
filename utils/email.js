const nodemailer = require('nodemailer');
const pug = require('pug');
const { convert } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `College Portal <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    return nodemailer.createTransport({
      host: 'sandbox.smtp.mailtrap.io',
      port: '2525',
      auth: {
        user: '0ddb2f11e3bbb5',
        pass: '78207483bc8f9a'
      }
    });
  }

  // Send the actual email
  async send(template, subject) {
    try {
      // 1) Render HTML based on a pug template
      const html = pug.renderFile(
        `${__dirname}/../views/email/${template}.pug`,
        {
          firstName: this.firstName,
          url: this.url,
          subject
        }
      );

      // 2) Define email options
      const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        html,
        text: convert(html)
      };

      // 3) Send email
      const transporter = this.newTransport();
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent:', info.messageId);
    } catch (err) {
      console.error('❌ Email sending failed:', err);
      throw new Error('Email sending failed: ' + err.message);
    }
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the College Portal!');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Your password reset token (valid for 10 minutes)');
  }
};
