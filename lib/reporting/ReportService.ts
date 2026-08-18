import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";
import { getChecklistDate } from "@/lib/date";
import { ReportBuilder } from "@/lib/reporting/ReportBuilder";
import { hydrateReportAssets } from "@/lib/reporting/assets";
import { ChecklistPdfDocument } from "@/lib/reporting/pdf/ChecklistPdfDocument";
import { saveReportPdf } from "@/lib/reporting/storage/ReportStorage";


import {
  upsertDailyReport,
  markDailyReportMailSent,
  markDailyReportMailError,
} from "@/lib/reporting/repository/DailyReportRepository";

import { sendReportEmail } from "@/lib/reporting/email/ReportMailer";

type Client = SupabaseClient<Database>;

export interface GenerateDailyReportResult {
  reportId: string;
  pdfPath: string;
}

export async function generateDailyClientReport(
  supabase: Client,
  params: {
    clientId: string;
    userId: string;
    userEmail: string;
  }
): Promise<GenerateDailyReportResult> {


  const { clientId, userId, userEmail } = params;

  const executionDate = getChecklistDate();

  const builder = new ReportBuilder(supabase);

  builder.setExecutionDate(executionDate);

  await builder.loadClient(clientId);
  await builder.loadProvider();
  await builder.loadOperator(userId);
  await builder.loadSystems();
  await builder.loadChecklistResults();

  const report = builder.build();

  const hydratedReport = await hydrateReportAssets(
    supabase,
    report
  );

  const pdfBuffer = await renderToBuffer(
    React.createElement(ChecklistPdfDocument, {
      report: hydratedReport,
    })
  );

  const pdfPath = await saveReportPdf(supabase, {
    report,
    pdfBuffer,
  });

  await upsertDailyReport(supabase, {
    clientId: report.client.id,
    executionDate: report.executionDate,
    reportId: report.reportId,
    pdfPath,
    generatedBy: userId,
  });

  try {
    await sendReportEmail({
      report,
      recipients: [userEmail],
      pdfBuffer,
    });

    await markDailyReportMailSent(supabase, {
      clientId: report.client.id,
      executionDate: report.executionDate,
      recipients: [userEmail],
      deliveryStatus: "SENT_TO_OPERATOR",
    });
  } catch (error: any) {
    const message =
      error?.message ?? "Error desconocido enviando correo.";

    await markDailyReportMailError(supabase, {
      clientId: report.client.id,
      executionDate: report.executionDate,
      errorMessage: message,
    });

    throw error;
  }

  return {
    reportId: report.reportId,
    pdfPath,
  };
}