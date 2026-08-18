import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { generateDailyClientReport } from "@/lib/reporting/ReportService";

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

    if (!user.email) {
      return NextResponse.json(
        { error: "El usuario autenticado no tiene correo." },
        { status: 400 }
      );
    }
    
    const body = await request.json();

    const clientId = body?.clientId;

    if (!clientId) {
      return NextResponse.json(
        { error: "Debe indicar clientId" },
        { status: 400 }
      );
    }

    const result = await generateDailyClientReport(
      supabase,
      {
        clientId,
        userId: user.id,
        userEmail: user.email,
      }
    );

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Error generate report:", error);

    return NextResponse.json(
      {
        error:
          error?.message ??
          "No se pudo generar el informe",
      },
      {
        status: 500,
      }
    );
  }
}