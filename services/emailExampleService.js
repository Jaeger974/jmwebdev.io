import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

// Transporter is created once and reused across all email sends

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // STARTTLS — Brevo uses this on port 587
  auth: {
    user: process.env.SMTP_USER, // Your Brevo login email
    pass: process.env.SMTP_PASS,  // Your Brevo SMTP key (not account password)
  },
    tls: {
    rejectUnauthorized: false
    }
});

/**
 * Sends an email via Brevo SMTP.
 *
 * @param {string} to      - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} html    - HTML body (pass in your template function's output)
 * @returns {Promise<void>}
 *
 * Usage examples:
 *   sendEmail(user.email, "Welcome to Amourly!", welcomeEmailHTML(user.firstName, token))
 *   sendEmail(partner.email, "You've got a poem!", poemEmailHTML(poem, senderName))
 */
export async function sendEmail(to, subject, html) {
  try{
    const info = await transporter.sendMail({
    from: `"Amourly" <dynamic.kandj@gmail.com>`,
    to,
    subject,
    html,
  });


console.log(`Email sent to ${to} — Message ID: ${info.messageId}`);
  } catch (err) {
    console.error(`Failed to send email to ${to}`);
    console.error(`Subject: ${subject}`);
    console.error(`Reason: ${err.message}`);

    // Re-throw so the calling code knows the email failed
    // and can handle it (e.g. return a 500, show a UI error)
    throw err;
  }
}

export default sendEmail;