import type { createClient } from "@/lib/supabase/server";
type Client = ReturnType<typeof createClient>;

export interface UpsertDailyReportParams {
  clientId: string;
  executionDate: string;
  reportId: string;
  pdfPath: string;
  generatedBy: string;
}

export async function upsertDailyReport(
  supabase: Client,
  params: UpsertDailyReportParams
): Promise<void> {
  const {
    clientId,
    executionDate,
    reportId,
    pdfPath,
    generatedBy,
  } = params;

  const { error } = await supabase
    .from("daily_reports")
    .upsert(
      {
        client_id: clientId,
        execution_date: executionDate,
        report_id: reportId,
        pdf_path: pdfPath,
        generated_at: new Date().toISOString(),
        generated_by: generatedBy,

        // Cuando se vuelve a generar el informe,
        // todavía no asumimos que el correo fue enviado.
        mail_error: null,
        delivery_status: "GENERATED",
      },
      {
        onConflict: "client_id,execution_date",
      }
    );

  if (error) {
    console.error("Error registrando daily_report:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw error;
  }
}

export async function markDailyReportMailSent(
  supabase: Client,
  params: {
    clientId: string;
    executionDate: string;
    recipients: string[];
    deliveryStatus?: "SENT_TO_OPERATOR" | "SENT_TO_CLIENT";
  }
): Promise<void> {
  const {
    clientId,
    executionDate,
    recipients,
    deliveryStatus = "SENT_TO_OPERATOR",
  } = params;

  const { error } = await supabase
    .from("daily_reports")
    .update({
      mail_sent_at: new Date().toISOString(),
      mail_recipients: recipients,
      mail_error: null,
      delivery_status: deliveryStatus,
    })
    .eq("client_id", clientId)
    .eq("execution_date", executionDate);

  if (error) {
    throw error;
  }
}

export async function markDailyReportMailError(
  supabase: Client,
  params: {
    clientId: string;
    executionDate: string;
    errorMessage: string;
  }
): Promise<void> {
  const {
    clientId,
    executionDate,
    errorMessage,
  } = params;

  const { error } = await supabase
    .from("daily_reports")
    .update({
      mail_error: errorMessage,
      delivery_status: "ERROR",
    })
    .eq("client_id", clientId)
    .eq("execution_date", executionDate);

  if (error) {
    console.error(
      "No se pudo registrar el error de correo:",
      error
    );
  }
}