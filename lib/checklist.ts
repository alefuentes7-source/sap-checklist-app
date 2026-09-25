import type { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database";
import { getChecklistDate } from "@/lib/date";

type ChecklistStatus =
  Database["public"]["Enums"]["checklist_status_enum"];

type Client = ReturnType<typeof createClient>;

export interface ChecklistEvidence {
  id: string;
  storagePath: string;
  displayOrder: number;
}

export interface SavedChecklistResult {
  reviewPointId: string;
  status: ChecklistStatus;
  comments: string | null;

  /*
   * Campo antiguo.
   * Lo mantenemos temporalmente para compatibilidad.
   */
  evidenceUrl: string | null;

  /*
   * Nuevo modelo de múltiples evidencias.
   */
  evidences: ChecklistEvidence[];
}

/**
 * Busca el checklist del día para cliente + sistema + operador.
 * Si no existe, lo crea.
 */
export async function getOrCreateChecklist(
  supabase: Client,
  params: {
    clientId: string;
    systemId: string;
    userId: string;
  }
): Promise<string> {
  const {
    clientId,
    systemId,
    userId,
  } = params;

  const executionDate =
    getChecklistDate();

  const {
    data: existenteData,
    error: errBusqueda,
  } = await supabase
    .from("checklists")
    .select("id")
    .eq("client_id", clientId)
    .eq("system_id", systemId)
    .eq("created_by", userId)
    .eq(
      "execution_date",
      executionDate
    )
    .maybeSingle();

  const existente =
    existenteData as {
      id: string;
    } | null;

  if (errBusqueda) {
    throw errBusqueda;
  }

  if (existente) {
    return existente.id;
  }

  const {
    data: nuevoData,
    error: errInsert,
  } = await supabase
    .from("checklists")
    .insert({
      client_id: clientId,
      system_id: systemId,
      created_by: userId,
      execution_date: executionDate,
      overall_status: "OK",
      submitted: false,
    })
    .select("id")
    .single();

  const nuevo =
    nuevoData as {
      id: string;
    } | null;

  if (errInsert) {
    throw errInsert;
  }

  if (!nuevo) {
    throw new Error(
      "No se pudo crear el checklist."
    );
  }

  return nuevo.id;
}

/**
 * Obtiene los resultados guardados de un checklist
 * junto con todas sus evidencias.
 */
export async function getChecklistResults(
  supabase: Client,
  checklistId: string
): Promise<SavedChecklistResult[]> {
  const {
    data: resultsData,
    error: resultsError,
  } = await supabase
    .from("checklist_results")
    .select(
      `
        id,
        review_point_id,
        status,
        comments,
        evidence_url
      `
    )
    .eq(
      "checklist_id",
      checklistId
    );

  if (resultsError) {
    throw resultsError;
  }

  const results =
    (resultsData ?? []) as {
      id: string;
      review_point_id: string;
      status: ChecklistStatus;
      comments: string | null;
      evidence_url: string | null;
    }[];

  if (results.length === 0) {
    return [];
  }

  /*
   * Buscamos todas las evidencias nuevas
   * asociadas a estos resultados.
   */
  const resultIds =
    results.map(
      (result) => result.id
    );

  const {
    data: evidencesData,
    error: evidencesError,
  } = await supabase
    .from(
      "checklist_result_evidences"
    )
    .select(
      `
        id,
        checklist_result_id,
        storage_path,
        display_order
      `
    )
    .in(
      "checklist_result_id",
      resultIds
    )
    .order(
      "display_order",
      {
        ascending: true,
      }
    );

  if (evidencesError) {
    throw evidencesError;
  }

  const evidences =
    (evidencesData ?? []) as {
      id: string;
      checklist_result_id: string;
      storage_path: string;
      display_order: number;
    }[];

  return results.map(
    (result) => {
      const resultEvidences =
        evidences
          .filter(
            (evidence) =>
              evidence.checklist_result_id ===
              result.id
          )
          .map(
            (evidence) => ({
              id: evidence.id,
              storagePath:
                evidence.storage_path,
              displayOrder:
                evidence.display_order,
            })
          );

      /*
       * Compatibilidad con evidencias antiguas.
       *
       * Si todavía no existen registros en
       * checklist_result_evidences pero existe
       * evidence_url, la exponemos también dentro
       * de evidences[].
       */
      if (
        resultEvidences.length === 0 &&
        result.evidence_url
      ) {
        resultEvidences.push({
          id: `legacy-${result.id}`,
          storagePath:
            result.evidence_url,
          displayOrder: 1,
        });
      }

      return {
        reviewPointId:
          result.review_point_id,

        status:
          result.status,

        comments:
          result.comments,

        evidenceUrl:
          result.evidence_url,

        evidences:
          resultEvidences,
      };
    }
  );
}

/**
 * Busca el checklist_result correspondiente a
 * checklist + punto de revisión.
 */
async function getChecklistResultId(
  supabase: Client,
  checklistId: string,
  reviewPointId: string
): Promise<string | null> {
  const {
    data,
    error,
  } = await supabase
    .from("checklist_results")
    .select("id")
    .eq(
      "checklist_id",
      checklistId
    )
    .eq(
      "review_point_id",
      reviewPointId
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  const result =
    data as {
      id: string;
    } | null;

  return result?.id ?? null;
}

/**
 * Guarda o actualiza el resultado de un punto.
 *
 * evidenceUrl se mantiene temporalmente para
 * compatibilidad con el modelo anterior.
 *
 * Devuelve el id de checklist_results para poder
 * asociar evidencias posteriormente.
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
): Promise<string> {
  const {
    checklistId,
    reviewPointId,
    status,
    comments,
    evidenceUrl,
  } = params;

  const {
    data,
    error,
  } = await supabase
    .from("checklist_results")
    .upsert(
      {
        checklist_id: checklistId,
        review_point_id: reviewPointId,
        status,
        comments,
        evidence_url: evidenceUrl,
      },
      {
        onConflict:
          "checklist_id,review_point_id",
      }
    )
    .select("id")
    .single();

  if (error) {
    console.error(
      "Error guardando checklist_result:",
      error
    );

    throw error;
  }

  const result =
    data as {
      id: string;
    } | null;

  if (!result) {
    throw new Error(
      "No se pudo guardar el resultado del checklist."
    );
  }

  return result.id;
}
/**
 * Sube una nueva evidencia.
 *
 * A diferencia de la versión anterior:
 *
 * 1. No reemplaza la evidencia existente.
 * 2. Inserta un registro en
 *    checklist_result_evidences.
 * 3. Devuelve el objeto completo de evidencia.
 */
export async function uploadEvidence(
  supabase: Client,
  params: {
    userId: string;
    checklistId: string;
    reviewPointId: string;
    file: File | Blob;
  }
): Promise<ChecklistEvidence> {
  const {
    userId,
    checklistId,
    reviewPointId,
    file,
  } = params;

  /*
   * El resultado debe existir antes de asociar
   * una evidencia.
   */
  const checklistResultId =
    await getChecklistResultId(
      supabase,
      checklistId,
      reviewPointId
    );

  if (!checklistResultId) {
    throw new Error(
      "No se pudo identificar el resultado del punto de revisión. Guarda el punto antes de adjuntar evidencia."
    );
  }

  const extension =
    file instanceof File &&
      file.name.includes(".")
      ? file.name
        .split(".")
        .pop()
      : "png";

  /*
   * UUID evita colisiones si se pegan varias
   * capturas rápidamente.
   */
  const fileId =
    crypto.randomUUID();

  const path =
    `${userId}/${checklistId}/${reviewPointId}/${fileId}.${extension}`;

  const {
    data: uploadData,
    error: uploadError,
  } = await supabase.storage
    .from("evidence")
    .upload(
      path,
      file,
      {
        contentType:
          file instanceof File &&
            file.type
            ? file.type
            : "image/png",

        upsert: false,
      }
    );

  if (uploadError) {
    console.error(
      "Error subiendo evidencia a Supabase Storage:",
      {
        message:
          uploadError.message,

        name:
          uploadError.name,

        statusCode:
          (uploadError as any)
            .statusCode,

        bucket:
          "evidence",

        path,
      }
    );

    throw uploadError;
  }

  /*
   * Calculamos el siguiente orden.
   */
  const {
    data: existingEvidenceData,
    error: existingEvidenceError,
  } = await supabase
    .from(
      "checklist_result_evidences"
    )
    .select("display_order")
    .eq(
      "checklist_result_id",
      checklistResultId
    )
    .order(
      "display_order",
      {
        ascending: false,
      }
    )
    .limit(1);

  if (existingEvidenceError) {
    /*
     * El archivo ya fue subido.
     * Intentamos limpiarlo para no dejar basura.
     */
    await supabase.storage
      .from("evidence")
      .remove([
        uploadData.path,
      ]);

    throw existingEvidenceError;
  }

  const currentMaxOrder =
    existingEvidenceData &&
      existingEvidenceData.length > 0
      ? existingEvidenceData[0]
        .display_order
      : 0;

  const displayOrder =
    currentMaxOrder + 1;

  /*
   * Registramos la evidencia en la nueva tabla.
   */
  const {
    data: evidenceData,
    error: evidenceInsertError,
  } = await supabase
    .from(
      "checklist_result_evidences"
    )
    .insert({
      checklist_result_id:
        checklistResultId,

      storage_path:
        uploadData.path,

      display_order:
        displayOrder,
    })
    .select(
      `
        id,
        storage_path,
        display_order
      `
    )
    .single();

  if (evidenceInsertError) {
    /*
     * Si falla la BD eliminamos el archivo que
     * acabamos de subir.
     */
    await supabase.storage
      .from("evidence")
      .remove([
        uploadData.path,
      ]);

    throw evidenceInsertError;
  }

  const evidence =
    evidenceData as {
      id: string;
      storage_path: string;
      display_order: number;
    } | null;

  if (!evidence) {
    throw new Error(
      "No se pudo registrar la evidencia."
    );
  }

  console.log(
    "Evidencia registrada:",
    evidence
  );

  return {
    id:
      evidence.id,

    storagePath:
      evidence.storage_path,

    displayOrder:
      evidence.display_order,
  };
}

/**
 * Elimina una evidencia nueva tanto de Storage
 * como de checklist_result_evidences.
 */
export async function deleteEvidence(
  supabase: Client,
  evidence: ChecklistEvidence
): Promise<void> {
  /*
   * Las evidencias legacy todavía no tienen fila
   * en checklist_result_evidences.
   *
   * No las eliminamos aquí para evitar borrar
   * accidentalmente datos antiguos.
   */
  if (
    evidence.id.startsWith(
      "legacy-"
    )
  ) {
    throw new Error(
      "Esta evidencia pertenece al modelo anterior y todavía no puede eliminarse desde esta función."
    );
  }

  const {
    error: storageError,
  } = await supabase.storage
    .from("evidence")
    .remove([
      evidence.storagePath,
    ]);

  if (storageError) {
    throw storageError;
  }

  const {
    error: deleteError,
  } = await supabase
    .from(
      "checklist_result_evidences"
    )
    .delete()
    .eq(
      "id",
      evidence.id
    );

  if (deleteError) {
    throw deleteError;
  }
}

/**
 * Marca los checklists indicados como enviados.
 */
export async function submitChecklists(
  supabase: Client,
  checklistIds: string[]
) {
  for (
    const checklistId
    of checklistIds
  ) {
    const overallStatus =
      await calculateOverallStatus(
        supabase,
        checklistId
      );

    const { error } =
      await supabase
        .from("checklists")
        .update({
          overall_status:
            overallStatus,

          submitted: true,

          submitted_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          checklistId
        );

    if (error) {
      throw error;
    }
  }
}

export async function calculateOverallStatus(
  supabase: Client,
  checklistId: string
): Promise<ChecklistStatus> {
  const {
    data,
    error,
  } = await supabase
    .from("checklist_results")
    .select("status")
    .eq(
      "checklist_id",
      checklistId
    );

  if (error) {
    throw error;
  }

  const hasWarning =
    (data ?? []).some(
      (result) =>
        result.status ===
        "WARNING"
    );

  return hasWarning
    ? "WARNING"
    : "OK";
}