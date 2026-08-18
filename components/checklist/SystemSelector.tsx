"use client";

interface SystemItem {
  id: string;
  sid: string | null;
  description: string | null;
  environment: string | null;
}

interface Props {
  systems: SystemItem[];
  completedSystems: string[];
  onSelect: (systemId: string) => void;
}

export function SystemSelector({
  systems,
  completedSystems,
  onSelect,
}: Props) {
  const completedCount = completedSystems.filter((systemId) =>
    systems.some((system) => system.id === systemId)
  ).length;

  const progress =
    systems.length > 0
      ? Math.round((completedCount / systems.length) * 100)
      : 0;

  if (systems.length === 0) {
    return (
      <div className="mt-6 rounded-card border border-dashed border-line p-4">
        <p className="text-sm text-ink-soft">
          Este cliente no tiene sistemas activos configurados.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mt-1 text-sm text-ink-soft">
        Selecciona un sistema
      </p>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">
            Progreso
          </p>

          <span className="font-mono text-xs text-ink-soft">
            {completedCount} de {systems.length}
          </span>
        </div>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {systems.map((system) => {
          const completed = completedSystems.includes(system.id);

          return (
            <button
              key={system.id}
              type="button"
              disabled={completed}
              onClick={() => onSelect(system.id)}
              className={`w-full rounded-card border p-4 text-left transition ${
                completed
                  ? "cursor-default border-accent/30 bg-accent-soft opacity-80"
                  : "border-line bg-surface hover:border-accent"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-base text-ink">
                    {system.sid ?? "Sin SID"}
                  </p>

                  {system.description && (
                    <p className="mt-0.5 text-sm text-ink-soft">
                      {system.description}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  {system.environment && (
                    <p className="font-mono text-xs text-ink-soft">
                      {system.environment}
                    </p>
                  )}

                  {completed && (
                    <span className="mt-1 inline-block rounded-full bg-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-white">
                      Completado
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}