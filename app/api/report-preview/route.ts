import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { ReportBuilder } from "@/lib/reporting/ReportBuilder";
import { getChecklistDate } from "@/lib/date";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const clientId = searchParams.get("client");

  if (!clientId) {
    return NextResponse.json(
      {
        error: "Debe indicar ?client=<uuid>",
      },
      {
        status: 400,
      }
    );
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "No autenticado",
      },
      {
        status: 401,
      }
    );
  }

  const builder = new ReportBuilder(supabase);

  builder.setExecutionDate(getChecklistDate());

  await builder.loadClient(clientId);
  await builder.loadProvider();
  await builder.loadOperator(user.id);
  await builder.loadSystems();
  await builder.loadChecklistResults();

  return NextResponse.json(builder.build());
}