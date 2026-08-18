import type { createClient } from "@/lib/supabase/server";

type Client = ReturnType<typeof createClient>;
import type { DailyClientReport } from "@/lib/reporting/types";


export async function hydrateReportAssets(
  supabase: Client,
  report: DailyClientReport
): Promise<DailyClientReport> {
  const systems = await Promise.all(
    report.systems.map(async (system) => {
      const reviewPoints = await Promise.all(
        system.reviewPoints.map(async (point) => {
          if (!point.evidenceUrl) {
            return point;
          }

          const { data, error } = await supabase.storage
            .from("evidence")
            .createSignedUrl(
              point.evidenceUrl,
              60 * 10
            );

          if (error) {
            console.error(
              "No se pudo generar signed URL para evidencia:",
              {
                path: point.evidenceUrl,
                message: error.message,
              }
            );

            return {
              ...point,
              evidenceUrl: null,
            };
          }

          return {
            ...point,
            evidenceUrl: data.signedUrl,
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