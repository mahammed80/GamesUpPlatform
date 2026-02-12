const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const LOGO_PATH = path.join(__dirname, '../../client/src/assets/gamesupnew.png');

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body
 * @param {Array} attachments - Array of attachment objects
 */
async function sendEmail(to, subject, text, html, attachments = []) {
  // Auto-attach logo if referenced in HTML and not already provided
  if (html && html.includes('cid:logo') && !attachments.find(a => a.cid === 'logo')) {
    if (fs.existsSync(LOGO_PATH)) {
      // Create a copy of attachments to avoid mutating the default empty array or passed array unexpectedly
      attachments = [...attachments, {
        filename: 'logo.png',
        path: LOGO_PATH,
        cid: 'logo'
      }];
    } else {
      console.warn('⚠️ Logo referenced but file not found at:', LOGO_PATH);
    }
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
      attachments, // attachments
    });

    console.log('Message sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify SMTP connection
 */
async function verifyConnection() {
  try {
    await transporter.verify();
    console.log('✅ SMTP Server is ready to take our messages');
    return true;
  } catch (error) {
    console.error('❌ SMTP Connection Error:', error);
    return false;
  }
}

module.exports = {
  sendEmail,
  verifyConnection
};
