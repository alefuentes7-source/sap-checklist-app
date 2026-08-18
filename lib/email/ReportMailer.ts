import type { DailyClientReport } from "@/lib/reporting/types";

import { sendEmail } from "@/lib/email/EmailService";
import { buildReportEmailHtml } from "@/lib/email/templates/ReportEmail";

export interface SendReportEmailParams {
  report: DailyClientReport;

  recipients: string[];

  pdfBuffer: Uint8Array;
}

export interface SendReportEmailResult {
  success: boolean;
  messageId: string;
}

export async function sendReportEmail(
  params: SendReportEmailParams
): Promise<SendReportEmailResult> {
  const {
    report,
    recipients,
    pdfBuffer,
  } = params;

  const fileName =
    `${report.reportId}.pdf`;

  const subject =
    `Checklist SAP - ${report.client.name} - ${report.executionDate}`;

  const result = await sendEmail({
    to: recipients,

    subject,

    html: buildReportEmailHtml(report),

    attachments: [
      {
        filename: fileName,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  return {
    success: true,
    messageId: result.messageId,
  };
}