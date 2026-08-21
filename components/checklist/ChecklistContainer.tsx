"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ChecklistWizard,
  type WizardStep,
} from "./ChecklistWizard";
import { SystemSelector } from "./SystemSelector";

interface SystemItem {
  id: string;
  sid: string | null;
  description: string | null;
  environment: string | null;
}

interface Props {
  clientId: string;
  clientName: string;
  systems: SystemItem[];
  initialCompletedSystems: string[];
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  role_description: string | null;
}

export function ChecklistContainer({
  clientId,
  clientName,
  systems,
  initialCompletedSystems,
}: Props) {
  const supabase = useMemo(() => createClient(), []);

  const [selectedSystemId, setSelectedSystemId] =
    useState<string | null>(null);

  const [completedSystems, setCompletedSystems] =
    useState<string[]>(initialCompletedSystems);

  const [systemSteps, setSystemSteps] =
    useState<WizardStep[]>([]);

  const [loading, setLoading] = useState(false);

  /*
   * Estado del informe.
   */
  const [generandoInforme, setGenerandoInforme] =
    useState(false);

  const [informeGenerado, setInformeGenerado] =
    useState(false);

  const [errorInforme, setErrorInforme] =
    useState<string | null>(null);

  const [reportId, setReportId] =
    useState<string | null>(null);

  /*
   * Destinatarios.
   */
  const [recipients, setRecipients] =
    useState<Recipient[]>([]);

  const [selectedRecipientIds, setSelectedRecipientIds] =
    useState<string[]>([]);

  const [loadingRecipients, setLoadingRecipients] =
    useState(false);

  /*
   * Carga puntos de revisión del sistema.
   */
  useEffect(() => {
    if (!selectedSystemId) return;

    const systemId = selectedSystemId;

    async function cargarChecklist() {
      setLoading(true);

      try {
        const system = systems.find(
          (s) => s.id === systemId
        );

        if (!system) {
          return;
        }

        const {
          data: reviewPointsData,
          error: reviewPointsError,
        } = await supabase
          .from("review_points")
          .select(`
            id,
            title,
            description,
            review_instructions,
            mandatory,
            evidence_required,
            severity
          `)
          .eq("system_id", systemId)
          .eq("active", true)
          .order("display_order");

        if (reviewPointsError) {
          throw reviewPointsError;
        }

        type ReviewPointRow = {
          id: string;
          title: string;
          description: string | null;
          review_instructions: string | null;
          mandatory: boolean;
          evidence_required: boolean;
          severity: string | null;
        };

        const reviewPoints =
          (reviewPointsData ?? []) as ReviewPointRow[];

        const wizardSteps: WizardStep[] =
          reviewPoints.map((rp) => ({
            system,
            reviewPoint: {
              id: rp.id,
              title: rp.title,
              description: rp.description,
              review_instructions:
                rp.review_instructions,
              mandatory: rp.mandatory,
              evidence_required:
                rp.evidence_required,
              severity: rp.severity,
            },
          }));

        setSystemSteps(wizardSteps);
      } catch (error) {
        console.error(
          "Error cargando checklist:",
          error
        );

        setSystemSteps([]);
      } finally {
        setLoading(false);
      }
    }

    cargarChecklist();
  }, [selectedSystemId, systems, supabase]);

  useEffect(() => {
    if (!informeGenerado) return;

    try {
      window.moveTo(0, 0);
      window.resizeTo(
        window.screen.availWidth,
        window.screen.availHeight
      );
    } catch (error) {
      console.warn(
        "No fue posible maximizar la ventana:",
        error
      );
    }
  }, [informeGenerado]);

  /*
   * Obtiene los contactos activos del cliente.
   */
  async function cargarDestinatarios() {
    setLoadingRecipients(true);

    try {
      const response = await fetch(
        `/api/reports/recipients?clientId=${encodeURIComponent(
          clientId
        )}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ??
          "No se pudieron cargar los destinatarios."
        );
      }

      const contacts: Recipient[] =
        result.contacts ?? [];

      setRecipients(contacts);

      /*
       * Todos seleccionados inicialmente.
       */
      setSelectedRecipientIds(
        contacts.map((contact) => contact.id)
      );
    } finally {
      setLoadingRecipients(false);
    }
  }

  /*
   * Genera y almacena el informe.
   * NO lo envía.
   */
  async function generarInforme() {
    setGenerandoInforme(true);
    setErrorInforme(null);

    try {
      const response = await fetch(
        "/api/reports/generate",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            clientId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ??
          "No se pudo generar el informe."
        );
      }

      setReportId(
        result.reportId ?? null
      );

      /*
       * Después de generar el PDF,
       * cargamos los destinatarios.
       */
      await cargarDestinatarios();

      setInformeGenerado(true);
    } catch (error: any) {
      console.error(
        "Error generando informe:",
        error
      );

      setErrorInforme(
        error?.message ??
        "El checklist fue completado, pero no se pudo generar el informe."
      );
    } finally {
      setGenerandoInforme(false);
    }
  }

  /*
   * Selecciona/desmarca destinatario.
   */
  function toggleRecipient(id: string) {
    setSelectedRecipientIds((prev) =>
      prev.includes(id)
        ? prev.filter(
          (recipientId) =>
            recipientId !== id
        )
        : [...prev, id]
    );
  }

  /*
   * Próximo paso:
   * aquí conectaremos /api/reports/send.
   */
  async function enviarInforme() {
    const selectedRecipients =
      recipients.filter((recipient) =>
        selectedRecipientIds.includes(
          recipient.id
        )
      );
  
    if (selectedRecipients.length === 0) {
      return;
    }
  
    try {
      setErrorInforme(null);
  
      const response = await fetch(
        "/api/reports/send",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            clientId,
            recipients:
              selectedRecipients.map(
                (recipient) => recipient.email
              ),
          }),
        }
      );
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(
          result?.error ??
            "No se pudo enviar el informe."
        );
      }
  
      if (window.opener) {
        window.opener.postMessage(
          {
            type: "checklist-completed",
            clientId,
          },
          window.location.origin
        );
      }
  
      window.close();
    } catch (error: any) {
      console.error(
        "Error enviando informe:",
        error
      );
  
      setErrorInforme(
        error?.message ??
          "No se pudo enviar el informe."
      );
    }
  }

  /*
   * Se ejecuta al terminar un sistema.
   */
  async function completarSistema() {
    if (!selectedSystemId) return;

    const systemIdCompletado =
      selectedSystemId;

    const nuevosCompletados =
      completedSystems.includes(
        systemIdCompletado
      )
        ? completedSystems
        : [
          ...completedSystems,
          systemIdCompletado,
        ];

    setCompletedSystems(
      nuevosCompletados
    );

    setSelectedSystemId(null);
    setSystemSteps([]);

    const todosCompletados =
      systems.length > 0 &&
      systems.every((system) =>
        nuevosCompletados.includes(
          system.id
        )
      );

    if (!todosCompletados) {
      return;
    }

    /*
     * Último sistema:
     * generar PDF para revisión.
     */
    await generarInforme();
  }

  /*
   * Generando PDF.
   */
  if (generandoInforme) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-accent" />

        <div>
          <h1 className="font-display text-xl font-medium text-ink">
            Generando informe
          </h1>

          <p className="mt-2 text-sm text-ink-soft">
            El checklist fue completado.
          </p>

          <p className="mt-1 text-sm text-ink-soft">
            Estamos preparando el PDF para
            que puedas revisarlo antes de enviarlo.
          </p>
        </div>
      </div>
    );
  }

  /*
   * Pantalla de revisión del informe.
   */
  if (informeGenerado) {
    const selectedCount =
      selectedRecipientIds.length;

    return (
      <div className="flex h-screen flex-col bg-bg">
        {/* Encabezado */}
        <div className="shrink-0 border-b border-line bg-surface px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                Informe listo para revisión
              </p>

              <h1 className="mt-1 font-display text-xl font-medium text-ink">
                {clientName}
              </h1>

              {reportId && (
                <p className="mt-1 font-mono text-[10px] text-ink-soft">
                  {reportId}
                </p>
              )}
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-xl">
              ✓
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="min-h-0 flex flex-1 gap-4 p-4">
          {/* PDF */}
          <div className="min-w-0 flex-1 overflow-hidden rounded-card border border-line bg-surface">
            <iframe
              key={reportId ?? "preview"}
              src={`/api/reports/preview?clientId=${encodeURIComponent(
                clientId
              )}&t=${Date.now()}`}
              title="Vista previa del informe"
              className="h-full min-h-[500px] w-full"
            />
          </div>

          {/* Destinatarios */}
          <div className="flex w-[340px] shrink-0 flex-col rounded-card border border-line bg-surface">
            <div className="border-b border-line p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
                Destinatarios
              </p>

              <p className="mt-1 text-sm text-ink">
                Selecciona quién recibirá el
                informe.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {loadingRecipients && (
                <p className="p-2 text-sm text-ink-soft">
                  Cargando destinatarios...
                </p>
              )}

              {!loadingRecipients &&
                recipients.length === 0 && (
                  <div className="rounded-md bg-warn-soft p-3">
                    <p className="text-sm text-warn">
                      Este cliente no tiene
                      contactos activos con correo
                      configurado.
                    </p>
                  </div>
                )}

              {!loadingRecipients &&
                recipients.map((recipient) => {
                  const checked =
                    selectedRecipientIds.includes(
                      recipient.id
                    );

                  return (
                    <label
                      key={recipient.id}
                      className="mb-2 flex cursor-pointer items-start gap-3 rounded-md border border-line p-3 transition hover:bg-bg"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleRecipient(
                            recipient.id
                          )
                        }
                        className="mt-1"
                      />

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">
                          {recipient.name}
                        </p>

                        <p className="mt-0.5 break-all text-xs text-ink-soft">
                          {recipient.email}
                        </p>

                        {recipient.role_description && (
                          <p className="mt-1 text-[11px] text-ink-soft">
                            {
                              recipient.role_description
                            }
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
            </div>

            {/* Botón envío */}
            <div className="border-t border-line p-4">
              <button
                type="button"
                disabled={
                  selectedCount === 0 ||
                  loadingRecipients
                }
                onClick={enviarInforme}
                className="w-full rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                {selectedCount === 0
                  ? "Selecciona destinatarios"
                  : `Enviar a ${selectedCount} ${selectedCount === 1
                    ? "destinatario"
                    : "destinatarios"
                  }`}
              </button>

              <button
                type="button"
                onClick={() => window.close()}
                className="mt-2 w-full rounded-md border border-line px-4 py-2 text-sm text-ink-soft transition hover:border-ink-soft"
              >
                Cerrar sin enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
   * Error generando informe.
   */
  if (errorInforme) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warn-soft text-2xl">
          ⚠️
        </div>

        <div>
          <h1 className="font-display text-xl font-medium text-ink">
            Checklist completado
          </h1>

          <p className="mt-2 text-sm text-ink-soft">
            Los resultados de{" "}
            <strong>{clientName}</strong>{" "}
            fueron guardados correctamente.
          </p>

          <p className="mt-3 text-sm text-warn">
            {errorInforme}
          </p>
        </div>

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={generarInforme}
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-accent"
          >
            Reintentar generación
          </button>

          <button
            type="button"
            onClick={() => window.close()}
            className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-soft transition hover:border-ink-soft"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  /*
   * Selector de sistemas.
   */
  if (!selectedSystemId) {
    return (
      <div className="h-screen p-4">
        <h1 className="font-display text-xl font-medium text-ink">
          {clientName}
        </h1>

        <SystemSelector
          systems={systems}
          completedSystems={
            completedSystems
          }
          onSelect={
            setSelectedSystemId
          }
        />
      </div>
    );
  }

  /*
   * Cargando sistema.
   */
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-ink-soft">
          Cargando checklist...
        </p>
      </div>
    );
  }

  /*
   * Wizard.
   */
  return (
    <div className="flex h-screen flex-col">
      <div className="border-b border-line px-4 py-3">
        <button
          type="button"
          onClick={() => {
            setSelectedSystemId(null);
            setSystemSteps([]);
          }}
          className="text-sm text-accent hover:underline"
        >
          ← Volver a sistemas
        </button>
      </div>

      <div className="min-h-0 flex-1">
        <ChecklistWizard
          clientId={clientId}
          clientName={clientName}
          steps={systemSteps}
          onCompleted={
            completarSistema
          }
        />
      </div>
    </div>
  );
}