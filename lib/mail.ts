import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function sendOtpEmail(email: string, otp: string) {
  const mailOptions = {
    from: `"Justice Shield" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Your Verification Code - Justice Shield",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b; text-align: center;">Verification Code</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Hello,
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Your verification code for Justice Shield is:
        </p>
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ef4444;">${otp}</span>
        </div>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          This code will expire in 10 minutes. If you did not request this code, please ignore this email.
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} Justice Shield. All rights reserved.
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

export async function sendVendorWelcomeEmail(email: string, name: string) {
  const setupUrl = `${process.env.WEB_URL}/auth/setup?email=${encodeURIComponent(email)}`;

  const mailOptions = {
    from: `"Justice Shield" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Welcome to Justice Shield - Account Approved",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #ef4444; text-align: center;">Account Approved</h2>
        <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
          Hello ${name},
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Your application to join the Justice Shield network has been approved. You can now set up your password and access your dashboard.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${setupUrl}" style="background-color: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Set Up Your Password</a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.6;">
          If the button above doesn't work, copy and paste this link into your browser: <br/>
          <a href="${setupUrl}" style="color: #ef4444;">${setupUrl}</a>
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} Justice Shield. All rights reserved.
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

export async function sendRejectionEmail(email: string, name: string) {
  const setupUrl = `${process.env.WEB_URL}/auth/setup?email=${encodeURIComponent(email)}`;

  const mailOptions = {
    from: `"Justice Shield" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Rejection to Justice Shield",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #ef4444; text-align: center;">Account Rejected</h2>
        <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
          Hello ${name},
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          We regret to inform you that your application to join the Justice Shield network has been rejected.
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} Justice Shield. All rights reserved.
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}
