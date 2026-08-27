import type { createClient } from "@/lib/supabase/server";
import type { DailyClientReport } from "@/lib/reporting/types";

type Client = ReturnType<typeof createClient>;

export async function hydrateReportAssets(
  supabase: Client,
  report: DailyClientReport
): Promise<DailyClientReport> {
  const systems = await Promise.all(
    report.systems.map(async (system) => {
      const reviewPoints = await Promise.all(
        system.reviewPoints.map(async (point) => {
          /*
           * Nuevo modelo multi-evidencia.
           */
          const evidences = await Promise.all(
            point.evidences.map(async (evidence) => {
              const { data, error } = await supabase.storage
                .from("evidence")
                .createSignedUrl(
                  evidence.storagePath,
                  60 * 10
                );

              if (error) {
                console.error(
                  "No se pudo generar signed URL para evidencia:",
                  {
                    evidenceId: evidence.id,
                    path: evidence.storagePath,
                    message: error.message,
                  }
                );

                return {
                  ...evidence,
                  imageUrl: null,
                };
              }

              return {
                ...evidence,
                imageUrl: data.signedUrl,
              };
            })
          );

          /*
           * Compatibilidad temporal con evidenceUrl.
           *
           * Si existe al menos una evidencia hidratada,
           * dejamos evidenceUrl apuntando a la primera.
           */
          const firstEvidenceUrl =
            evidences.find(
              (evidence) => Boolean(evidence.imageUrl)
            )?.imageUrl ?? null;

          return {
            ...point,
            evidences,
            evidenceUrl: firstEvidenceUrl,
          };
        })
      );

      return {
        ...system,
        reviewPoints,
      };
    })
  );

  return {
    ...report,
    systems,
  };
}