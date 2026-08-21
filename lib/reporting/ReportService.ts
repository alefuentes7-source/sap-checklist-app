import { renderToBuffer } from "@react-pdf/renderer";

import { getChecklistDate } from "@/lib/date";
import { ReportBuilder } from "@/lib/reporting/ReportBuilder";
import { hydrateReportAssets } from "@/lib/reporting/assets";
import { ChecklistPdfDocument } from "@/lib/reporting/pdf/ChecklistPdfDocument";
import { saveReportPdf } from "@/lib/reporting/storage/ReportStorage";
import { upsertDailyReport } from "@/lib/reporting/repository/DailyReportRepository";

import type { createClient } from "@/lib/supabase/server";

type Client = ReturnType<typeof createClient>;

export interface GenerateDailyReportResult {
  reportId: string;
  pdfPath: string;
  executionDate: string;
}

export async function generateDailyClientReport(
  supabase: Client,
  params: {
    clientId: string;
    userId: string;
  }
): Promise<GenerateDailyReportResult> {
  const { clientId, userId } = params;

  const executionDate = getChecklistDate();

  /*
   * 1. Construir reporte
   */
  const builder = new ReportBuilder(supabase);

  builder.setExecutionDate(executionDate);

  await builder.loadClient(clientId);
  await builder.loadProvider();
  await builder.loadOperator(userId);
  await builder.loadSystems();
  await builder.loadChecklistResults();

  const report = builder.build();

  /*
   * 2. Preparar imágenes/logos/evidencias
   */
  const hydratedReport = await hydrateReportAssets(
    supabase,
    report
  );

  /*
   * 3. Generar PDF
   */
  const pdfDocument = ChecklistPdfDocument({
    report: hydratedReport,
  });

  const pdfBuffer = await renderToBuffer(
    pdfDocument
  );

  /*
   * 4. Guardar PDF en Storage
   */
  const pdfPath = await saveReportPdf(supabase, {
    report,
    pdfBuffer,
  });

  /*
   * 5. Registrar/actualizar daily_reports.
   *
   * upsertDailyReport deja delivery_status
   * en GENERATED.
   */
  await upsertDailyReport(supabase, {
    clientId: report.client.id,
    executionDate: report.executionDate,
    reportId: report.reportId,
    pdfPath,
    generatedBy: userId,
  });

  /*
   * IMPORTANTE:
   * Ya NO enviamos correo aquí.
   *
   * El operador primero verá la vista previa
   * y posteriormente confirmará el envío.
   */
  return {
    reportId: report.reportId,
    pdfPath,
    executionDate: report.executionDate,
  };
}