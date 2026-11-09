import nodemailer from 'nodemailer';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { renderConfirmationEmail } from '../templates/confirmationEmail.js';
import { renderAdminNotificationEmail } from '../templates/adminNotification.js';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }
  return transporter;
}

export async function sendConfirmationEmail(lead) {
  if (!lead.email) {
    return { sent: false, reason: 'no_email_provided' };
  }

  const html = renderConfirmationEmail(lead);

  // If live SMTP configured:
  const mailer = getTransporter();
  if (mailer) {
    try {
      await mailer.sendMail({
        from: `Roar Extreme Nashik <${env.fromEmail}>`,
        to: lead.email,
        subject: 'Your Free Session Pass to Roar Fitness is Confirmed!',
        html,
      });
      logger.info(`Confirmation email sent to ${lead.email} (${lead.bookingReference})`);
      return { sent: true };
    } catch (err) {
      logger.error(`Failed to send confirmation email to ${lead.email}: ${err.message}`);
      return { sent: false, error: err.message };
    }
  }

  // Development / sandbox fallback
  logger.info(`[EMAIL SIMULATION] Confirmation email triggered for ${lead.email} (${lead.bookingReference})`);
  return { sent: true, simulated: true };
}

export async function sendAdminNotification(lead) {
  const html = renderAdminNotificationEmail(lead);
  const mailer = getTransporter();

  if (mailer && env.gymNotificationEmail) {
    try {
      await mailer.sendMail({
        from: `Roar Web Leads <${env.fromEmail}>`,
        to: env.gymNotificationEmail,
        subject: `[NEW LEAD] ${lead.fullName} applied for Free Pass (${lead.bookingReference})`,
        html,
      });
      return { sent: true };
    } catch (err) {
      logger.error(`Failed to send admin lead notification: ${err.message}`);
      return { sent: false, error: err.message };
    }
  }

  logger.info(`[EMAIL SIMULATION] Admin lead alert dispatched for ${lead.fullName} (${lead.phone})`);
  return { sent: true, simulated: true };
}

