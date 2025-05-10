export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      auth_error_logs: {
        Row: {
          attempt_time: string | null
          attempt_type: string
          error_code: string | null
          error_details: string | null
          error_message: string
          id: string
          ip_address: string | null
          location: string | null
          password_hash: string | null
          phone_number: string
          user_agent: string | null
        }
        Insert: {
          attempt_time?: string | null
          attempt_type: string
          error_code?: string | null
          error_details?: string | null
          error_message: string
          id?: string
          ip_address?: string | null
          location?: string | null
          password_hash?: string | null
          phone_number: string
          user_agent?: string | null
        }
        Update: {
          attempt_time?: string | null
          attempt_type?: string
          error_code?: string | null
          error_details?: string | null
          error_message?: string
          id?: string
          ip_address?: string | null
          location?: string | null
          password_hash?: string | null
          phone_number?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      call_details: {
        Row: {
          call_attempted: boolean | null
          call_duration: number | null
          call_log_id: string | null
          call_recording: string | null
          call_status: string | null
          call_time: string | null
          created_at: string
          credits_consumed: number | null
          developer: string
          feedback: string | null
          id: string
          number: string
          project: string
          summary: string | null
          transcript: string | null
          user_id: string
        }
        Insert: {
          call_attempted?: boolean | null
          call_duration?: number | null
          call_log_id?: string | null
          call_recording?: string | null
          call_status?: string | null
          call_time?: string | null
          created_at?: string
          credits_consumed?: number | null
          developer: string
          feedback?: string | null
          id?: string
          number: string
          project: string
          summary?: string | null
          transcript?: string | null
          user_id: string
        }
        Update: {
          call_attempted?: boolean | null
          call_duration?: number | null
          call_log_id?: string | null
          call_recording?: string | null
          call_status?: string | null
          call_time?: string | null
          created_at?: string
          credits_consumed?: number | null
          developer?: string
          feedback?: string | null
          id?: string
          number?: string
          project?: string
          summary?: string | null
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_details"
            referencedColumns: ["id"]
          },
        ]
      }
      call_log: {
        Row: {
          call_attempted: boolean | null
          call_detail_id: string
          call_duration: number | null
          call_log: string | null
          call_recording: string | null
          call_status: string | null
          call_time: string | null
          created_at: string
          credits_consumed: number | null
          developer: string
          feedback: string | null
          id: string
          number: string
          project: string
          summary: string | null
          transcript: string | null
          user_id: string
        }
        Insert: {
          call_attempted?: boolean | null
          call_detail_id: string
          call_duration?: number | null
          call_log?: string | null
          call_recording?: string | null
          call_status?: string | null
          call_time?: string | null
          created_at?: string
          credits_consumed?: number | null
          developer: string
          feedback?: string | null
          id?: string
          number: string
          project: string
          summary?: string | null
          transcript?: string | null
          user_id: string
        }
        Update: {
          call_attempted?: boolean | null
          call_detail_id?: string
          call_duration?: number | null
          call_log?: string | null
          call_recording?: string | null
          call_status?: string | null
          call_time?: string | null
          created_at?: string
          credits_consumed?: number | null
          developer?: string
          feedback?: string | null
          id?: string
          number?: string
          project?: string
          summary?: string | null
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_log_call_detail_id_fkey"
            columns: ["call_detail_id"]
            isOneToOne: false
            referencedRelation: "call_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_details"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          action_type: string
          created_at: string
          id: string
          message: string
          response: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          message: string
          response?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          message?: string
          response?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_details"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          activity_type: string
          call_detail_id: string | null
          id: string
          timestamp: string
          user_id: string
        }
        Insert: {
          activity_type: string
          call_detail_id?: string | null
          id?: string
          timestamp?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          call_detail_id?: string | null
          id?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_call_detail_id_fkey"
            columns: ["call_detail_id"]
            isOneToOne: false
            referencedRelation: "call_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_details"
            referencedColumns: ["id"]
          },
        ]
      }
      user_details: {
        Row: {
          credit: number
          id: string
          last_login: string | null
          name: string
          password: string
          phone_number: string
          signup_time: string
        }
        Insert: {
          credit?: number
          id?: string
          last_login?: string | null
          name: string
          password: string
          phone_number: string
          signup_time?: string
        }
        Update: {
          credit?: number
          id?: string
          last_login?: string | null
          name?: string
          password?: string
          phone_number?: string
          signup_time?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      execute_sql: {
        Args: { query_text: string }
        Returns: Json
      }
      hash_password: {
        Args: { plain_password: string }
        Returns: string
      }
      update_user_credits: {
        Args: { user_id_param: string; credits_to_deduct: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
