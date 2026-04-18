import { createServiceRoleClient } from './supabase';
import { ENV } from './env';

/**
 * Remove ALL registrations for the given event so each test starts clean.
 * Service-role: bypasses RLS.
 */
export async function resetEventRegistrations(eventId: string = ENV.EVENT_ID): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin.from('event_registrations').delete().eq('event_id', eventId);
  if (error) throw new Error(`resetEventRegistrations failed: ${error.message}`);
}

export type RegistrationSnapshot = {
  user_email: string;
  status: string;
  expires_at: string | null;
};

export async function fetchRegistrationsByEmail(eventId: string = ENV.EVENT_ID): Promise<RegistrationSnapshot[]> {
  const admin = createServiceRoleClient();
  const { data: regs, error: regErr } = await admin
    .from('event_registrations')
    .select('user_id, status, expires_at')
    .eq('event_id', eventId);
  if (regErr) throw new Error(`fetchRegistrationsByEmail (regs) failed: ${regErr.message}`);
  const userIds = (regs ?? []).map((r: any) => r.user_id);
  if (userIds.length === 0) return [];
  const { data: profiles, error: profErr } = await admin
    .from('profiles')
    .select('id, email')
    .in('id', userIds);
  if (profErr) throw new Error(`fetchRegistrationsByEmail (profiles) failed: ${profErr.message}`);
  const emailById = new Map<string, string>();
  for (const p of (profiles ?? []) as any[]) emailById.set(p.id, p.email ?? '');
  return (regs ?? []).map((row: any) => ({
    user_email: emailById.get(row.user_id) ?? '',
    status: row.status,
    expires_at: row.expires_at ?? null,
  }));
}

export async function fetchStatusForEmail(email: string, eventId: string = ENV.EVENT_ID): Promise<RegistrationSnapshot | null> {
  const rows = await fetchRegistrationsByEmail(eventId);
  return rows.find((r) => r.user_email.toLowerCase() === email.toLowerCase()) ?? null;
}

export type EventSnapshot = {
  id: string;
  status: string;
  is_published: boolean;
  host_user_id: string | null;
  created_by_user_id: string | null;
};

/** Service-role fetch; bypasses RLS so tests can read rows regardless of publish state. */
export async function fetchEventById(eventId: string): Promise<EventSnapshot | null> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from('events')
    .select('id, status, is_published, host_user_id, created_by_user_id')
    .eq('id', eventId)
    .maybeSingle();
  if (error) throw new Error(`fetchEventById failed: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    status: data.status,
    is_published: data.is_published,
    host_user_id: data.host_user_id ?? null,
    created_by_user_id: data.created_by_user_id ?? null,
  };
}

/**
 * Delete every event authored by the given email. Used by the admin-review spec
 * to start from a clean per-host slate without touching events authored by other
 * test users (e.g. the four participants' fixtures).
 *
 * Service-role: bypasses RLS. Cascading deletes on event_registrations handle
 * any children that might exist from previous runs.
 */
export async function deleteEventsForCreator(email: string): Promise<void> {
  const admin = createServiceRoleClient();
  const { data: profile, error: profErr } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (profErr) throw new Error(`deleteEventsForCreator (profile lookup) failed: ${profErr.message}`);
  if (!profile) return;
  const { error: delErr } = await admin
    .from('events')
    .delete()
    .eq('created_by_user_id', profile.id);
  if (delErr) throw new Error(`deleteEventsForCreator failed: ${delErr.message}`);
}
