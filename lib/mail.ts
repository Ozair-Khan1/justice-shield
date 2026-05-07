import nodemailer from "nodemailer";
import path from "path";

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

const THEME = {
  bg: "#0a0a0a",
  card: "#111111",
  accent: "#ff5722",
  text: "#f8fafc",
  muted: "#94a3b8",
  border: "#1f2937",
  footer: "#64748b"
};

const attachments = [
  {
    filename: "shield-logo.png",
    path: path.join(process.cwd(), "public", "shield-logo.png"),
    cid: "shield-logo",
  },
];

function wrapEmail(content: string) {
  return `
    <div style="background-color: ${THEME.bg}; font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 8px; color: ${THEME.text};">
      <div style="text-align: center; margin-bottom: 32px;">
         <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
           <tr>
             <td style="vertical-align: middle; padding-right: 12px;">
               <img src="cid:shield-logo" alt="Justice Shield" style="width: 32px; height: auto; display: block;" />
             </td>
             <td style="vertical-align: middle;">
               <h1 style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 2px; line-height: 1;">
                 JUSTICE <span style="color: ${THEME.accent};">SHIELD</span>
               </h1>
             </td>
           </tr>
         </table>
         <p style="color: ${THEME.muted}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; margin-top: 12px;">
           Tactical Law On Demand
         </p>
      </div>
      
      ${content}
      
      <hr style="border: 0; border-top: 1px solid ${THEME.border}; margin: 32px 0;" />
      
      <p style="color: ${THEME.footer}; font-size: 11px; text-align: center; font-family: monospace; text-transform: uppercase; letter-spacing: 1px;">
        &copy; ${new Date().getFullYear()} Justice Shield. All rights reserved.
      </p>
    </div>
  `;
}

export async function sendOtpEmail(email: string, otp: string) {
  const mailOptions = {
    from: `"Justice Shield" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Your Verification Code - Justice Shield",
    attachments,
    html: wrapEmail(`
      <h2 style="color: #ffffff; text-align: center; font-size: 20px; margin-bottom: 24px;">Verification Code</h2>
      <p style="color: ${THEME.muted}; font-size: 16px; line-height: 1.6; text-align: center;">
        Your verification code for Justice Shield is:
      </p>
      <div style="background-color: ${THEME.card}; border: 1px solid ${THEME.border}; padding: 30px; text-align: center; border-radius: 4px; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: ${THEME.accent}; font-family: monospace;">${otp}</span>
      </div>
      <p style="color: ${THEME.muted}; font-size: 14px; line-height: 1.6; text-align: center;">
        This code will expire in 10 minutes. If you did not request this code, please ignore this email.
      </p>
    `),
  };

  return transporter.sendMail(mailOptions);
}

export async function sendUserWelcomeEmail(email: string, name: string) {
  const mailOptions = {
    from: `"Justice Shield" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Welcome to Justice Shield",
    attachments,
    html: wrapEmail(`
      <h2 style="color: #ffffff; text-align: center; font-size: 20px; margin-bottom: 24px;">Welcome to the Network, ${name}</h2>
      
      <p style="color: ${THEME.muted}; font-size: 16px; line-height: 1.6; text-align: center;">
        Your account has been successfully created. You now have immediate access to our Tier 1 Emergency Response and Strategic Civil Counsel network.
      </p>
      
      <div style="background-color: ${THEME.card}; border: 1px solid ${THEME.border}; padding: 24px; border-radius: 4px; margin: 32px 0;">
        <h3 style="color: ${THEME.accent}; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-top: 0;">Next Steps</h3>
        <ul style="color: ${THEME.muted}; font-size: 14px; padding-left: 20px; margin-bottom: 0;">
          <li style="margin-bottom: 8px;">Complete your member profile in the Account tab.</li>
          <li style="margin-bottom: 8px;">Add an emergency contact to enable SOS triggers.</li>
          <li>Explore our network of vetted legal professionals.</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${process.env.WEB_URL}/app" style="background-color: ${THEME.accent}; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 2px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">Access Dashboard</a>
      </div>
    `),
  };

  return transporter.sendMail(mailOptions);
}

export async function sendVendorWelcomeEmail(email: string, name: string, token: string) {
  const setupUrl = `${process.env.WEB_URL}/auth/setup?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

  const mailOptions = {
    from: `"Justice Shield" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Welcome to Justice Shield Attorney Network",
    attachments,
    html: wrapEmail(`
      <h2 style="color: #ffffff; text-align: center; font-size: 20px; margin-bottom: 24px;">Counsel Account Approved</h2>
      <p style="color: ${THEME.muted}; font-size: 16px; line-height: 1.6; text-align: center;">
        Hello ${name}, your application to join the Justice Shield Attorney Network has been approved. You now have access to our secure response platform.
      </p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${setupUrl}" style="background-color: ${THEME.accent}; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 2px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">Complete Your Profile</a>
      </div>
      
      <p style="color: ${THEME.footer}; font-size: 12px; line-height: 1.6; text-align: center;">
        If the button above doesn't work, copy and paste this link into your browser: <br/>
        <a href="${setupUrl}" style="color: ${THEME.accent}; text-decoration: none;">${setupUrl}</a>
      </p>
    `),
  };

  return transporter.sendMail(mailOptions);
}

export async function sendMarketingWelcomeEmail(email: string, name: string, token: string) {
  const setupUrl = `${process.env.WEB_URL}/auth/setup?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

  const mailOptions = {
    from: `"Justice Shield" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Welcome to Justice Shield - Marketing Partner",
    attachments,
    html: wrapEmail(`
      <h2 style="color: #ffffff; text-align: center; font-size: 20px; margin-bottom: 24px;">Partner Account Approved</h2>
      <p style="color: ${THEME.muted}; font-size: 16px; line-height: 1.6; text-align: center;">
        Hello ${name}, your application to join Justice Shield as a Marketing Specialist has been approved. We look forward to collaborating with you.
      </p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${setupUrl}" style="background-color: ${THEME.accent}; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 2px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">Set Up Your Partner Account</a>
      </div>
      
      <p style="color: ${THEME.footer}; font-size: 12px; line-height: 1.6; text-align: center;">
        If the button above doesn't work, copy and paste this link into your browser: <br/>
        <a href="${setupUrl}" style="color: ${THEME.accent}; text-decoration: none;">${setupUrl}</a>
      </p>
    `),
  };

  return transporter.sendMail(mailOptions);
}

export async function sendRejectionEmail(email: string, name: string, rejectionReason?: string) {
  const mailOptions = {
    from: `"Justice Shield" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Application Update - Justice Shield",
    attachments,
    html: wrapEmail(`
      <h2 style="color: #ffffff; text-align: center; font-size: 20px; margin-bottom: 24px;">Application Status</h2>
      <p style="color: ${THEME.muted}; font-size: 16px; line-height: 1.6; text-align: center;">
        Hello ${name}, we regret to inform you that your application to join the Justice Shield network has been rejected at this time.
      </p>
      ${rejectionReason ? `
      <div style="background-color: ${THEME.card}; border: 1px solid ${THEME.border}; padding: 24px; border-radius: 4px; margin: 32px 0;">
        <h3 style="color: ${THEME.accent}; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-top: 0;">Reason for Rejection</h3>
        <p style="color: ${THEME.muted}; font-size: 14px; margin-bottom: 0;">${rejectionReason}</p>
      </div>` : ''}
      <p style="color: ${THEME.muted}; font-size: 14px; line-height: 1.6; text-align: center; margin-top: 24px;">
        Thank you for your interest in our platform.
      </p>
    `),
  };

  return transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.WEB_URL}/auth/setup?email=${encodeURIComponent(email)}&token=${token}`;

  const mailOptions = {
    from: `"Justice Shield" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset Your Password - Justice Shield",
    attachments,
    html: wrapEmail(`
      <h2 style="color: #ffffff; text-align: center; font-size: 20px; margin-bottom: 24px;">Password Reset Request</h2>
      <p style="color: ${THEME.muted}; font-size: 16px; line-height: 1.6; text-align: center;">
        We received a request to reset the password for your Justice Shield account.
      </p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${resetUrl}" style="background-color: ${THEME.accent}; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 2px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">Reset Password</a>
      </div>
      
      <p style="color: ${THEME.footer}; font-size: 12px; line-height: 1.6; text-align: center;">
        If the button above doesn't work, copy and paste this link into your browser: <br/>
        <a href="${resetUrl}" style="color: ${THEME.accent}; text-decoration: none;">${resetUrl}</a>
      </p>
    `),
  };

  return transporter.sendMail(mailOptions);
}

export async function sendVendorProfileSetupCompleteEmail(email: string, name: string) {
  const mailOptions = {
    from: `"Justice Shield" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Profile Setup Complete - Justice Shield",
    attachments,
    html: wrapEmail(`
      <h2 style="color: #ffffff; text-align: center; font-size: 20px; margin-bottom: 24px;">Setup Complete</h2>
      <p style="color: ${THEME.muted}; font-size: 16px; line-height: 1.6; text-align: center;">
        Hello ${name}, your attorney profile has been successfully created. You are now active in our network and ready to receive referrals.
      </p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${process.env.WEB_URL}/auth" style="background-color: ${THEME.accent}; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 2px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">Login</a>
      </div>
    `),
  };

  return transporter.sendMail(mailOptions);
}

export async function sendMarketingProfileSetupCompleteEmail(email: string, name: string) {
  const mailOptions = {
    from: `"Justice Shield" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Profile Setup Complete - Justice Shield",
    attachments,
    html: wrapEmail(`
      <h2 style="color: #ffffff; text-align: center; font-size: 20px; margin-bottom: 24px;">Setup Complete</h2>
      <p style="color: ${THEME.muted}; font-size: 16px; line-height: 1.6; text-align: center;">
        Hello ${name}, your marketing partner profile has been successfully created. We are excited to have you as part of our strategic growth network.
      </p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${process.env.WEB_URL}/auth" style="background-color: ${THEME.accent}; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 2px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">Login</a>
      </div>
    `),
  };

  return transporter.sendMail(mailOptions);
}

