import type { createClient } from "@/lib/supabase/server";

type Client = ReturnType<typeof createClient>;

import type { DailyClientReport } from "@/lib/reporting/types";

export async function saveReportPdf(
  supabase: Client,
  params: {
    report: DailyClientReport;
    pdfBuffer: Uint8Array;
  }
): Promise<string> {
  const { report, pdfBuffer } = params;

  const [year, month] = report.executionDate.split("-");

  const path =
    `${report.client.id}/${year}/${month}/${report.reportId}.pdf`;

  const { error } = await supabase.storage
    .from("reports")
    .upload(path, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    console.error("Error guardando PDF:", {
      message: error.message,
      path,
      reportId: report.reportId,
    });

    throw error;
  }

  return path;
}