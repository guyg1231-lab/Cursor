import type { Database } from '@/integrations/supabase/types';

export type EventRegistrationRow = Database['public']['Tables']['event_registrations']['Row'];
export type MatchingResponseRow = Database['public']['Tables']['matching_responses']['Row'];
export type RegistrationStatus = Database['public']['Enums']['registration_status'];

export interface ApplicationReadiness {
  ready: boolean;
  reason:
    | 'unauthenticated'
    | 'questionnaire_incomplete'
    | 'already_applied'
    | 'event_closed'
    | 'ready';
}

export interface ApplicationSubmissionResult {
  registration: EventRegistrationRow;
  mode: 'created' | 're_registered';
}

export type ApplicationSubmitErrorReason =
  | 'already_applied'
  | 'event_closed'
  | 'event_started'
  | 'event_full'
  | 'unauthenticated'
  | 'unknown';

export type ApplicationConfirmErrorReason =
  | 'offer_expired'
  | 'not_awaiting_response'
  | 'unauthenticated'
  | 'forbidden'
  | 'unknown';

export interface PersistedApplicationAnswers {
  [key: string]: string | boolean | null;
  why_this_event: string;
  desired_outcome: string;
  what_you_bring: string;
  host_note: string | null;
  understand_payment: boolean;
  commit_on_time: boolean;
  submitted_at: string;
}
