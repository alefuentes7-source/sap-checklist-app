import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type { DailyClientReport } from "@/lib/reporting/types";

type Client = SupabaseClient<Database>;

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