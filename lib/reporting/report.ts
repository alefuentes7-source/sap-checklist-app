import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/types/database";
import { DailyClientReport } from "./types";

type Client = SupabaseClient<Database>;

export async function getDailyClientReport(
  supabase: Client,
  clientId: string,
  executionDate: string
): Promise<DailyClientReport> {

  throw new Error("Pendiente implementación");

}