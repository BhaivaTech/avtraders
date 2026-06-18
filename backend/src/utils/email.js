import nodemailer from "nodemailer";

const PROVIDER = String(process.env.ADMIN_OTP_PROVIDER || "smtp").toLowerCase();

let transporter = null;
if (PROVIDER === "smtp") {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || "true").toLowerCase() !== "false",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export async function sendEmail({ to, subject, text, html }) {
  if (PROVIDER !== "smtp") {
    console.warn(`[Email][DEV] To: ${to} | Subject: ${subject}`);
    return { ok: true, message: "Email mocked (DEV)" };
  }

  if (!transporter) throw new Error("SMTP not configured");

  await transporter.sendMail({
    from: `"AV Agri Clinic" <${process.env.SMTP_USER || to}>`,
    to,
    subject,
    text,
    html,
  });

  return { ok: true, message: "Email sent" };
}
