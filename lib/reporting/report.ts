import type { createClient } from "@/lib/supabase/server";
import type { DailyClientReport } from "./types";

type Client = ReturnType<typeof createClient>;

export async function getDailyClientReport(
  supabase: Client,
  clientId: string,
  executionDate: string
): Promise<DailyClientReport> {
  void supabase;
  void clientId;
  void executionDate;

  throw new Error("Pendiente implementación");
}