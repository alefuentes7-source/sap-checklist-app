// Tipos generados a mano para el subset de tablas usado por el scaffold.
// Cuando el proyecto esté conectado, reemplazar por:
//   npx supabase gen types typescript --project-id <id> > lib/types/database.ts

export type ProviderType = "hosted" | "on_premise" | "cloud";
export type ChecklistStatus = "OK" | "WARNING";

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          country: string | null;
          logo_url: string | null;
          provider_type: ProviderType | null;
          provider_name: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      user_clients: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          assigned_at: string;
        };
      };
      systems: {
        Row: {
          id: string;
          client_id: string;
          description: string | null;
          active: boolean;
          sid: string | null;
          environment: string | null;
          system_type_id: string | null;
          display_order: number | null;
        };
      };
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: "operator" | "admin";
          active: boolean;
        };
      };
      review_points: {
        Row: {
          id: string;
          system_type_id: string;
          title: string;
          description: string | null;
          review_instructions: string | null;
          mandatory: boolean;
          evidence_required: boolean;
          severity: string | null;
          display_order: number | null;
        };
      };
      checklists: {
        Row: {
          id: string;
          client_id: string;
          system_id: string;
          created_by: string;
          execution_date: string;
          overall_status: ChecklistStatus | null;
          submitted: boolean;
          submitted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          system_id: string;
          created_by: string;
          execution_date: string;
          overall_status?: ChecklistStatus | null;
          submitted?: boolean;
        };
        Update: {
          overall_status?: ChecklistStatus | null;
          submitted?: boolean;
          submitted_at?: string | null;
        };
      };
      checklist_results: {
        Row: {
          id: string;
          checklist_id: string;
          review_point_id: string;
          status: ChecklistStatus;
          evidence_url: string | null;
          comments: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          checklist_id: string;
          review_point_id: string;
          status: ChecklistStatus;
          evidence_url?: string | null;
          comments?: string | null;
        };
        Update: {
          status?: ChecklistStatus;
          evidence_url?: string | null;
          comments?: string | null;
        };
      };
    };
  };
}
