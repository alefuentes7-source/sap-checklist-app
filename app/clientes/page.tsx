import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientList } from "@/components/ClientList";
import { SignOutButton } from "@/components/SignOutButton";
import { ChecklistDashboardRefresh } from "@/components/ChecklistDashboardRefresh";
import {
  formatChecklistDate,
  getChecklistDate,
} from "@/lib/date";


export default async function ClientesPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: perfil },
    { data: asignaciones },
    { data: clientesActivos },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single(),

    supabase
      .from("user_clients")
      .select("client_id")
      .eq("user_id", user.id),

    supabase
      .from("clients")
      .select(`
        id,
        name,
        country,
        provider_id,
        provider:providers (
          id,
          name,
          logo_url
        )
      `)
      .eq("active", true)
      .order("name"),
  ]);

  const idsAsignados = new Set(
    (asignaciones ?? []).map(
      (asignacion) => asignacion.client_id
    )
  );

  const clientes = (clientesActivos ?? []).map(
    (cliente) => {
      const provider = Array.isArray(cliente.provider)
        ? cliente.provider[0] ?? null
        : cliente.provider ?? null;

      return {
        id: cliente.id,
        name: cliente.name,
        country: cliente.country,
        providerName: provider?.name ?? null,
        providerLogoUrl: provider?.logo_url ?? null,
      };
    }
  );

  const asignados = clientes.filter((cliente) =>
    idsAsignados.has(cliente.id)
  );

  const disponibles = clientes.filter(
    (cliente) => !idsAsignados.has(cliente.id)
  );

  const assignedClientIds = asignados.map(
    (cliente) => cliente.id
  );

  const executionDate = getChecklistDate();

  let sentClientIds = new Set<string>();

  if (assignedClientIds.length > 0) {
    const { data: reports, error: reportsError } =
      await supabase
        .from("daily_reports")
        .select("client_id, delivery_status")
        .in("client_id", assignedClientIds)
        .eq("execution_date", executionDate)
        .eq(
          "delivery_status",
          "SENT_TO_OPERATOR"
        );

    if (reportsError) {
      console.error(
        "Error cargando daily_reports:",
        reportsError
      );
    }

    sentClientIds = new Set(
      (reports ?? []).map(
        (report) => report.client_id
      )
    );
  }

  /*
   * El dashboard ahora trabaja a nivel CLIENTE,
   * no a nivel de sistemas.
   */
  const totalClients = asignados.length;

  const completedClients = asignados.filter(
    (cliente) => sentClientIds.has(cliente.id)
  ).length;

  const pendingClients = Math.max(
    totalClients - completedClients,
    0
  );

  const progress =
    totalClients > 0
      ? Math.round(
          (completedClients / totalClients) * 100
        )
      : 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* Escucha cuando un popup termina y refresca
          automáticamente los datos de esta página */}
      <ChecklistDashboardRefresh />

      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Checklists SAP
          </p>

          <h1 className="mt-1 font-display text-2xl font-medium text-ink">
            Buenos días
            {perfil?.name
              ? `, ${perfil.name}`
              : ""}
          </h1>

          <p className="mt-1 text-sm capitalize text-ink-soft">
            {formatChecklistDate()}
          </p>
        </div>

        <SignOutButton />
      </header>

      <section className="mt-7 rounded-card border border-line bg-surface p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">
              Progreso de hoy
            </p>

            <p className="mt-1 font-display text-3xl font-medium text-ink">
              {progress}%
            </p>
          </div>

          <p className="font-mono text-xs text-ink-soft">
            {completedClients} de {totalClients} clientes
          </p>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
          <div
            className="h-full bg-accent transition-all"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-md bg-bg p-3">
            <p className="font-mono text-[10px] uppercase tracking-wide text-ink-soft">
              Clientes
            </p>

            <p className="mt-1 font-display text-xl font-medium text-ink">
              {totalClients}
            </p>
          </div>

          <div className="rounded-md bg-accent-soft p-3">
            <p className="font-mono text-[10px] uppercase tracking-wide text-accent">
              Completados
            </p>

            <p className="mt-1 font-display text-xl font-medium text-accent">
              {completedClients}
            </p>
          </div>

          <div className="rounded-md bg-warn-soft p-3">
            <p className="font-mono text-[10px] uppercase tracking-wide text-warn">
              Pendientes
            </p>

            <p className="mt-1 font-display text-xl font-medium text-warn">
              {pendingClients}
            </p>
          </div>
        </div>

        {totalClients === 0 && (
          <p className="mt-4 text-sm text-ink-soft">
            No tienes clientes asignados.
          </p>
        )}

        {totalClients > 0 &&
          pendingClients === 0 && (
            <p className="mt-4 text-sm font-medium text-accent">
              ✅ Todos los clientes asignados fueron completados y enviados.
            </p>
          )}
      </section>

      <div className="mt-8">
        <ClientList
          asignados={asignados}
          disponibles={disponibles}
          sentClientIds={Array.from(
            sentClientIds
          )}
        />
      </div>
    </main>
  );
}