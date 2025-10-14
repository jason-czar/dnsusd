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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alias_history: {
        Row: {
          address: string
          alias_id: string
          confidence: number | null
          currency: string
          id: string
          raw_data: Json | null
          resolved_at: string
          source_type: string
        }
        Insert: {
          address: string
          alias_id: string
          confidence?: number | null
          currency: string
          id?: string
          raw_data?: Json | null
          resolved_at?: string
          source_type: string
        }
        Update: {
          address?: string
          alias_id?: string
          confidence?: number | null
          currency?: string
          id?: string
          raw_data?: Json | null
          resolved_at?: string
          source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "alias_history_alias_id_fkey"
            columns: ["alias_id"]
            isOneToOne: false
            referencedRelation: "aliases"
            referencedColumns: ["id"]
          },
        ]
      }
      aliases: {
        Row: {
          alias_string: string
          created_at: string
          current_address: string | null
          current_currency: string | null
          current_source: string | null
          dns_verified: boolean | null
          dnssec_enabled: boolean | null
          https_verified: boolean | null
          id: string
          last_resolved_at: string | null
          last_verification_at: string | null
          trust_score: number | null
          updated_at: string
          user_id: string | null
          verification_method: string | null
        }
        Insert: {
          alias_string: string
          created_at?: string
          current_address?: string | null
          current_currency?: string | null
          current_source?: string | null
          dns_verified?: boolean | null
          dnssec_enabled?: boolean | null
          https_verified?: boolean | null
          id?: string
          last_resolved_at?: string | null
          last_verification_at?: string | null
          trust_score?: number | null
          updated_at?: string
          user_id?: string | null
          verification_method?: string | null
        }
        Update: {
          alias_string?: string
          created_at?: string
          current_address?: string | null
          current_currency?: string | null
          current_source?: string | null
          dns_verified?: boolean | null
          dnssec_enabled?: boolean | null
          https_verified?: boolean | null
          id?: string
          last_resolved_at?: string | null
          last_verification_at?: string | null
          trust_score?: number | null
          updated_at?: string
          user_id?: string | null
          verification_method?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key_hash: string
          key_name: string
          key_prefix: string
          last_used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash: string
          key_name: string
          key_prefix: string
          last_used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          key_name?: string
          key_prefix?: string
          last_used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_usage: {
        Row: {
          created_at: string
          endpoint: string
          error_message: string | null
          id: string
          ip_address: string | null
          method: string
          response_time_ms: number
          status_code: number
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method: string
          response_time_ms: number
          status_code: number
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method?: string
          response_time_ms?: number
          status_code?: number
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      lookups: {
        Row: {
          alias: string
          alias_type: string | null
          chain: string
          confidence: string | null
          created_at: string
          error_message: string | null
          id: string
          proof_metadata: Json | null
          resolved_address: string | null
        }
        Insert: {
          alias: string
          alias_type?: string | null
          chain: string
          confidence?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          proof_metadata?: Json | null
          resolved_address?: string | null
        }
        Update: {
          alias?: string
          alias_type?: string | null
          chain?: string
          confidence?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          proof_metadata?: Json | null
          resolved_address?: string | null
        }
        Relationships: []
      }
      monitoring_rules: {
        Row: {
          alert_email: boolean | null
          alert_webhook_url: string | null
          alias_id: string
          created_at: string | null
          enabled: boolean | null
          id: string
          trust_threshold: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_email?: boolean | null
          alert_webhook_url?: string | null
          alias_id: string
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          trust_threshold?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_email?: boolean | null
          alert_webhook_url?: string | null
          alias_id?: string
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          trust_threshold?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_rules_alias_id_fkey"
            columns: ["alias_id"]
            isOneToOne: true
            referencedRelation: "aliases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitoring_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          api_preferences: Json | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          notification_preferences: Json | null
          updated_at: string
        }
        Insert: {
          api_preferences?: Json | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          notification_preferences?: Json | null
          updated_at?: string
        }
        Update: {
          api_preferences?: Json | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          notification_preferences?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhooks: {
        Row: {
          alias_id: string
          callback_url: string
          created_at: string
          id: string
          is_active: boolean
          last_triggered_at: string | null
          secret_token: string
        }
        Insert: {
          alias_id: string
          callback_url: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          secret_token: string
        }
        Update: {
          alias_id?: string
          callback_url?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          secret_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_alias_id_fkey"
            columns: ["alias_id"]
            isOneToOne: false
            referencedRelation: "aliases"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
