import type { Database } from '@/integrations/supabase/types';

export type EventRow = Database['public']['Tables']['events']['Row'];

export interface EventRequestProfile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

export type HostEventRequestStatus = Extract<
  Database['public']['Enums']['event_status'],
  'draft' | 'submitted_for_review' | 'rejected' | 'active' | 'closed' | 'completed'
>;

export interface HostEventRequestDraftInput {
  title: string;
  description: string;
  city: string;
  venue_hint: string;
  starts_at: string;
  registration_deadline: string;
  max_capacity: string;
}

export interface HostEventRequest extends Pick<
  EventRow,
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
> {}

export interface HostEventRegistrationSummary {
  total_applied_like: number;
  awaiting_response: number;
  confirmed_like: number;
  waitlisted: number;
}

export interface HostOverviewEvent extends HostEventRequest {
  registration_summary: HostEventRegistrationSummary | null;
}

export interface HostEventRegistrationSummaryRow extends HostEventRegistrationSummary {
  event_id: string;
}

export interface AdminEventRequestReview extends HostEventRequest {
  creator: EventRequestProfile | null;
}
