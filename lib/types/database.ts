export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          changed_by_email: string | null
          client_id: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          system_id: string | null
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          changed_by_email?: string | null
          client_id?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          system_id?: string | null
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          changed_by_email?: string | null
          client_id?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          system_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_audit_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audit_system"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_results: {
        Row: {
          checklist_id: string
          comments: string | null
          created_at: string
          evidence_url: string | null
          id: string
          review_point_id: string
          status: Database["public"]["Enums"]["checklist_status_enum"]
        }
        Insert: {
          checklist_id: string
          comments?: string | null
          created_at?: string
          evidence_url?: string | null
          id?: string
          review_point_id: string
          status: Database["public"]["Enums"]["checklist_status_enum"]
        }
        Update: {
          checklist_id?: string
          comments?: string | null
          created_at?: string
          evidence_url?: string | null
          id?: string
          review_point_id?: string
          status?: Database["public"]["Enums"]["checklist_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "checklist_results_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          execution_date: string
          id: string
          overall_status: Database["public"]["Enums"]["checklist_status_enum"]
          submitted: boolean
          submitted_at: string | null
          system_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          execution_date: string
          id?: string
          overall_status: Database["public"]["Enums"]["checklist_status_enum"]
          submitted?: boolean
          submitted_at?: string | null
          system_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          execution_date?: string
          id?: string
          overall_status?: Database["public"]["Enums"]["checklist_status_enum"]
          submitted?: boolean
          submitted_at?: string | null
          system_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklists_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          active: boolean
          client_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          role_description: string | null
        }
        Insert: {
          active?: boolean
          client_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          role_description?: string | null
        }
        Update: {
          active?: boolean
          client_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          role_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          active: boolean
          country: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          provider_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          country?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          provider_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          country?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          provider_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          client_id: string
          created_at: string
          delivery_status: string
          execution_date: string
          generated_at: string | null
          generated_by: string | null
          id: string
          mail_error: string | null
          mail_recipients: string[] | null
          mail_sent_at: string | null
          pdf_path: string | null
          report_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          delivery_status?: string
          execution_date: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          mail_error?: string | null
          mail_recipients?: string[] | null
          mail_sent_at?: string | null
          pdf_path?: string | null
          report_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          delivery_status?: string
          execution_date?: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          mail_error?: string | null
          mail_recipients?: string[] | null
          mail_sent_at?: string | null
          pdf_path?: string | null
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_history: {
        Row: {
          checklist_id: string
          client_id: string
          delivery_status: string | null
          id: string
          recipients: string[]
          sent_at: string
          sent_by: string
        }
        Insert: {
          checklist_id: string
          client_id: string
          delivery_status?: string | null
          id?: string
          recipients: string[]
          sent_at?: string
          sent_by: string
        }
        Update: {
          checklist_id?: string
          client_id?: string
          delivery_status?: string | null
          id?: string
          recipients?: string[]
          sent_at?: string
          sent_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_history_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_history_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          active: boolean
          created_at: string
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      review_points: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          display_order: number
          evidence_required: boolean
          id: string
          mandatory: boolean
          review_instructions: string | null
          severity: string
          system_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          evidence_required?: boolean
          id?: string
          mandatory?: boolean
          review_instructions?: string | null
          severity?: string
          system_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          evidence_required?: boolean
          id?: string
          mandatory?: boolean
          review_instructions?: string | null
          severity?: string
          system_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_points_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      system_types: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      systems: {
        Row: {
          active: boolean
          client_id: string
          created_at: string
          description: string | null
          display_order: number
          environment: string | null
          id: string
          sid: string | null
          system_type_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          client_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          environment?: string | null
          id?: string
          sid?: string | null
          system_type_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          client_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          environment?: string | null
          id?: string
          sid?: string | null
          system_type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_system_type"
            columns: ["system_type_id"]
            isOneToOne: false
            referencedRelation: "system_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "systems_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_clients: {
        Row: {
          assigned_at: string
          client_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          client_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          client_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          name: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id?: string
          name: string
          role: string
          status?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      checklist_status_enum: "OK" | "WARNING"
      provider_type_enum: "Direct" | "ThirdParty"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      checklist_status_enum: ["OK", "WARNING"],
      provider_type_enum: ["Direct", "ThirdParty"],
    },
  },
} as const
