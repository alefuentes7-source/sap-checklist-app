"use client";

interface ClientCardProps {
  id: string;
  name: string;
  country: string | null;
  providerName: string | null;
  providerLogoUrl?: string | null;
  assigned: boolean;
  sent: boolean;
}

export function ClientCard({
  id,
  name,
  country,
  providerName,
  providerLogoUrl,
  assigned,
  sent,
}: ClientCardProps) {
  function abrirWizard() {
    const url =
      `/checklist/nuevo?cliente=${id}`;

    const width = Math.round(
      window.screen.availWidth * 0.25
    );

    const height =
      window.screen.availHeight;

    const popup = window.open(
      url,
      `checklist-${id}`,
      `width=${width},height=${height},left=0,top=0,resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      window.location.href = url;
    } else {
      popup.focus();
    }
  }

  return (
    <button
      type="button"
      onClick={abrirWizard}
      className={`group relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-xl border p-4 text-left shadow-sm transition-all duration-200 ${
        sent
          ? "border-emerald-200 bg-emerald-50/50 hover:border-emerald-300"
          : assigned
            ? "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-cyan-400 hover:shadow-md"
            : "border-slate-200 bg-white/70 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md"
      }`}
    >
      {/* Línea lateral */}
      <div
        className={`absolute bottom-0 left-0 top-0 w-1 ${
          sent
            ? "bg-emerald-500"
            : assigned
              ? "bg-cyan-500"
              : "bg-slate-300"
        }`}
      />

      <div className="flex min-w-0 items-center gap-3 pl-1">
        {providerLogoUrl ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
            <img
              src={providerLogoUrl}
              alt={`Logo de ${
                providerName ??
                "proveedor"
              }`}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-display text-sm font-semibold text-slate-500">
            {name
              .slice(0, 2)
              .toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold text-slate-900">
            {name}
          </p>

          <p className="mt-1 truncate font-mono text-[11px] text-slate-500">
            {[country, providerName]
              .filter(Boolean)
              .join(" · ") ||
              "Sin datos de proveedor"}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${
            sent
              ? "border-emerald-200 bg-emerald-100 text-emerald-700"
              : assigned
                ? "border-cyan-100 bg-cyan-50 text-cyan-700"
                : "border-slate-200 bg-slate-100 text-slate-500"
          }`}
        >
          {sent
            ? "✓ Enviado"
            : assigned
              ? "Asignado"
              : "No asignado"}
        </span>

        {!sent && (
          <span className="text-lg text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-cyan-500">
            ›
          </span>
        )}
      </div>
    </button>
  );
}