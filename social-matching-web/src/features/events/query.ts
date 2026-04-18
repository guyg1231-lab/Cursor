import { supabase } from '@/integrations/supabase/client';
import type { VisibleEvent } from '@/features/events/types';

export interface DashboardApplicationEventRecord {
  id: string;
  title: string;
  description: string | null;
  city: string;
  starts_at: string;
  registration_deadline: string | null;
  is_published: boolean;
  status: VisibleEvent['status'];
  venue_hint: string | null;
  max_capacity: number | null;
}

export async function listDashboardApplications(userId: string) {
  const { data, error } = await supabase
    .from('event_registrations')
    .select(
      `
        *,
        event:events(
          id,
          title,
          description,
          city,
          starts_at,
          registration_deadline,
          is_published,
          status,
          venue_hint,
          max_capacity
        )
      `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
