import nodemailer from "nodemailer";
import logger from "logger";

// Create transporter for sending emails
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number.parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    logger.warn("SMTP configuration is incomplete. Email sending is disabled.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
};

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async (
  options: SendEmailOptions,
): Promise<boolean> => {
  const transporter = createTransporter();

  if (!transporter) {
    logger.error("Cannot send email: SMTP not configured");
    return false;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    logger.info(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    logger.error("Failed to send email:", error);
    return false;
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string,
): Promise<boolean> => {
  const appName = "Arithma";

  // Extract token from URL for display as verification code
  const urlObj = new URL(resetUrl);
  const token = urlObj.pathname.split("/").pop() || "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #1a1a1a; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${appName}</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #333333; margin-bottom: 16px;">Reset Your Password</h2>
          <p style="color: #666666; line-height: 1.6; margin-bottom: 24px;">
            You requested to reset your password. Use the verification code below:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <div style="background-color: #f5f5f5; border: 2px dashed #cccccc; border-radius: 8px; padding: 20px; display: inline-block;">
              <p style="color: #666666; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
              <p style="color: #000000; font-size: 24px; font-weight: bold; margin: 0; font-family: monospace; letter-spacing: 2px;">${token}</p>
            </div>
          </div>
          <p style="color: #666666; line-height: 1.6; font-size: 14px; text-align: center;">
            Copy the code above and paste it in the reset password page.
          </p>
          <p style="color: #999999; line-height: 1.6; font-size: 12px; margin-top: 24px;">
            If you didn't request this, you can safely ignore this email. This code will expire in 2 minutes.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Reset Your Password

You requested to reset your password for ${appName}.

Your verification code is: ${token}

Copy this code and paste it in the reset password page.

If you didn't request this, you can safely ignore this email.
This code will expire in 2 minutes.
  `;

  return sendEmail({
    to: email,
    subject: `Reset your ${appName} password`,
    html,
    text,
  });
};
