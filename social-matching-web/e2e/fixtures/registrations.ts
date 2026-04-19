import type { SupabaseClient } from '@supabase/supabase-js';

export type RegistrationPatch = {
  status?: string;
  expires_at?: string | null;
  offered_at?: string | null;
};

/**
 * Temporarily patches an event_registrations row, runs `body`, then restores
 * the snapshotted fields. Bulletproof teardown semantics:
 *   1. Always attempts restore in `finally`, even if body threw.
 *   2. If body threw, body's error takes precedence over restore errors.
 *   3. Restore errors are logged with a contextual prefix before re-throwing.
 *
 * Callers own the browser-context lifecycle inside `body`.
 */
export async function withFlippedRegistrationStatus(
  admin: SupabaseClient,
  filter: { userId: string; eventId: string },
  patch: RegistrationPatch,
  body: () => Promise<void>,
): Promise<void> {
  const fields = Object.keys(patch);
  if (fields.length === 0) {
    throw new Error('withFlippedRegistrationStatus: patch must contain at least one field');
  }

  const { data: snapshot, error: snapshotError } = await admin
    .from('event_registrations')
    .select(fields.join(','))
    .eq('event_id', filter.eventId)
    .eq('user_id', filter.userId)
    .maybeSingle();
  if (snapshotError) throw snapshotError;
  if (!snapshot) {
    throw new Error(
      `withFlippedRegistrationStatus: no event_registrations row for user=${filter.userId} event=${filter.eventId}`,
    );
  }

  const { error: patchError } = await admin
    .from('event_registrations')
    .update(patch)
    .eq('event_id', filter.eventId)
    .eq('user_id', filter.userId);
  if (patchError) throw patchError;

  let bodyError: unknown;
  try {
    await body();
  } catch (e) {
    bodyError = e;
  }

  try {
    const { error: restoreError } = await admin
      .from('event_registrations')
      .update(snapshot as Record<string, unknown>)
      .eq('event_id', filter.eventId)
      .eq('user_id', filter.userId);
    if (restoreError) throw restoreError;
  } catch (restoreError) {
    // eslint-disable-next-line no-console
    console.error(
      `withFlippedRegistrationStatus: failed to restore user=${filter.userId} event=${filter.eventId}`,
      restoreError,
    );
    if (!bodyError) throw restoreError;
  }

  if (bodyError) throw bodyError;
}
