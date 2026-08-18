import { gmailTransport } from "@/lib/email/GmailTransport";
import type {
  SendEmailParams,
  SendEmailResult,
} from "@/lib/email/types";

export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  const smtpFrom =
    process.env.SMTP_FROM ??
    process.env.SMTP_USER;

  if (!smtpFrom) {
    throw new Error("Falta configurar SMTP_FROM.");
  }

  if (params.to.length === 0) {
    throw new Error("No hay destinatarios para el correo.");
  }

  const info = await gmailTransport.sendMail({
    from: smtpFrom,

    to: params.to.join(", "),

    subject: params.subject,

    html: params.html,

    attachments: params.attachments?.map(
      (attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })
    ),
  });

  return {
    messageId: info.messageId,
  };
}