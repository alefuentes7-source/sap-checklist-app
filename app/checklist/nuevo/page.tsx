import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChecklistContainer } from "@/components/checklist/ChecklistContainer";
import { getChecklistDate } from "@/lib/date";

export default async function NuevoChecklistPage({
  searchParams,
}: {
  searchParams: {
    cliente?: string;
  };
}) {
  const clientId = searchParams.cliente;

  if (!clientId) {
    redirect("/clientes");
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: clientData } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", clientId)
    .single();

  const client = clientData as {
    id: string;
    name: string;
  } | null;

  if (!client) {
    redirect("/clientes");
  }

  const executionDate = getChecklistDate();

  const { data: systemsData } = await supabase
    .from("systems")
    .select(
      "id, sid, description, environment, display_order"
    )
    .eq("client_id", clientId)
    .eq("active", true)
    .order("display_order", {
      ascending: true,
      nullsFirst: true,
    });

  const systems =
    (systemsData ?? []) as {
      id: string;
      sid: string | null;
      description: string | null;
      environment: string | null;
      display_order: number | null;
    }[];

  /*
   * Sistemas revisados del día.
   *
   * submitted = true significa "revisado",
   * NO significa que el cliente esté cerrado.
   */
  const { data: completedChecklistsData } = await supabase
    .from("checklists")
    .select("system_id")
    .eq("client_id", clientId)
    .eq("created_by", user.id)
    .eq("execution_date", executionDate)
    .eq("submitted", true);

  const completedChecklists =
    (completedChecklistsData ?? []) as {
      system_id: string;
    }[];

  const initialCompletedSystems = Array.from(
    new Set(
      completedChecklists.map(
        (checklist) => checklist.system_id
      )
    )
  );

  /*
   * El cliente solo queda realmente cerrado
   * cuando el informe fue enviado al cliente.
   */
  const {
    data: dailyReportData,
    error: dailyReportError,
  } = await supabase
    .from("daily_reports")
    .select("delivery_status")
    .eq("client_id", clientId)
    .eq("execution_date", executionDate)
    .maybeSingle();

  if (dailyReportError) {
    console.error(
      "Error cargando estado de daily_reports:",
      dailyReportError
    );
  }

  const clientSent =
    dailyReportData?.delivery_status ===
    "SENT_TO_CLIENT";

  return (
    <main className="h-screen">
      <ChecklistContainer
        clientId={client.id}
        clientName={client.name}
        systems={systems}
        initialCompletedSystems={
          initialCompletedSystems
        }
        clientSent={clientSent}
      />
    </main>
  );
}