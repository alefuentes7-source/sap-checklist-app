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
    const url = `/checklist/nuevo?cliente=${id}`;
    const width = Math.round(window.screen.availWidth * 0.25);
    const height = window.screen.availHeight;

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
      className={`group flex w-full items-center justify-between gap-3 rounded-card border p-4 text-left transition ${
        assigned
          ? "border-line bg-surface hover:border-accent"
          : "border-line/70 bg-surface/60 hover:border-ink-soft"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {providerLogoUrl && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-white p-1">
            <img
              src={providerLogoUrl}
              alt={`Logo de ${providerName ?? "proveedor"}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate font-display text-base font-medium text-ink">
            {name}
          </p>

          <p className="mt-0.5 truncate font-mono text-xs text-ink-soft">
            {[country, providerName].filter(Boolean).join(" · ") ||
              "Sin datos de proveedor"}
          </p>
        </div>
      </div>

      <span
  className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide ${
    sent
      ? "bg-accent-soft text-accent"
      : assigned
        ? "bg-line/60 text-ink-soft"
        : "bg-line/60 text-ink-soft"
  }`}
>
  {sent
    ? "✓ Enviado"
    : assigned
      ? "Asignado"
      : "Cobertura"}
</span>
    </button>
  );
}