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
      email_queue: {
        Row: {
          created_at: string
          error_code: string | null
          error_message: string | null
          error_reason: string | null
          event_id: string
          id: string
          idempotency_key: string | null
          last_error: string | null
          next_attempt_at: string | null
          provider_message_id: string | null
          registration_id: string
          retry_count: number
          sent_at: string | null
          status: Database["public"]["Enums"]["message_status_type"]
          template_key: Database["public"]["Enums"]["template_key_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          error_reason?: string | null
          event_id: string
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          next_attempt_at?: string | null
          provider_message_id?: string | null
          registration_id: string
          retry_count?: number
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status_type"]
          template_key: Database["public"]["Enums"]["template_key_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          error_reason?: string | null
          event_id?: string
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          next_attempt_at?: string | null
          provider_message_id?: string | null
          registration_id?: string
          retry_count?: number
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status_type"]
          template_key?: Database["public"]["Enums"]["template_key_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_queue_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          html_body: string
          key: Database["public"]["Enums"]["template_key_type"]
          subject: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          html_body: string
          key: Database["public"]["Enums"]["template_key_type"]
          subject: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          html_body?: string
          key?: Database["public"]["Enums"]["template_key_type"]
          subject?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          application_answers: Json | null
          created_at: string
          event_id: string
          expires_at: string | null
          id: string
          msg_approved_sent_at: string | null
          msg_location_sent_at: string | null
          msg_registration_received_sent_at: string | null
          msg_rejected_sent_at: string | null
          msg_reminder_sent_at: string | null
          msg_temporary_offer_claiming_at: string | null
          msg_temporary_offer_sent_at: string | null
          offered_at: string | null
          questionnaire_completed: boolean
          selection_batch_id: string | null
          selection_outcome:
            | Database["public"]["Enums"]["selection_outcome_type"]
            | null
          selection_rank: number | null
          status: Database["public"]["Enums"]["registration_status"]
          user_id: string
        }
        Insert: {
          application_answers?: Json | null
          created_at?: string
          event_id: string
          expires_at?: string | null
          id?: string
          msg_approved_sent_at?: string | null
          msg_location_sent_at?: string | null
          msg_registration_received_sent_at?: string | null
          msg_rejected_sent_at?: string | null
          msg_reminder_sent_at?: string | null
          msg_temporary_offer_claiming_at?: string | null
          msg_temporary_offer_sent_at?: string | null
          offered_at?: string | null
          questionnaire_completed?: boolean
          selection_batch_id?: string | null
          selection_outcome?:
            | Database["public"]["Enums"]["selection_outcome_type"]
            | null
          selection_rank?: number | null
          status?: Database["public"]["Enums"]["registration_status"]
          user_id: string
        }
        Update: {
          application_answers?: Json | null
          created_at?: string
          event_id?: string
          expires_at?: string | null
          id?: string
          msg_approved_sent_at?: string | null
          msg_location_sent_at?: string | null
          msg_registration_received_sent_at?: string | null
          msg_rejected_sent_at?: string | null
          msg_reminder_sent_at?: string | null
          msg_temporary_offer_claiming_at?: string | null
          msg_temporary_offer_sent_at?: string | null
          offered_at?: string | null
          questionnaire_completed?: boolean
          selection_batch_id?: string | null
          selection_outcome?:
            | Database["public"]["Enums"]["selection_outcome_type"]
            | null
          selection_rank?: number | null
          status?: Database["public"]["Enums"]["registration_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          city: string
          created_at: string
          created_by_user_id: string | null
          currency: string
          description: string | null
          host_user_id: string | null
          id: string
          is_published: boolean
          max_capacity: number | null
          payment_required: boolean
          presentation_key: string | null
          price_cents: number
          registration_deadline: string | null
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
          venue_hint: string | null
        }
        Insert: {
          city: string
          created_at?: string
          created_by_user_id?: string | null
          currency?: string
          description?: string | null
          host_user_id?: string | null
          id?: string
          is_published?: boolean
          max_capacity?: number | null
          payment_required?: boolean
          presentation_key?: string | null
          price_cents?: number
          registration_deadline?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
          venue_hint?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          created_by_user_id?: string | null
          currency?: string
          description?: string | null
          host_user_id?: string | null
          id?: string
          is_published?: boolean
          max_capacity?: number | null
          payment_required?: boolean
          presentation_key?: string | null
          price_cents?: number
          registration_deadline?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
          venue_hint?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          event_id: string
          id: string
          metadata: Json | null
          provider: string
          provider_checkout_session_id: string | null
          provider_payment_intent_id: string | null
          registration_id: string
          status: Database["public"]["Enums"]["registration_payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency: string
          event_id: string
          id?: string
          metadata?: Json | null
          provider?: string
          provider_checkout_session_id?: string | null
          provider_payment_intent_id?: string | null
          registration_id: string
          status?: Database["public"]["Enums"]["registration_payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          event_id?: string
          id?: string
          metadata?: Json | null
          provider?: string
          provider_checkout_session_id?: string | null
          provider_payment_intent_id?: string | null
          registration_id?: string
          status?: Database["public"]["Enums"]["registration_payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_responses: {
        Row: {
          birth_date: string | null
          completed_at: string | null
          created_at: string
          current_place: string | null
          email: string | null
          full_name: string | null
          id: string
          language_pref: string | null
          origin_place: string | null
          phone: string | null
          q_match_preference: string | null
          q13_social_style: string | null
          q17_recharge: string | null
          q20_meeting_priority: string[] | null
          q22_interests: string[] | null
          q25_motivation: string | null
          q26_about_you: string | null
          q27_comfort_needs: string | null
          social_link: string | null
          social_link_platform: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          completed_at?: string | null
          created_at?: string
          current_place?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          language_pref?: string | null
          origin_place?: string | null
          phone?: string | null
          q_match_preference?: string | null
          q13_social_style?: string | null
          q17_recharge?: string | null
          q20_meeting_priority?: string[] | null
          q22_interests?: string[] | null
          q25_motivation?: string | null
          q26_about_you?: string | null
          q27_comfort_needs?: string | null
          social_link?: string | null
          social_link_platform?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          completed_at?: string | null
          created_at?: string
          current_place?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          language_pref?: string | null
          origin_place?: string | null
          phone?: string | null
          q_match_preference?: string | null
          q13_social_style?: string | null
          q17_recharge?: string | null
          q20_meeting_priority?: string[] | null
          q22_interests?: string[] | null
          q25_motivation?: string | null
          q26_about_you?: string | null
          q27_comfort_needs?: string | null
          social_link?: string | null
          social_link_platform?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matching_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_logs: {
        Row: {
          created_at: string
          error: string | null
          error_code: string | null
          event_id: string | null
          id: string
          provider_message_id: string | null
          registration_id: string | null
          status: Database["public"]["Enums"]["message_status_type"]
          template_key: Database["public"]["Enums"]["template_key_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          error_code?: string | null
          event_id?: string | null
          id?: string
          provider_message_id?: string | null
          registration_id?: string | null
          status: Database["public"]["Enums"]["message_status_type"]
          template_key: Database["public"]["Enums"]["template_key_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          error_code?: string | null
          event_id?: string | null
          id?: string
          provider_message_id?: string | null
          registration_id?: string | null
          status?: Database["public"]["Enums"]["message_status_type"]
          template_key?: Database["public"]["Enums"]["template_key_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_logs_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          funnel_status: Database["public"]["Enums"]["funnel_status_type"]
          id: string
          phone: string
          preferred_language: Database["public"]["Enums"]["preferred_language_type"]
          questionnaire_draft: Json | null
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          funnel_status?: Database["public"]["Enums"]["funnel_status_type"]
          id: string
          phone?: string
          preferred_language?: Database["public"]["Enums"]["preferred_language_type"]
          questionnaire_draft?: Json | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          funnel_status?: Database["public"]["Enums"]["funnel_status_type"]
          id?: string
          phone?: string
          preferred_language?: Database["public"]["Enums"]["preferred_language_type"]
          questionnaire_draft?: Json | null
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_create_event_request: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      get_public_event_social_signals: {
        Args: {
          event_ids: string[]
        }
        Returns: {
          event_id: string
          attendee_count: number
        }[]
      }
      cancel_registration_with_email: {
        Args: { p_registration_id: string }
        Returns: {
          registration_id: string
          status: Database["public"]["Enums"]["registration_status"]
        }[]
      }
      confirm_registration_response: {
        Args: { p_registration_id: string }
        Returns: {
          registration_id: string
          status: Database["public"]["Enums"]["registration_status"]
        }[]
      }
      admin_decline_pending_registration: {
        Args: { p_registration_id: string }
        Returns: {
          registration_id: string
          status: Database["public"]["Enums"]["registration_status"]
        }[]
      }
      admin_mark_attended: {
        Args: { p_registration_id: string }
        Returns: {
          registration_id: string
          status: Database["public"]["Enums"]["registration_status"]
        }[]
      }
      decline_registration_response: {
        Args: { p_registration_id: string }
        Returns: {
          registration_id: string
          status: Database["public"]["Enums"]["registration_status"]
        }[]
      }
      enqueue_email_queue: {
        Args: {
          p_event_id: string
          p_idempotency_key?: string
          p_registration_id: string
          p_template_key: Database["public"]["Enums"]["template_key_type"]
          p_user_id: string
        }
        Returns: {
          idempotency_key: string
          queue_id: string
          queue_status: Database["public"]["Enums"]["message_status_type"]
        }[]
      }
      expire_offers_and_prepare_refill: {
        Args: { p_event_id?: string; p_timeout_hours?: number }
        Returns: {
          expired_count: number
          prepared_offer_count: number
        }[]
      }
      internal_offer_registration_with_timeout: {
        Args: { p_registration_id: string; p_timeout_hours?: number }
        Returns: {
          expires_at: string
          idempotency_key: string
          offered_at: string
          queue_id: string
          queue_status: Database["public"]["Enums"]["message_status_type"]
          registration_id: string
          status: Database["public"]["Enums"]["registration_status"]
        }[]
      }
      is_admin: { Args: { p_user_id?: string }; Returns: boolean }
      is_event_host: {
        Args: { p_event_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_questionnaire_ready: { Args: { p_user_id: string }; Returns: boolean }
      list_host_event_registration_summaries: {
        Args: never
        Returns: {
          awaiting_response: number
          confirmed_like: number
          event_id: string
          total_applied_like: number
          waitlisted: number
        }[]
      }
      offer_registration_with_timeout: {
        Args: { p_registration_id: string; p_timeout_hours?: number }
        Returns: {
          expires_at: string
          offered_at: string
          registration_id: string
          status: Database["public"]["Enums"]["registration_status"]
        }[]
      }
      pick_next_refill_candidate: {
        Args: { p_event_id: string; p_excluded_registration_ids?: string[] }
        Returns: string
      }
      prepare_next_waitlist_refill_offers: {
        Args: {
          p_event_id: string
          p_excluded_registration_ids?: string[]
          p_slots?: number
          p_timeout_hours?: number
        }
        Returns: number
      }
      record_event_selection_output: {
        Args: {
          p_event_id: string
          p_selected_registration_ids?: string[]
          p_waitlist_registration_ids?: string[]
        }
        Returns: {
          selected_count: number
          selection_batch_id: string
          waitlist_count: number
        }[]
      }
      register_or_reregister_with_email: {
        Args: {
          p_application_answers?: Json
          p_birth_date?: string
          p_event_id: string
          p_social_link?: string
        }
        Returns: {
          idempotency_key: string
          is_new: boolean
          queue_id: string
          queue_status: Database["public"]["Enums"]["message_status_type"]
          registration_id: string
          status: Database["public"]["Enums"]["registration_status"]
        }[]
      }
      release_stale_email_claims: {
        Args: { p_stale_before?: string }
        Returns: number
      }
      remaining_event_offer_slots: {
        Args: { p_event_id: string }
        Returns: number
      }
      user_has_registration_for_event: {
        Args: { p_event_id: string; p_user_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "participant" | "admin"
      event_status:
        | "draft"
        | "submitted_for_review"
        | "rejected"
        | "active"
        | "closed"
        | "completed"
      funnel_status_type:
        | "needs_questionnaire"
        | "ready_for_registration"
        | "registration_pending"
        | "registration_waitlist"
        | "registration_approved"
        | "registration_rejected"
        | "registration_cancelled"
        | "attended"
        | "no_show"
      message_status_type: "queued" | "sent" | "failed" | "skipped_test_mode"
      preferred_language_type: "he" | "en"
      registration_status:
        | "pending"
        | "waitlist"
        | "awaiting_response"
        | "confirmed"
        | "approved"
        | "rejected"
        | "cancelled"
        | "attended"
        | "no_show"
      registration_payment_status:
        | "open"
        | "processing"
        | "succeeded"
        | "failed"
        | "canceled"
        | "expired"
      selection_outcome_type: "selected" | "waitlist"
      template_key_type:
        | "registration_received"
        | "approved"
        | "rejected"
        | "reminder_evening_before"
        | "location_morning_of"
        | "temporary_offer"
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
      app_role: ["participant", "admin"],
      event_status: [
        "draft",
        "submitted_for_review",
        "rejected",
        "active",
        "closed",
        "completed",
      ],
      funnel_status_type: [
        "needs_questionnaire",
        "ready_for_registration",
        "registration_pending",
        "registration_waitlist",
        "registration_approved",
        "registration_rejected",
        "registration_cancelled",
        "attended",
        "no_show",
      ],
      message_status_type: ["queued", "sent", "failed", "skipped_test_mode"],
      preferred_language_type: ["he", "en"],
      registration_status: [
        "pending",
        "waitlist",
        "awaiting_response",
        "confirmed",
        "approved",
        "rejected",
        "cancelled",
        "attended",
        "no_show",
      ],
      registration_payment_status: [
        "open",
        "processing",
        "succeeded",
        "failed",
        "canceled",
        "expired",
      ],
      selection_outcome_type: ["selected", "waitlist"],
      template_key_type: [
        "registration_received",
        "approved",
        "rejected",
        "reminder_evening_before",
        "location_morning_of",
        "temporary_offer",
      ],
    },
  },
} as const
