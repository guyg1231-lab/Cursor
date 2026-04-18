import type { Database } from '@/integrations/supabase/types';

export type EventRow = Database['public']['Tables']['events']['Row'];

export interface VisibleEvent extends EventRow {
  is_registration_open: boolean;
}
