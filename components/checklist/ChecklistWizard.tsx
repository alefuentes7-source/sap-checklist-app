"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getChecklistResults,
  getOrCreateChecklist,
  saveChecklistResult,
  submitChecklists,
  uploadEvidence,
} from "@/lib/checklist";
import type { ChecklistStatus } from "@/lib/types/database";
import { ScreenshotPaste } from "@/components/checklist/ScreenshotPaste";

export interface WizardSystem {
  id: string;
  sid: string | null;
  description: string | null;
  environment: string | null;
}

export interface WizardReviewPoint {
  id: string;
  title: string;
  description: string | null;
  review_instructions: string | null;
  mandatory: boolean;
  evidence_required: boolean;
  severity: string | null;
}

export interface WizardStep {
  system: WizardSystem;
  reviewPoint: WizardReviewPoint;
}

interface Respuesta {
  status: ChecklistStatus | null;
  comments: string;
  evidencePath: string | null;
  previewUrl: string | null;
  uploading: boolean;
}

const ESTADOS: { value: ChecklistStatus; label: string; className: string }[] = [
  {
    value: "OK",
    label: "✅ OK",
    className: "bg-accent-soft text-accent border-accent",
  },
  {
    value: "WARNING",
    label: "⚠️ Warning",
    className: "bg-warn-soft text-warn border-warn",
  },
];

function vacia(): Respuesta {
  return { status: null, comments: "", evidencePath: null, previewUrl: null, uploading: false };
}

export function ChecklistWizard({
  clientId,
  clientName,
  steps,
  onCompleted,
}: {
  clientId: string;
  clientName: string;
  steps: WizardStep[];
  onCompleted?: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, Respuesta>>({});
  const [checklistIds, setChecklistIds] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [inicializando, setInicializando] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, [supabase]);

  const paso = steps[index];
  const stepKey = paso ? `${paso.system.id}-${paso.reviewPoint.id}` : "";
  const respuesta = respuestas[stepKey] ?? vacia();

  // Asegura que exista un checklist en borrador para el sistema del
  // paso actual (uno por sistema, se reutiliza entre pasos).
  useEffect(() => {
    if (!userId || steps.length === 0) return;

    const system = steps[0].system;
    let cancelled = false;

    async function inicializarChecklist() {
      setInicializando(true);
      setError(null);

      try {
        const checklistId = await getOrCreateChecklist(supabase, {
          clientId,
          systemId: system.id,
          userId,
        });

        if (cancelled) return;

        setChecklistIds({
          [system.id]: checklistId,
        });

        const savedResults = await getChecklistResults(
          supabase,
          checklistId
        );

        if (cancelled) return;

        const respuestasGuardadas: Record<string, Respuesta> = {};

        for (const result of savedResults) {
          const key = `${system.id}-${result.reviewPointId}`;

          respuestasGuardadas[key] = {
            status: result.status,
            comments: result.comments ?? "",
            evidencePath: result.evidenceUrl,
            previewUrl: null,
            uploading: false,
          };
        }

        setRespuestas(respuestasGuardadas);

        const completedReviewPointIds = new Set(
          savedResults.map((result) => result.reviewPointId)
        );

        const firstPendingIndex = steps.findIndex(
          (step) => !completedReviewPointIds.has(step.reviewPoint.id)
        );

        setIndex(
          firstPendingIndex >= 0
            ? firstPendingIndex
            : Math.max(steps.length - 1, 0)
        );
      } catch (err: any) {
        console.error("Error inicializando checklist:", {
          message: err?.message,
          code: err?.code,
          details: err?.details,
          hint: err?.hint,
          errorCompleto: err,
        });

        setError(
          err?.message
            ? `No se pudo cargar el checklist: ${err.message}`
            : "No se pudo cargar el checklist para este sistema."
        );
      } finally {
        if (!cancelled) {
          setInicializando(false);
        }
      }
    }

    inicializarChecklist();

    return () => {
      cancelled = true;
    };
  }, [clientId, steps, supabase, userId]);

  if (steps.length === 0) {
    return (
      <p className="p-6 text-sm text-ink-soft">
        Este cliente no tiene sistemas con puntos de revisión configurados
        todavía.
      </p>
    );
  }

  if (inicializando) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-ink-soft">
          Cargando avance del checklist...
        </p>
      </div>
    );
  }

  function actualizar(cambios: Partial<Respuesta>) {
    setRespuestas((prev) => {
      const actual = prev[stepKey] ?? vacia();

      return {
        ...prev,
        [stepKey]: {
          ...actual,
          ...cambios,
        },
      };
    });
  }

  async function subirImagen(file: Blob) {
    const checklistId = checklistIds[paso.system.id];
  
    if (!checklistId || !userId) {
      setError("No se pudo identificar el checklist actual.");
      return;
    }
  
    const currentStepKey =
      `${paso.system.id}-${paso.reviewPoint.id}`;
  
    const previewUrl = URL.createObjectURL(file);
  
    setError(null);
  
    setRespuestas((prev) => {
      const actual = prev[currentStepKey] ?? vacia();
  
      return {
        ...prev,
        [currentStepKey]: {
          ...actual,
          uploading: true,
          previewUrl,
        },
      };
    });
  
    try {
      const evidencePath = await uploadEvidence(supabase, {
        userId,
        checklistId,
        reviewPointId: paso.reviewPoint.id,
        file,
      });
  
      console.log(
        "Evidence path recibido en Wizard:",
        evidencePath
      );
  
      if (!evidencePath) {
        throw new Error(
          "Storage no devolvió la ruta de la evidencia."
        );
      }
  
      setRespuestas((prev) => {
        const actual = prev[currentStepKey] ?? vacia();
  
        const nuevaRespuesta = {
          ...actual,
          evidencePath,
          previewUrl,
          uploading: false,
        };
  
        console.log(
          "Respuesta después de guardar evidencia:",
          nuevaRespuesta
        );
  
        return {
          ...prev,
          [currentStepKey]: nuevaRespuesta,
        };
      });
    } catch (err: any) {
      console.error("Error uploadEvidence:", err);
  
      setError(
        err?.message
          ? `No se pudo subir la evidencia: ${err.message}`
          : "No se pudo subir la evidencia, intenta de nuevo."
      );
  
      setRespuestas((prev) => {
        const actual = prev[currentStepKey] ?? vacia();
  
        return {
          ...prev,
          [currentStepKey]: {
            ...actual,
            uploading: false,
          },
        };
      });
    }
  }


  async function guardarPasoActual(): Promise<boolean> {
  const checklistId = checklistIds[paso.system.id];

  if (!checklistId) {
    setError("No se pudo identificar el checklist actual.");
    return false;
  }

  const currentStepKey = `${paso.system.id}-${paso.reviewPoint.id}`;

  const respuestaActual =
    respuestas[currentStepKey] ?? vacia();

  console.log("Respuesta antes de guardar:", {
    stepKey: currentStepKey,
    status: respuestaActual.status,
    comments: respuestaActual.comments,
    evidencePath: respuestaActual.evidencePath,
    uploading: respuestaActual.uploading,
  });

  if (
    paso.reviewPoint.mandatory &&
    !respuestaActual.status
  ) {
    setError(
      "Este punto es obligatorio: selecciona un estado antes de continuar."
    );
    return false;
  }

  if (respuestaActual.uploading) {
    setError(
      "La evidencia todavía se está subiendo. Espera unos segundos antes de continuar."
    );
    return false;
  }

  if (
    paso.reviewPoint.evidence_required &&
    !respuestaActual.evidencePath
  ) {
    setError(
      "Este punto requiere una evidencia antes de continuar."
    );
    return false;
  }

  if (
    respuestaActual.status === "WARNING" &&
    !respuestaActual.evidencePath
  ) {
    setError(
      "Cuando seleccionas Warning, debes adjuntar una evidencia."
    );
    return false;
  }

  if (
    respuestaActual.status === "WARNING" &&
    !respuestaActual.comments.trim()
  ) {
    setError(
      "Cuando seleccionas Warning, debes indicar el motivo en los comentarios."
    );
    return false;
  }

  setError(null);
  setGuardando(true);

  try {
    await saveChecklistResult(supabase, {
      checklistId,
      reviewPointId: paso.reviewPoint.id,
      status: respuestaActual.status ?? "WARNING",
      comments: respuestaActual.comments || null,
      evidenceUrl: respuestaActual.evidencePath,
    });

    return true;
  } catch (err: any) {
    console.error("Error guardando resultado:", {
      message: err?.message,
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
      errorCompleto: err,
    });

    setError(
      err?.message
        ? `No se pudo guardar este paso: ${err.message}`
        : "No se pudo guardar este paso, intenta de nuevo."
    );

    return false;
  } finally {
    setGuardando(false);
  }
}

async function irSiguiente() {
  const ok = await guardarPasoActual();
  if (!ok) return;

  if (index === steps.length - 1) {
    await finalizar();
    return;
  }
  setIndex((i) => i + 1);
}

async function irAnterior() {
  await guardarPasoActual();
  setIndex((i) => Math.max(0, i - 1));
}

async function finalizar() {
  setGuardando(true);
  setError(null);

  try {
    await submitChecklists(supabase, Object.values(checklistIds));

    if (onCompleted) {
      onCompleted();
      return;
    }

    setFinalizado(true);
  } catch (err) {
    console.error("Error finalizando checklist:", err);
    setError("No se pudo finalizar el checklist, intenta de nuevo.");
  } finally {
    setGuardando(false);
  }
}

if (finalizado) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="rounded-full bg-accent-soft px-3 py-1 font-mono text-xs uppercase tracking-wide text-accent">
        Listo
      </span>

      <h1 className="font-display text-xl font-medium text-ink">
        Checklist completado
      </h1>

      <p className="text-sm text-ink-soft">
        Se guardaron los resultados de {Object.keys(checklistIds).length}{" "}
        sistema(s) de {clientName}.
      </p>

      <button
        type="button"
        onClick={() => window.close()}
        className="mt-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-accent"
      >
        Cerrar ventana
      </button>
    </div>
  );
}

return (
  <div className="flex h-full flex-col">
    {/* Header fijo */}
    <header className="border-b border-line px-4 py-3">
      <p className="font-mono text-[11px] uppercase tracking-widest text-accent">
        {clientName}
      </p>

      <div className="mt-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-medium text-ink">
            {Math.round(((index + 1) / steps.length) * 100)}%
          </span>

          <span className="font-mono text-[11px] text-ink-soft">
            Punto {index + 1} de {steps.length}
          </span>
        </div>

        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{
              width: `${((index + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </header>

    {/* Cuerpo con scroll */}
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="mb-4 rounded-card bg-ink px-3 py-2 text-white">
        <p className="font-mono text-[11px] uppercase tracking-wide text-white/60">
          Sistema
        </p>

        <p className="font-display text-sm font-medium">
          {paso.system.sid ??
            paso.system.description ??
            "Sin SID"}

          {paso.system.environment && (
            <span className="ml-2 font-mono text-xs text-white/70">
              {paso.system.environment}
            </span>
          )}
        </p>

        {paso.system.description && paso.system.sid && (
          <p className="mt-0.5 text-xs text-white/70">
            {paso.system.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {paso.reviewPoint.severity && (
          <span className="rounded-full bg-line/60 px-2 py-0.5 font-mono text-[10px] uppercase text-ink-soft">
            {paso.reviewPoint.severity}
          </span>
        )}

        {paso.reviewPoint.mandatory && (
          <span className="rounded-full bg-warn-soft px-2 py-0.5 font-mono text-[10px] uppercase text-warn">
            Obligatorio
          </span>
        )}
      </div>

      <h2 className="mt-2 font-display text-base font-medium text-ink">
        {paso.reviewPoint.title}
      </h2>

      {paso.reviewPoint.description && (
        <p className="mt-1 text-sm text-ink-soft">
          {paso.reviewPoint.description}
        </p>
      )}

      {paso.reviewPoint.review_instructions && (
        <div className="mt-3 rounded-card border border-line bg-bg p-3">
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">
            Cómo revisarlo en SAP
          </p>

          <p className="mt-1 text-sm text-ink">
            {paso.reviewPoint.review_instructions}
          </p>
        </div>
      )}

      <div className="mt-4">
        <p className="mb-1 text-sm font-medium text-ink-soft">
          Resultado de la revisión
        </p>

        <div className="grid grid-cols-2 gap-2">
          {ESTADOS.map((estado) => (
            <button
              key={estado.value}
              type="button"
              onClick={() => actualizar({ status: estado.value })}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition ${respuesta.status === estado.value
                ? estado.className
                : "border-line bg-surface text-ink-soft hover:border-ink-soft"
                }`}
            >
              {estado.label}
            </button>
          ))}
        </div>
      </div>

      {respuesta.status === "WARNING" && (
        <div className="mt-4 rounded-card border border-warn bg-warn-soft p-3">
          <p className="text-sm font-medium text-warn">
            ⚠️ Warning
          </p>

          <p className="mt-1 text-xs text-warn">
            Para continuar debes adjuntar una evidencia y explicar el motivo
            en los comentarios.
          </p>
        </div>
      )}

      <div className="mt-4">
        <ScreenshotPaste
          previewUrl={respuesta.previewUrl}
          uploading={respuesta.uploading}
          onImage={subirImagen}
          onClear={() =>
            actualizar({
              evidencePath: null,
              previewUrl: null,
            })
          }
        />

        {paso.reviewPoint.evidence_required &&
          !respuesta.evidencePath && (
            <p className="mt-2 text-xs font-medium text-warn">
              ⚠️ Evidencia obligatoria: debes adjuntar una imagen antes de continuar.
            </p>
          )}
      </div>

      <div className="mt-4">
        <p className="mb-1 text-sm font-medium text-ink-soft">
          Comentarios
        </p>

        <textarea
          value={respuesta.comments}
          onChange={(event) =>
            actualizar({ comments: event.target.value })
          }
          rows={3}
          className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          placeholder={
            respuesta.status === "WARNING"
              ? "Describe el motivo del Warning…"
              : "Notas, valores encontrados, observaciones…"
          }
        />
      </div>

      {error && (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>

    {/* Footer fijo */}
    <footer className="flex gap-2 border-t border-line px-4 py-3">
      <button
        type="button"
        onClick={irAnterior}
        disabled={index === 0 || guardando}
        className="flex-1 rounded-md border border-line py-2 text-sm font-medium text-ink-soft transition hover:border-ink-soft disabled:opacity-40"
      >
        Anterior
      </button>

      <button
        type="button"
        onClick={irSiguiente}
        disabled={guardando}
        className="flex-1 rounded-md bg-ink py-2 text-sm font-medium text-white transition hover:bg-accent disabled:opacity-60"
      >
        {guardando
          ? "Guardando…"
          : index === steps.length - 1
            ? "Finalizar checklist"
            : "Guardar y siguiente →"}
      </button>
    </footer>
  </div>
);
}