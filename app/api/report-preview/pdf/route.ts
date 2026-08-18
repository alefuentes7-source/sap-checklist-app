import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { createClient } from "@/lib/supabase/server";
import { ReportBuilder } from "@/lib/reporting/ReportBuilder";
import { ChecklistPdfDocument } from "@/lib/reporting/pdf/ChecklistPdfDocument";
import { getChecklistDate } from "@/lib/date";
import { hydrateReportAssets } from "@/lib/reporting/assets";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    const clientId = request.nextUrl.searchParams.get("client");

    if (!clientId) {
        return NextResponse.json(
            { error: "Debe indicar ?client=<uuid>" },
            { status: 400 }
        );
    }

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

    try {
        const builder = new ReportBuilder(supabase);

        builder.setExecutionDate(getChecklistDate());

        await builder.loadClient(clientId);
        await builder.loadProvider();
        await builder.loadOperator(user.id);
        await builder.loadSystems();
        await builder.loadChecklistResults();

        const report = builder.build();

        const hydratedReport = await hydrateReportAssets(
            supabase,
            report
        );

        const pdfDocument = ChecklistPdfDocument({
            report: hydratedReport,
          });
          
          const pdfBuffer = await renderToBuffer(pdfDocument);

          const pdfBytes = new Uint8Array(pdfBuffer);

          return new NextResponse(pdfBytes, {
            status: 200,
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `inline; filename="${report.reportId}.pdf"`,
            },
          });
    } catch (error) {
        console.error("Error generando PDF:", error);

        return NextResponse.json(
            {
                error: "No se pudo generar el PDF",
            },
            {
                status: 500,
            }
        );
    }
}