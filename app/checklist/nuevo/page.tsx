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
  .select("id, sid, description, environment, display_order")
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

  return (
    <main className="h-screen">
      <ChecklistContainer
        clientId={client.id}
        clientName={client.name}
        systems={systems ?? []}
        initialCompletedSystems={initialCompletedSystems}
      />
    </main>
  );
}