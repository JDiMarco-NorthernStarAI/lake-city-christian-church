import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transport = getTransporter();

  if (!transport) {
    console.log(`[Email] SMTP not configured. Would have sent to ${options.to}: "${options.subject}"`);
    return false;
  }

  try {
    const fromAddress = options.from || process.env.SMTP_FROM || `Lake City Christian Church <${process.env.SMTP_USER}>`;
    await transport.sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`[Email] Sent "${options.subject}" to ${options.to}`);
    return true;
  } catch (err) {
    console.error(`[Email] Failed to send to ${options.to}:`, err);
    return false;
  }
}
