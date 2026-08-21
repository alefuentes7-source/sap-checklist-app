import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getChecklistDate } from "@/lib/date";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);

    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "Debe indicar clientId" },
        { status: 400 }
      );
    }

    const executionDate = getChecklistDate();

    const {
      data: reportData,
      error: reportError,
    } = await supabase
      .from("daily_reports")
      .select("pdf_path, report_id")
      .eq("client_id", clientId)
      .eq("execution_date", executionDate)
      .single();

    if (reportError || !reportData?.pdf_path) {
      return NextResponse.json(
        { error: "No se encontró el informe del día." },
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
      console.error(
        "Error descargando PDF:",
        downloadError
      );

      return NextResponse.json(
        { error: "No se pudo descargar el PDF." },
        { status: 500 }
      );
    }

    const arrayBuffer = await pdfFile.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${reportData.report_id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error(
      "Error preview report:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ??
          "No se pudo mostrar el informe.",
      },
      {
        status: 500,
      }
    );
  }
}