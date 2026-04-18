import type { Database } from '@/integrations/supabase/types';

export type AdminReviewEvent = Pick<
  Database['public']['Tables']['events']['Row'],
  'id' | 'title' | 'city' | 'starts_at' | 'status' | 'is_published' | 'max_capacity'
>;

/** All events visible to operators (admin RLS). */
export type OperatorEventListRow = Pick<
  Database['public']['Tables']['events']['Row'],
  'id' | 'title' | 'city' | 'starts_at' | 'registration_deadline' | 'status' | 'max_capacity' | 'is_published'
>;

export type OperatorEventDetail = OperatorEventListRow & {
  venue_hint: string | null;
};

export type AdminSubmittedEventRequest = Pick<
  Database['public']['Tables']['events']['Row'],
  | 'id'
  | 'title'
  | 'description'
  | 'city'
  | 'venue_hint'
  | 'starts_at'
  | 'registration_deadline'
  | 'max_capacity'
  | 'status'
  | 'is_published'
  | 'created_at'
  | 'updated_at'
  | 'created_by_user_id'
  | 'host_user_id'
> & {
  creator: AdminApplicantProfile | null;
};

export interface AdminApplicantProfile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

export interface AdminApplicantReview {
  id: string;
  user_id: string;
  status: Database['public']['Enums']['registration_status'];
  created_at: string;
  offered_at: string | null;
  expires_at: string | null;
  questionnaire_completed: boolean;
  application_answers: Database['public']['Tables']['event_registrations']['Row']['application_answers'];
  profile: AdminApplicantProfile | null;
  selection_batch_id: string | null;
  selection_outcome: Database['public']['Enums']['selection_outcome_type'] | null;
  selection_rank: number | null;
}
