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

  // Estados del informe final
  const [generandoInforme, setGenerandoInforme] =
    useState(false);

  const [informeEnviado, setInformeEnviado] =
    useState(false);

  const [errorInforme, setErrorInforme] =
    useState<string | null>(null);

  const [reportId, setReportId] =
    useState<string | null>(null);

  /*
   * Carga los puntos de revisión del sistema
   * seleccionado.
   */
  useEffect(() => {
    if (!selectedSystemId) return;

    async function cargarChecklist() {
      setLoading(true);

      try {
        const system = systems.find(
          (s) => s.id === selectedSystemId
        );

        if (!system) {
          return;
        }

        const {
          data: reviewPoints,
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
          .eq("system_id", selectedSystemId)
          .eq("active", true)
          .order("display_order");
          console.log("Review points activos:", reviewPoints);
          console.log("Error review points:", reviewPointsError);
        if (reviewPointsError) {
          throw reviewPointsError;
        }

        const wizardSteps: WizardStep[] =
          (reviewPoints ?? []).map((rp) => ({
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

        console.log(
          "Sistema seleccionado:",
          selectedSystemId
        );

        console.log(
          "Review points:",
          reviewPoints
        );

        console.log(
          "Wizard steps:",
          wizardSteps
        );

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
  }, [
    selectedSystemId,
    systems,
    supabase,
  ]);

  /*
   * Genera, almacena y envía el informe
   * consolidado del cliente.
   */
  async function generarYEnviarInforme() {
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

      console.log(
        "Informe generado y enviado:",
        result
      );

      setReportId(
        result.reportId ?? null
      );

      setInformeEnviado(true);
      if (window.opener) {
        window.opener.postMessage(
          {
            type: "checklist-completed",
            clientId,
          },
          window.location.origin
        );
      }
    } catch (error: any) {
      console.error(
        "Error generando/enviando informe:",
        error
      );

      setErrorInforme(
        error?.message ??
          "El checklist fue completado, pero no se pudo generar o enviar el informe."
      );
    } finally {
      setGenerandoInforme(false);
    }
  }

  /*
   * Se ejecuta cuando ChecklistWizard
   * termina el sistema actual.
   */
  async function completarSistema() {
    if (!selectedSystemId) return;

    const systemIdCompletado =
      selectedSystemId;

    /*
     * Calculamos nosotros mismos la nueva lista
     * porque setState es asíncrono.
     */
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

    /*
     * Consideramos terminado el cliente
     * únicamente cuando TODOS sus sistemas
     * activos están completados.
     */
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
     * Era el último sistema.
     * Generamos y enviamos el informe.
     */
    await generarYEnviarInforme();
  }

  /*
   * Pantalla mientras se genera y
   * envía el informe.
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
            Estamos generando el PDF y
            enviándolo a tu correo.
          </p>
        </div>
      </div>
    );
  }

  /*
   * Pantalla final exitosa.
   */
  if (informeEnviado) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-2xl">
          ✅
        </div>

        <div>
          <h1 className="font-display text-xl font-medium text-ink">
            Checklist diario completado
          </h1>

          <p className="mt-2 text-sm text-ink-soft">
            Todos los sistemas de{" "}
            <strong>{clientName}</strong>{" "}
            fueron revisados.
          </p>

          <p className="mt-1 text-sm text-ink-soft">
            El informe fue generado,
            almacenado y enviado
            correctamente a tu correo.
          </p>

          {reportId && (
            <p className="mt-3 font-mono text-xs text-ink-soft">
              {reportId}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => window.close()}
          className="mt-2 rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent"
        >
          Cerrar ventana
        </button>
      </div>
    );
  }

  /*
   * El checklist terminó, pero falló
   * la generación o envío del informe.
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
            onClick={
              generarYEnviarInforme
            }
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-accent"
          >
            Reintentar envío
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
   * Wizard del sistema seleccionado.
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