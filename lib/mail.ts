import fs from "fs";
import path from "path";

const THEME = {
  bg: "#0a0a0a",
  card: "#111111",
  accent: "#ff5722",
  text: "#f8fafc",
  muted: "#94a3b8",
  border: "#1f2937",
  footer: "#64748b"
};

// Cache base64 logo once to embed in emails reliably without needing public hosting
let cachedLogoSrc = "";
try {
  const logoPath = path.join(process.cwd(), "public", "shield-logo.webp");
  if (fs.existsSync(logoPath)) {
    const buffer = fs.readFileSync(logoPath);
    cachedLogoSrc = `data:image/webp;base64,${buffer.toString("base64")}`;
  }
} catch {
  cachedLogoSrc = "";
}

function getLogoUrl() {
  if (cachedLogoSrc) return cachedLogoSrc;
  const webUrl = process.env.WEB_URL || "http://localhost:3000";
  return `${webUrl}/shield-logo.webp`;
}

function wrapEmail(content: string) {
  const logoSrc = getLogoUrl();

  return `
    <div style="background-color: ${THEME.bg}; font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 8px; color: ${THEME.text};">
      <div style="text-align: center; margin-bottom: 32px;">
         <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
           <tr>
             <td style="vertical-align: middle; padding-right: 12px;">
               <img src="${logoSrc}" alt="Justice Shield" style="width: 32px; height: auto; display: block;" />
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

interface SendMailParams {
  to: string;
  subject: string;
  htmlContent: string;
}

/**
 * Sends transactional email via Brevo REST API (https://api.brevo.com/v3/smtp/email).
 * Avoids all SMTP port blocking, server config, and firewall issues.
 */
async function sendEmail({ to, subject, htmlContent }: SendMailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || "no-reply@justiceshield.com";
  const senderName = process.env.BREVO_SENDER_NAME || "Justice Shield";

  if (!apiKey) {
    console.warn(`[Brevo Mailer] ⚠️ BREVO_API_KEY is not configured in .env. Email to "${to}" was skipped.`);
    return { success: false, error: "BREVO_API_KEY not configured" };
  }

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [
      {
        email: to,
      },
    ],
    subject,
    htmlContent,
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Brevo Mailer Error] Status ${response.status}:`, errorText);
    throw new Error(`Brevo mail error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  console.log(`[Brevo Mailer] ✅ Email sent to ${to}:`, result.messageId || "Success");
  return result;
}

export async function sendOtpEmail(email: string, otp: string) {
  return sendEmail({
    to: email,
    subject: "Your Verification Code - Justice Shield",
    htmlContent: wrapEmail(`
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
  });
}

export async function sendUserWelcomeEmail(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: "Welcome to Justice Shield",
    htmlContent: wrapEmail(`
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
        <a href="${process.env.WEB_URL || 'http://localhost:3000'}/app" style="background-color: ${THEME.accent}; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 2px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">Access Dashboard</a>
      </div>
    `),
  });
}

export async function sendVendorWelcomeEmail(email: string, name: string, token: string) {
  const setupUrl = `${process.env.WEB_URL || 'http://localhost:3000'}/auth/setup?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

  return sendEmail({
    to: email,
    subject: "Welcome to Justice Shield Attorney Network",
    htmlContent: wrapEmail(`
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
  });
}

export async function sendMarketingWelcomeEmail(email: string, name: string, token: string) {
  const setupUrl = `${process.env.WEB_URL || 'http://localhost:3000'}/auth/setup?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

  return sendEmail({
    to: email,
    subject: "Welcome to Justice Shield - Marketing Partner",
    htmlContent: wrapEmail(`
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
  });
}

export async function sendRejectionEmail(email: string, name: string, rejectionReason?: string) {
  return sendEmail({
    to: email,
    subject: "Application Update - Justice Shield",
    htmlContent: wrapEmail(`
      <h2 style="color: #ffffff; text-align: center; font-size: 20px; margin-bottom: 24px;">Application Status</h2>

      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
        <tr>
          <td style="color: ${THEME.muted}; font-size: clamp(13px, 3vw, 16px); line-height: 1.6; text-align: center; padding: 0 8px; word-break: break-word;">
            Hello ${name}, we regret to inform you that your application to join the Justice Shield network has been rejected at this time.
          </td>
        </tr>
      </table>

      ${rejectionReason ? `
      <div style="background-color: ${THEME.card}; border: 1px solid ${THEME.border}; padding: 24px; border-radius: 4px; margin: 32px 0;">
        <h3 style="color: ${THEME.accent}; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-top: 0;">Reason for Rejection</h3>
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td style="color: ${THEME.muted}; font-size: clamp(12px, 2.5vw, 14px); line-height: 1.6; margin-bottom: 0; word-break: break-word; white-space: pre-wrap;">
              ${rejectionReason}
            </td>
          </tr>
        </table>
      </div>` : ''}

      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
        <tr>
          <td style="color: ${THEME.muted}; font-size: clamp(12px, 2.5vw, 14px); line-height: 1.6; text-align: center; padding: 0 8px; word-break: break-word;">
            Thank you for your interest in our platform.
          </td>
        </tr>
      </table>
    `),
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.WEB_URL || 'http://localhost:3000'}/auth/setup?email=${encodeURIComponent(email)}&token=${token}`;

  return sendEmail({
    to: email,
    subject: "Reset Your Password - Justice Shield",
    htmlContent: wrapEmail(`
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
  });
}

export async function sendVendorProfileSetupCompleteEmail(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: "Profile Setup Complete - Justice Shield",
    htmlContent: wrapEmail(`
      <h2 style="color: #ffffff; text-align: center; font-size: 20px; margin-bottom: 24px;">Setup Complete</h2>
      <p style="color: ${THEME.muted}; font-size: 16px; line-height: 1.6; text-align: center;">
        Hello ${name}, your attorney profile has been successfully created. You are now active in our network and ready to receive referrals.
      </p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${process.env.WEB_URL || 'http://localhost:3000'}/auth" style="background-color: ${THEME.accent}; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 2px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">Login</a>
      </div>
    `),
  });
}

export async function sendMarketingProfileSetupCompleteEmail(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: "Profile Setup Complete - Justice Shield",
    htmlContent: wrapEmail(`
      <h2 style="color: #ffffff; text-align: center; font-size: 20px; margin-bottom: 24px;">Setup Complete</h2>
      <p style="color: ${THEME.muted}; font-size: 16px; line-height: 1.6; text-align: center;">
        Hello ${name}, your marketing partner profile has been successfully created. We are excited to have you as part of our strategic growth network.
      </p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${process.env.WEB_URL || 'http://localhost:3000'}/auth" style="background-color: ${THEME.accent}; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 2px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">Login</a>
      </div>
    `),
  });
}

export async function sendContactReplyEmail(email: string, name: string, originalMessage: string, adminReply: string) {
  return sendEmail({
    to: email,
    subject: "Response to Your Inquiry - Justice Shield",
    htmlContent: wrapEmail(`
      <h2 style="color: #ffffff; text-align: center; font-size: 20px; margin-bottom: 24px;">Message Response</h2>
      <p style="color: ${THEME.muted}; font-size: 16px; line-height: 1.6; text-align: left;">
        Hello ${name},
      </p>
      <p style="color: ${THEME.muted}; font-size: 16px; line-height: 1.6; text-align: left; margin-bottom: 24px;">
        Thank you for contacting Justice Shield. Here is our response to your inquiry:
      </p>
      
      <div style="background-color: ${THEME.card}; border: 1px solid ${THEME.border}; padding: 24px; border-radius: 4px; margin: 32px 0;">
        <h3 style="color: ${THEME.accent}; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-top: 0;">Our Reply</h3>
        <p style="color: ${THEME.text}; font-size: 14px; line-height: 1.6; margin-bottom: 0; white-space: pre-wrap;">${adminReply}</p>
      </div>

      <div style="background-color: ${THEME.bg}; border-left: 3px solid ${THEME.border}; padding: 16px 24px; margin: 32px 0; opacity: 0.8;">
        <h4 style="color: ${THEME.muted}; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-top: 0; margin-bottom: 8px;">Your Original Message</h4>
        <p style="color: ${THEME.footer}; font-size: 13px; line-height: 1.5; margin-bottom: 0; font-style: italic; white-space: pre-wrap;">${originalMessage}</p>
      </div>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${process.env.WEB_URL || 'http://localhost:3000'}" style="background-color: ${THEME.accent}; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 2px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">Visit Justice Shield</a>
      </div>
    `),
  });
}
