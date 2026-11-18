import nodemailer from 'nodemailer';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { renderConfirmationEmail } from '../templates/confirmationEmail.js';
import { renderAdminNotificationEmail } from '../templates/adminNotification.js';

let transporter = null;

async function sendViaResend({ to, subject, html, from }) {
  const fromAddress = from || (env.fromEmail && !env.fromEmail.includes('roarextreme.com')
    ? env.fromEmail
    : 'Roar Extreme Nashik <onboarding@resend.dev>');

  const payload = {
    from: fromAddress,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Resend HTTP ${res.status}`);
    }
    return { sent: true, id: data.id };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

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

  // 1. Resend API (Primary modern email provider)
  if (env.resendApiKey) {
    try {
      const result = await sendViaResend({
        to: lead.email,
        subject: 'Your Free Session Pass to Roar Fitness is Confirmed!',
        html,
      });
      logger.info(`Confirmation email sent via Resend to ${lead.email} (${lead.bookingReference}, ID: ${result.id})`);
      return { sent: true, provider: 'resend', id: result.id };
    } catch (err) {
      logger.error(`Resend API failed for ${lead.email}: ${err.message}`);
      // Fall through to SMTP if available
    }
  }

  // 2. SMTP fallback
  const mailer = getTransporter();
  if (mailer) {
    try {
      const sendPromise = mailer.sendMail({
        from: `Roar Extreme Nashik <${env.fromEmail}>`,
        to: lead.email,
        subject: 'Your Free Session Pass to Roar Fitness is Confirmed!',
        html,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP_SEND_TIMEOUT (4s)')), 4000)
      );

      await Promise.race([sendPromise, timeoutPromise]);
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

  if (env.gymNotificationEmail) {
    if (env.resendApiKey) {
      try {
        const result = await sendViaResend({
          to: env.gymNotificationEmail,
          subject: `[NEW LEAD] ${lead.fullName} applied for Free Pass (${lead.bookingReference})`,
          html,
        });
        logger.info(`Admin notification email sent via Resend for ${lead.fullName} (ID: ${result.id})`);
        return { sent: true, provider: 'resend', id: result.id };
      } catch (err) {
        logger.error(`Resend admin alert failed: ${err.message}`);
        // Fall through to SMTP if available
      }
    }

    const mailer = getTransporter();
    if (mailer) {
      try {
        await mailer.sendMail({
          from: `Roar Web Leads <${env.fromEmail}>`,
          to: env.gymNotificationEmail,
          subject: `[NEW LEAD] ${lead.fullName} applied for Free Pass (${lead.bookingReference})`,
          html,
        });
        return { sent: true, provider: 'smtp' };
      } catch (err) {
        logger.error(`Failed to send admin lead notification: ${err.message}`);
        return { sent: false, error: err.message };
      }
    }
  }

  logger.info(`[EMAIL SIMULATION] Admin lead alert dispatched for ${lead.fullName} (${lead.phone})`);
  return { sent: true, simulated: true };
}

