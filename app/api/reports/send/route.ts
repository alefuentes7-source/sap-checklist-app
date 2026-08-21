import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getChecklistDate } from "@/lib/date";
import { sendEmail } from "@/lib/email/EmailService";

import {
  markDailyReportMailSent,
  markDailyReportMailError,
} from "@/lib/reporting/repository/DailyReportRepository";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const clientId = body?.clientId;
    const recipients = body?.recipients;

    if (!clientId) {
      return NextResponse.json(
        { error: "Debe indicar clientId" },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(recipients) ||
      recipients.length === 0
    ) {
      return NextResponse.json(
        { error: "Debe indicar al menos un destinatario" },
        { status: 400 }
      );
    }

    const executionDate = getChecklistDate();

    const {
      data: reportData,
      error: reportError,
    } = await supabase
      .from("daily_reports")
      .select("report_id, pdf_path")
      .eq("client_id", clientId)
      .eq("execution_date", executionDate)
      .single();

    if (reportError || !reportData?.pdf_path) {
      return NextResponse.json(
        { error: "No se encontró el informe generado." },
        { status: 404 }
      );
    }

    const {
      data: clientData,
      error: clientError,
    } = await supabase
      .from("clients")
      .select("name")
      .eq("id", clientId)
      .single();

    if (clientError || !clientData) {
      return NextResponse.json(
        { error: "No se encontró el cliente." },
        { status: 404 }
      );
    }

    const {
      data: pdfFile,
      error: downloadError,
    } = await supabase.storage
      .from("reports")
      .download(reportData.pdf_path);

    if (downloadError || !pdfFile) {
      throw new Error(
        "No se pudo descargar el PDF desde Storage."
      );
    }

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    const subject =
      `Checklist SAP - ${clientData.name} - ${executionDate}`;

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937">
        <h2>Informe diario de checklist SAP</h2>

        <p>
          Se adjunta el informe correspondiente al cliente
          <strong>${clientData.name}</strong>.
        </p>

        <p>
          Fecha: ${executionDate}
        </p>

        <p>
          Este correo fue generado automáticamente por SAP Checklist.
        </p>
      </div>
    `;

    await sendEmail({
      to: recipients,
      subject,
      html,
      attachments: [
        {
          filename: `${reportData.report_id}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    await markDailyReportMailSent(supabase, {
      clientId,
      executionDate,
      recipients,
      deliveryStatus: "SENT_TO_CLIENT",
    });

    return NextResponse.json({
      ok: true,
      sentTo: recipients,
    });
  } catch (error: any) {
    console.error(
      "Error enviando informe al cliente:",
      error
    );

    try {
      const supabase = createClient();

      const body = await request.clone().json().catch(() => null);

      if (body?.clientId) {
        await markDailyReportMailError(supabase, {
          clientId: body.clientId,
          executionDate: getChecklistDate(),
          errorMessage:
            error?.message ??
            "Error desconocido enviando informe.",
        });
      }
    } catch {}

    return NextResponse.json(
      {
        error:
          error?.message ??
          "No se pudo enviar el informe.",
      },
      { status: 500 }
    );
  }
}