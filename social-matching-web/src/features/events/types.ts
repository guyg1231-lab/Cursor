import type { Database } from '@/integrations/supabase/types';

export type EventRow = Database['public']['Tables']['events']['Row'];

export interface EventSocialSignal {
  attendee_count: number;
}

export interface VisibleEvent extends EventRow {
  is_registration_open: boolean;
  social_signal?: EventSocialSignal;
}
