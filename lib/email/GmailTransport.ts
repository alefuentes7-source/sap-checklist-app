import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST ?? "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT ?? "465");
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (!smtpUser) {
  throw new Error("Falta configurar SMTP_USER.");
}

if (!smtpPass) {
  throw new Error("Falta configurar SMTP_PASS.");
}

export const gmailTransport = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,

  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});