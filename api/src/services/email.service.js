import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let cachedTransporter = null;
let isEthereal = false;

/**
 * Initializes and caches an active mail transporter.
 * Uses real SMTP credentials if provided in .env (e.g. Gmail, Brevo, Mailtrap, Resend).
 * Otherwise, automatically provisions a free sandbox account on Ethereal Email with instant web preview URLs.
 */
export const getTransporter = async () => {
  if (cachedTransporter) {
    return { transporter: cachedTransporter, isEthereal };
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  // Real SMTP credentials provided
  if (SMTP_USER && SMTP_PASS) {
    const port = Number(SMTP_PORT) || 587;
    cachedTransporter = nodemailer.createTransport({
      host: SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    isEthereal = false;
    console.log(`[Email Service] Connected to real SMTP: ${SMTP_HOST || 'smtp.gmail.com'}:${port} (user: ${SMTP_USER})`);
    return { transporter: cachedTransporter, isEthereal };
  }

  // Automatic Ethereal fallback for development and local testing
  try {
    console.log('[Email Service] No SMTP credentials in .env. Initializing automated Ethereal sandbox...');
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    isEthereal = true;
    console.log(`[Email Service] Ethereal sandbox ready (Account: ${testAccount.user})`);
    return { transporter: cachedTransporter, isEthereal };
  } catch (err) {
    console.error('[Email Service] Failed to initialize Ethereal sandbox:', err.message);
    throw err;
  }
};

/**
 * Sends a high-priority incident outage alert email.
 */
export const sendOutageAlert = async (userEmail, monitorName, cause, time) => {
  try {
    const { transporter, isEthereal } = await getTransporter();
    const formattedTime = new Date(time).toUTCString();
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const info = await transporter.sendMail({
      from: '"PulseGuard Mission Control" <alerts@pulseguard.io>',
      to: userEmail,
      subject: `🚨 CRITICAL OUTAGE: ${monitorName} is DOWN`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { margin: 0; padding: 0; background-color: #0B0F19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #111726; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
            .header { padding: 32px 32px 24px; border-bottom: 1px solid #1E293B; background: linear-gradient(180deg, rgba(239,68,68,0.1) 0%, rgba(17,23,38,0) 100%); }
            .badge { display: inline-block; padding: 4px 12px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 9999px; color: #F87171; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px; }
            .title { margin: 0; font-size: 22px; font-weight: 800; color: #FFFFFF; line-height: 1.3; }
            .body { padding: 32px; }
            .card { background-color: #090D18; border: 1px solid #1E293B; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
            .card-item { margin-bottom: 12px; font-size: 13px; line-height: 1.6; }
            .card-item:last-child { margin-bottom: 0; }
            .label { color: #94A3B8; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
            .value { color: #F1F5F9; font-family: monospace; font-size: 13px; margin-top: 2px; }
            .error-box { background: rgba(239, 68, 68, 0.08); border-left: 3px solid #EF4444; padding: 12px 16px; border-radius: 4px; color: #FCA5A5; font-family: monospace; font-size: 12px; margin-top: 4px; }
            .btn { display: inline-block; width: 100%; box-sizing: border-box; text-align: center; background-color: #2563EB; color: #FFFFFF; padding: 14px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none; }
            .footer { padding: 24px 32px; border-top: 1px solid #1E293B; font-size: 12px; color: #64748B; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="badge">🚨 Incident Outage Alert</div>
              <h1 class="title">${monitorName} has entered a DOWN state</h1>
            </div>
            <div class="body">
              <div class="card">
                <div class="card-item">
                  <div class="label">Target Monitor</div>
                  <div class="value">${monitorName}</div>
                </div>
                <div class="card-item">
                  <div class="label">Timestamp (UTC)</div>
                  <div class="value">${formattedTime}</div>
                </div>
                <div class="card-item">
                  <div class="label">Incident Root Cause</div>
                  <div class="error-box">${cause || 'Endpoint failed 3 consecutive health checks'}</div>
                </div>
              </div>
              <p style="font-size: 13px; color: #94A3B8; margin-bottom: 24px;">
                PulseGuard verified this outage across 3 consecutive distributed probe retries to ensure zero false positives. Our distributed worker will continue verifying and will alert you the moment the system recovers.
              </p>
              <a href="${clientUrl}/dashboard" class="btn">View Incident in Mission Control</a>
            </div>
            <div class="footer">
              PulseGuard Zero-False-Positive Distributed Telemetry • Automated Alert System
            </div>
          </div>
        </body>
        </html>
      `,
    });

    const previewUrl = isEthereal ? nodemailer.getTestMessageUrl(info) : null;
    if (previewUrl) {
      console.log(`[Email] 🚨 Outage alert dispatched to ${userEmail} for "${monitorName}"`);
      console.log(`[Email] 🔗 Instant Web Inbox Preview: ${previewUrl}`);
    } else {
      console.log(`[Email] 🚨 Real SMTP outage alert sent to ${userEmail} for "${monitorName}" (Message ID: ${info.messageId})`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error(`[Email Error] Failed to send outage alert: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Sends a service resolution / recovery alert email.
 */
export const sendRecoveryAlert = async (userEmail, monitorName, downtimeDurationMinutes) => {
  try {
    const { transporter, isEthereal } = await getTransporter();
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const info = await transporter.sendMail({
      from: '"PulseGuard Mission Control" <alerts@pulseguard.io>',
      to: userEmail,
      subject: `✅ RESOLVED: ${monitorName} is BACK UP`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { margin: 0; padding: 0; background-color: #0B0F19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #111726; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
            .header { padding: 32px 32px 24px; border-bottom: 1px solid #1E293B; background: linear-gradient(180deg, rgba(16,185,129,0.1) 0%, rgba(17,23,38,0) 100%); }
            .badge { display: inline-block; padding: 4px 12px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 9999px; color: #34D399; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px; }
            .title { margin: 0; font-size: 22px; font-weight: 800; color: #FFFFFF; line-height: 1.3; }
            .body { padding: 32px; }
            .card { background-color: #090D18; border: 1px solid #1E293B; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
            .card-item { margin-bottom: 12px; font-size: 13px; line-height: 1.6; }
            .card-item:last-child { margin-bottom: 0; }
            .label { color: #94A3B8; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
            .value { color: #F1F5F9; font-family: monospace; font-size: 13px; margin-top: 2px; }
            .btn { display: inline-block; width: 100%; box-sizing: border-box; text-align: center; background-color: #059669; color: #FFFFFF; padding: 14px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none; }
            .footer { padding: 24px 32px; border-top: 1px solid #1E293B; font-size: 12px; color: #64748B; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="badge">✅ Incident Resolved</div>
              <h1 class="title">${monitorName} has completely recovered</h1>
            </div>
            <div class="body">
              <div class="card">
                <div class="card-item">
                  <div class="label">Target Monitor</div>
                  <div class="value">${monitorName}</div>
                </div>
                <div class="card-item">
                  <div class="label">Total Downtime Duration</div>
                  <div class="value" style="color: #34D399; font-weight: 700;">${downtimeDurationMinutes} minute(s)</div>
                </div>
                <div class="card-item">
                  <div class="label">Resolution Status</div>
                  <div class="value">200 OK - Health Verification Passed</div>
                </div>
              </div>
              <p style="font-size: 13px; color: #94A3B8; margin-bottom: 24px;">
                All distributed health checks have reported full operational stability. The active incident has been successfully closed.
              </p>
              <a href="${clientUrl}/dashboard" class="btn">View Live Status Page</a>
            </div>
            <div class="footer">
              PulseGuard Zero-False-Positive Distributed Telemetry • Automated Alert System
            </div>
          </div>
        </body>
        </html>
      `,
    });

    const previewUrl = isEthereal ? nodemailer.getTestMessageUrl(info) : null;
    if (previewUrl) {
      console.log(`[Email] ✅ Recovery alert dispatched to ${userEmail} for "${monitorName}"`);
      console.log(`[Email] 🔗 Instant Web Inbox Preview: ${previewUrl}`);
    } else {
      console.log(`[Email] ✅ Real SMTP recovery alert sent to ${userEmail} for "${monitorName}" (Message ID: ${info.messageId})`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error(`[Email Error] Failed to send recovery alert: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Sends a self-diagnostic test email to verify configuration.
 */
export const sendTestEmail = async (targetEmail = 'developer@pulseguard.io') => {
  return await sendOutageAlert(
    targetEmail,
    'PulseGuard Telemetry Self-Test',
    'Simulated 500ms Gateway Timeout for Alert Verification',
    new Date()
  );
};
