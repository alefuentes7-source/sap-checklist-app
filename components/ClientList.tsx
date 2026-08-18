import { ClientCard } from "@/components/ClientCard";

interface ClientRow {
  id: string;
  name: string;
  country: string | null;
  providerName: string | null;
  providerLogoUrl?: string | null;
}

interface ClientListProps {
  asignados: ClientRow[];
  disponibles: ClientRow[];
  sentClientIds: string[];
}

export function ClientList({
  asignados,
  disponibles,
  sentClientIds,
}: ClientListProps) {
  return (
    <div className="space-y-10">
      <section>
        <header className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-medium text-ink">
            Tus clientes
          </h2>

          <span className="font-mono text-xs text-ink-soft">
            {asignados.length}
          </span>
        </header>

        {asignados.length > 0 ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {asignados.map((cliente) => (
              <ClientCard
                key={cliente.id}
                id={cliente.id}
                name={cliente.name}
                country={cliente.country}
                providerName={cliente.providerName}
                assigned={true}
                sent={sentClientIds.includes(cliente.id)}
              />
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-card border border-dashed border-line p-4 text-sm text-ink-soft">
            No tienes clientes asignados todavía. Elige uno de la lista de
            abajo si vas a cubrir un checklist.
          </p>
        )}
      </section>

      {disponibles.length > 0 && (
        <section>
          <header className="flex items-baseline justify-between border-t border-line pt-6">
            <h2 className="font-display text-base font-medium text-ink-soft">
              Otros clientes
            </h2>

            <span className="font-mono text-xs text-ink-soft">
              {disponibles.length}
            </span>
          </header>

          <p className="mt-1 text-sm text-ink-soft">
            Úsalos solo para cubrir un checklist cuando el operador asignado
            no pueda hacerlo.
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {disponibles.map((cliente) => (
              <ClientCard
                key={cliente.id}
                id={cliente.id}
                name={cliente.name}
                country={cliente.country}
                providerName={cliente.providerName}
                assigned={false}
                sent={false}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}