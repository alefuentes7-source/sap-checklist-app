import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { ClientList } from "@/components/ClientList";

import { SignOutButton } from "@/components/SignOutButton";

import { ChecklistDashboardRefresh } from "@/components/ChecklistDashboardRefresh";

import {
  formatChecklistDate,
  getChecklistDate,
} from "@/lib/date";

interface PerfilRow {
  name: string | null;
}

interface AsignacionRow {
  client_id: string;
}

interface ProviderRow {
  id: string;
  name: string;
  logo_url: string | null;
}

interface ClienteActivoRow {
  id: string;
  name: string;
  country: string | null;
  logo_url: string | null;
  provider_id: string | null;
  provider: ProviderRow | ProviderRow[] | null;
}

interface DailyReportRow {
  client_id: string;
  delivery_status: string | null;
}

export default async function ClientesPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: perfilData },
    { data: asignacionesData },
    { data: clientesActivosData },
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
        logo_url,
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

  const perfil =
    perfilData as PerfilRow | null;

  const asignaciones =
    (asignacionesData ?? []) as AsignacionRow[];

  const clientesActivos =
    (clientesActivosData ?? []) as ClienteActivoRow[];

  /*
   * Normalizamos provider.
   */
  const clientes = clientesActivos.map(
    (cliente) => {
      const provider = Array.isArray(
        cliente.provider
      )
        ? cliente.provider[0] ?? null
        : cliente.provider ?? null;

        return {
          id: cliente.id,
          name: cliente.name,
          country: cliente.country,
          providerName:
            provider?.name ?? null,
        
          // Primero usamos el logo propio del cliente.
          // Si no tiene, usamos el logo del proveedor.
          providerLogoUrl:
            cliente.logo_url ??
            provider?.logo_url ??
            null,
        };
    }
  );


  
  /*
   * Clientes asignados.
   */
  const idsAsignados = new Set(
    asignaciones.map(
      (asignacion) =>
        asignacion.client_id
    )
  );

  const asignados =
    clientes.filter((cliente) =>
      idsAsignados.has(cliente.id)
    );

  const disponibles =
    clientes.filter(
      (cliente) =>
        !idsAsignados.has(cliente.id)
    );

  /*
   * Estado diario.
   */
  const assignedClientIds =
    asignados.map(
      (cliente) => cliente.id
    );

  const executionDate =
    getChecklistDate();

  let sentClientIds =
    new Set<string>();

  if (assignedClientIds.length > 0) {
    const {
      data: reportsData,
      error: reportsError,
    } = await supabase
      .from("daily_reports")
      .select(
        "client_id, delivery_status"
      )
      .in(
        "client_id",
        assignedClientIds
      )
      .eq(
        "execution_date",
        executionDate
      )
      .eq(
        "delivery_status",
        "SENT_TO_CLIENT"
      );

    if (reportsError) {
      console.error(
        "Error cargando daily_reports:",
        reportsError
      );
    }

    const reports =
      (reportsData ?? []) as DailyReportRow[];

    sentClientIds =
      new Set(
        reports.map(
          (report) =>
            report.client_id
        )
      );
  }

  /*
   * Dashboard.
   */
  const totalClients =
    asignados.length;

  const completedClients =
    asignados.filter(
      (cliente) =>
        sentClientIds.has(
          cliente.id
        )
    ).length;

  const pendingClients =
    Math.max(
      totalClients -
      completedClients,
      0
    );

  const progress =
    totalClients > 0
      ? Math.round(
        (completedClients /
          totalClients) *
        100
      )
      : 0;

  return (
    <main className="min-h-screen bg-[#f5f7fa] pb-14">
      <ChecklistDashboardRefresh />

      {/* HERO */}
      <section
        className="relative overflow-hidden border-b border-white/10 bg-[#071426]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(5,18,38,0.98) 0%, rgba(5,18,38,0.92) 38%, rgba(5,18,38,0.50) 68%, rgba(5,18,38,0.22) 100%), url('/operator-hero.png')",
          backgroundPosition:
            "center right",
          backgroundSize: "cover",
        }}
      >
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6 sm:py-10">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                  <img
                    src="/uptec-logo.png"
                    alt="Uptec"
                    className="h-7 w-auto object-contain"
                  />
                </div>

                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300">
                  SAP Operations
                </span>
              </div>

              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-300">
                Checklists SAP
              </p>

              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Buenos días
                {perfil?.name
                  ? `, ${perfil.name}`
                  : ""}
              </h1>

              <p className="mt-2 text-sm capitalize text-slate-300">
                {formatChecklistDate()}
              </p>
            </div>

            <div className="shrink-0 rounded-lg border border-white/70 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-sm transition hover:bg-white">
              <SignOutButton />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 sm:px-6">
        {/* PROGRESO */}
        <section className="-mt-5 relative z-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Progreso de hoy
              </p>

              <div className="mt-1 flex items-baseline gap-2">
                <p className="font-display text-4xl font-semibold tracking-tight text-slate-900">
                  {progress}%
                </p>
              </div>
            </div>

            <p className="font-mono text-xs text-slate-500">
              {completedClients} de{" "}
              {totalClients} clientes
            </p>
          </div>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Clientes
              </p>

              <p className="mt-2 font-display text-2xl font-semibold text-slate-900">
                {totalClients}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-700">
                Completados
              </p>

              <p className="mt-2 font-display text-2xl font-semibold text-emerald-700">
                {completedClients}
              </p>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-amber-700">
                Pendientes
              </p>

              <p className="mt-2 font-display text-2xl font-semibold text-amber-700">
                {pendingClients}
              </p>
            </div>
          </div>

          {totalClients === 0 && (
            <p className="mt-4 text-sm text-slate-500">
              No tienes clientes asignados.
            </p>
          )}

          {totalClients > 0 &&
            pendingClients === 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
                <span className="text-emerald-600">
                  ✓
                </span>

                <p className="text-sm font-medium text-emerald-700">
                  Todos los clientes asignados fueron completados y enviados.
                </p>
              </div>
            )}
        </section>

        {/* CLIENTES */}
        <div className="mt-9">
          <ClientList
            asignados={asignados}
            disponibles={disponibles}
            sentClientIds={Array.from(
              sentClientIds
            )}
          />
        </div>
      </div>
    </main>
  );
}