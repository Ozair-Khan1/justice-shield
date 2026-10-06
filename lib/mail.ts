const THEME = {
  bg: "#0f172a",
  card: "#1e293b",
  accent: "#ff5722",
  text: "#f8fafc",
  muted: "#94a3b8",
  border: "#334155",
  footer: "#64748b"
};

function wrapEmail(content: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Justice Shield</title>
    </head>
    <body style="margin: 0; padding: 24px 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto; padding: 0 16px;">
        <tr>
          <td>
            <div style="background-color: ${THEME.card}; border: 1px solid ${THEME.border}; border-radius: 12px; padding: 40px 32px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4); color: ${THEME.text};">
              
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 32px;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td style="vertical-align: middle; text-align: center;">
                      <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 10px; background: linear-gradient(135deg, #ff5722, #ea580c); color: #ffffff; font-size: 22px; font-weight: bold; text-align: center; margin-bottom: 12px;">&#9878;</div>
                      <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 2.5px; line-height: 1.2;">
                        JUSTICE <span style="color: ${THEME.accent};">SHIELD</span>
                      </h1>
                      <p style="color: ${THEME.muted}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2.5px; margin: 6px 0 0 0;">
                        Tactical Law On Demand
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Body Content -->
              <div style="font-size: 15px; line-height: 1.6; color: ${THEME.text};">
                ${content}
              </div>
              
              <!-- Divider -->
              <div style="border-top: 1px solid ${THEME.border}; margin: 36px 0 24px 0;"></div>
              
              <!-- Footer -->
              <div style="text-align: center;">
                <p style="color: ${THEME.footer}; font-size: 11px; margin: 0 0 6px 0; font-family: monospace; text-transform: uppercase; letter-spacing: 1px;">
                  &copy; ${new Date().getFullYear()} Justice Shield. All rights reserved.
                </p>
                <p style="color: #475569; font-size: 11px; margin: 0;">
                  Confidential legal communications network.
                </p>
              </div>

            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
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
    console.warn(`[Brevo Mailer] ?? BREVO_API_KEY is not configured in .env. Email to "${to}" was skipped.`);
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
  console.log(`[Brevo Mailer] ? Email sent to ${to}:`, result.messageId || "Success");
  return result;
}

export async function sendOtpEmail(email: string, otp: string) {
  return sendEmail({
    to: email,
    subject: "Your Verification Code - Justice Shield",
    htmlContent: wrapEmail(`
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 10px 0;">Security Verification</h2>
        <p style="color: ${THEME.muted}; font-size: 14px; margin: 0;">
          Use the one-time code below to verify your identity.
        </p>
      </div>

      <div style="background-color: #0b0f19; border: 1px solid #334155; padding: 24px 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
        <span style="font-size: 34px; font-weight: 800; letter-spacing: 10px; color: ${THEME.accent}; font-family: 'Courier New', Courier, monospace; display: inline-block;">${otp}</span>
      </div>

      <p style="color: ${THEME.muted}; font-size: 13px; line-height: 1.5; text-align: center; margin: 20px 0 0 0;">
        This code expires in <strong>10 minutes</strong>. If you did not request this verification, you can safely ignore this email.
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
      
      <p style="color: ${THEME.muted}; font-size: 15px; line-height: 1.6; text-align: center;">
        Your account has been successfully created. You now have immediate access to our Tier 1 Emergency Response and Strategic Civil Counsel network.
      </p>
      
      <div style="background-color: #0b0f19; border: 1px solid ${THEME.border}; padding: 20px; border-radius: 8px; margin: 28px 0;">
        <h3 style="color: ${THEME.accent}; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-top: 0;">Next Steps</h3>
        <ul style="color: ${THEME.muted}; font-size: 14px; padding-left: 20px; margin-bottom: 0;">
          <li style="margin-bottom: 8px;">Complete your member profile in the Account tab.</li>
          <li style="margin-bottom: 8px;">Add an emergency contact to enable SOS triggers.</li>
          <li>Explore our network of vetted legal professionals.</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.WEB_URL || 'http://localhost:3000'}/app" style="background-color: ${THEME.accent}; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; display: inline-block;">Access Dashboard</a>
      </div>
    `),
  });
}

export async function sendVendorWelcomeEmail(email: string, name: string, token: string) {
  const setupUrl = `${process.env.WEB_URL || 'http://localhost:3000'}/auth/setup?email=${encodeURIComponent(email)}&token=${token}`;

  return sendEmail({
    to: email,
    subject: "Welcome to Justice Shield - Set Up Your Attorney Profile",
    htmlContent: wrapEmail(`
      <h2 style="color: #ffffff; text-align: center; font-size: 20px; margin-bottom: 24px;">Welcome to the Network, ${name}</h2>
      <p style="color: ${THEME.muted}; font-size: 15px; line-height: 1.6; text-align: center;">
        Your attorney application has been approved. You are now invited to join the Justice Shield legal panel.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${setupUrl}" style="background-color: ${THEME.accent}; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; display: inline-block;">Set Up Your Attorney Profile</a>
      </div>
      
      <p style="color: ${THEME.footer}; font-size: 12px; line-height: 1.6; text-align: center;">
        If the button above doesn't work, copy and paste this link into your browser: <br/>
        <a href="${setupUrl}" style="color: ${THEME.accent}; text-decoration: none;">${setupUrl}</a>
      </p>
    `),
  });
}

export async function sendMarketingWelcomeEmail(email: string, name: string, token: string) {
  const setupUrl = `${process.env.WEB_URL || 'http://localhost:3000'}/auth/setup?email=${encodeURIComponent(email)}&token=${token}`;

  return sendEmail({
    to: email,
    subject: "Welcome to Justice Shield - Set Up Your Partner Account",
    htmlContent: wrapEmail(`
      <h2 style="color: #ffffff; text-align: center; font-size: 20px; margin-bottom: 24px;">Welcome to the Network, ${name}</h2>
      <p style="color: ${THEME.muted}; font-size: 15px; line-height: 1.6; text-align: center;">
        Your marketing partner application has been approved. You are now invited to join the Justice Shield growth network.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${setupUrl}" style="background-color: ${THEME.accent}; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; display: inline-block;">Set Up Your Partner Account</a>
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
          <td style="color: ${THEME.muted}; font-size: 15px; line-height: 1.6; text-align: center; padding: 0 8px;">
            Hello ${name}, we regret to inform you that your application to join the Justice Shield network has been rejected at this time.
          </td>
        </tr>
      </table>

      ${rejectionReason ? `
      <div style="background-color: #0b0f19; border: 1px solid ${THEME.border}; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <h3 style="color: ${THEME.accent}; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-top: 0;">Reason for Rejection</h3>
        <p style="color: ${THEME.muted}; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${rejectionReason}</p>
      </div>` : ''}

      <p style="color: ${THEME.muted}; font-size: 14px; line-height: 1.6; text-align: center; margin-top: 24px;">
        Thank you for your interest in our platform.
      </p>
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
      <p style="color: ${THEME.muted}; font-size: 15px; line-height: 1.6; text-align: center;">
        We received a request to reset the password for your Justice Shield account.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="background-color: ${THEME.accent}; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; display: inline-block;">Reset Password</a>
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
      <p style="color: ${THEME.muted}; font-size: 15px; line-height: 1.6; text-align: center;">
        Hello ${name}, your attorney profile has been successfully created. You are now active in our network and ready to receive referrals.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.WEB_URL || 'http://localhost:3000'}/auth" style="background-color: ${THEME.accent}; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; display: inline-block;">Login</a>
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
      <p style="color: ${THEME.muted}; font-size: 15px; line-height: 1.6; text-align: center;">
        Hello ${name}, your marketing partner profile has been successfully created. We are excited to have you as part of our strategic growth network.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.WEB_URL || 'http://localhost:3000'}/auth" style="background-color: ${THEME.accent}; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; display: inline-block;">Login</a>
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
      <p style="color: ${THEME.muted}; font-size: 15px; line-height: 1.6; text-align: left;">
        Hello ${name},
      </p>
      <p style="color: ${THEME.muted}; font-size: 15px; line-height: 1.6; text-align: left; margin-bottom: 24px;">
        Thank you for contacting Justice Shield. Here is our response to your inquiry:
      </p>
      
      <div style="background-color: #0b0f19; border: 1px solid ${THEME.border}; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <h3 style="color: ${THEME.accent}; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-top: 0;">Our Reply</h3>
        <p style="color: ${THEME.text}; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${adminReply}</p>
      </div>

      <div style="background-color: #080c14; border-left: 3px solid ${THEME.border}; padding: 14px 20px; margin: 24px 0;">
        <h4 style="color: ${THEME.muted}; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-top: 0; margin-bottom: 8px;">Your Original Message</h4>
        <p style="color: ${THEME.footer}; font-size: 13px; line-height: 1.5; margin: 0; font-style: italic; white-space: pre-wrap;">${originalMessage}</p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.WEB_URL || 'http://localhost:3000'}" style="background-color: ${THEME.accent}; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; display: inline-block;">Visit Justice Shield</a>
      </div>
    `),
  });
}
