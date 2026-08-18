import type { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database";

type ChecklistStatus =
  Database["public"]["Enums"]["checklist_status_enum"];

type Client = ReturnType<typeof createClient>;

import { getChecklistDate } from "@/lib/date";



/**
 * Busca un checklist en borrador (submitted = false) para este
 * cliente + sistema + operador. Si no existe, lo crea. Así, si el
 * operador cierra la ventana a mitad de camino, al volver retoma el
 * mismo checklist en vez de duplicarlo.
 */
export async function getOrCreateChecklist(
  supabase: Client,
  params: {
    clientId: string;
    systemId: string;
    userId: string;
  }
): Promise<string> {
  const { clientId, systemId, userId } = params;

  const executionDate = getChecklistDate();

  const { data: existenteData, error: errBusqueda } = await supabase
    .from("checklists")
    .select("id")
    .eq("client_id", clientId)
    .eq("system_id", systemId)
    .eq("created_by", userId)
    .eq("submitted", false)
    .maybeSingle();

  const existente =
    existenteData as { id: string } | null;

  if (errBusqueda) throw errBusqueda;
  if (existente) return existente.id;

  const { data: nuevoData, error: errInsert } = await supabase
    .from("checklists")
    .insert({
      client_id: clientId,
      system_id: systemId,
      created_by: userId,
      execution_date: new Date().toISOString().slice(0, 10),
      overall_status: "OK",
      submitted: false,
    })
    .select("id")
    .single();

  const nuevo =
    nuevoData as { id: string } | null;

  if (errInsert) throw errInsert;

  if (!nuevo) {
    throw new Error("No se pudo crear el checklist.");
  }

  return nuevo.id;
}

export interface SavedChecklistResult {
  reviewPointId: string;
  status: ChecklistStatus;
  comments: string | null;
  evidenceUrl: string | null;
}

export async function getChecklistResults(
  supabase: Client,
  checklistId: string
): Promise<SavedChecklistResult[]> {
  const { data, error } = await supabase
    .from("checklist_results")
    .select("review_point_id, status, comments, evidence_url")
    .eq("checklist_id", checklistId);

  if (error) throw error;

  return (data ?? []).map((result) => ({
    reviewPointId: result.review_point_id,
    status: result.status,
    comments: result.comments,
    evidenceUrl: result.evidence_url,
  }));
}

/**
 * Guarda (crea o actualiza) el resultado de un review_point dentro
 * de un checklist. No hay constraint UNIQUE(checklist_id,
 * review_point_id) asumido en el modelo original, así que se busca
 * primero para no duplicar filas si el operador vuelve a un paso
 * anterior y lo edita.
 */
export async function saveChecklistResult(
  supabase: Client,
  params: {
    checklistId: string;
    reviewPointId: string;
    status: ChecklistStatus;
    comments: string | null;
    evidenceUrl: string | null;
  }
) {
  const { checklistId, reviewPointId, status, comments, evidenceUrl } = params;

  const { data: existente, error: errBusqueda } = await supabase
    .from("checklist_results")
    .select("id")
    .eq("checklist_id", checklistId)
    .eq("review_point_id", reviewPointId)
    .maybeSingle();

  if (errBusqueda) throw errBusqueda;

  if (existente) {
    const { error } = await supabase
      .from("checklist_results")
      .update({ status, comments, evidence_url: evidenceUrl })
      .eq("id", existente.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("checklist_results").insert({
    checklist_id: checklistId,
    review_point_id: reviewPointId,
    status,
    comments,
    evidence_url: evidenceUrl,
  });
  if (error) throw error;
}

/**
 * Marca como enviados (submitted = true) todos los checklists de una
 * lista de ids. Se llama al terminar el wizard, antes de disparar la
 * generación del PDF / envío de correo.
 */
export async function submitChecklists(
  supabase: Client,
  checklistIds: string[]
) {
  for (const checklistId of checklistIds) {
    const overallStatus = await calculateOverallStatus(
      supabase,
      checklistId
    );

    const { error } = await supabase
      .from("checklists")
      .update({
        overall_status: overallStatus,
        submitted: true,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", checklistId);

    if (error) throw error;
  }
}


export async function calculateOverallStatus(
  supabase: Client,
  checklistId: string
): Promise<ChecklistStatus> {
  const { data, error } = await supabase
    .from("checklist_results")
    .select("status")
    .eq("checklist_id", checklistId);

  if (error) throw error;

  const hasWarning = (data ?? []).some(
    (r) => r.status === "WARNING"
  );

  return hasWarning ? "WARNING" : "OK";
}
/**
 * Sube una captura de pantalla (pegada desde el portapapeles) al
 * bucket privado "evidence" y devuelve el path guardado en
 * checklist_results.evidence_url. El path se organiza por usuario
 * para calzar con las políticas de Storage (ver
 * storage_evidence_bucket.sql).
 */
export async function uploadEvidence(
  supabase: Client,
  params: {
    userId: string;
    checklistId: string;
    reviewPointId: string;
    file: File | Blob;
  }
): Promise<string> {
  const {
    userId,
    checklistId,
    reviewPointId,
    file,
  } = params;

  const extension =
    file instanceof File && file.name.includes(".")
      ? file.name.split(".").pop()
      : "png";

  const path =
    `${userId}/${checklistId}/${reviewPointId}-${Date.now()}.${extension}`;

  const { data, error } = await supabase.storage
    .from("evidence")
    .upload(path, file, {
      contentType:
        file instanceof File && file.type
          ? file.type
          : "image/png",
      upsert: false,
    });

  if (error) {
    console.error(
      "Error subiendo evidencia a Supabase Storage:",
      {
        message: error.message,
        name: error.name,
        statusCode: (error as any).statusCode,
        bucket: "evidence",
        path,
      }
    );

    throw error;
  }

  console.log("Evidencia subida:", data);
  console.log("Path que devuelve uploadEvidence:", data.path);

  // IMPORTANTE:
  // devolver explícitamente un string
  return data.path;


}
