import { supabase } from '@/integrations/supabase/client';
import { safeSessionStorage } from '@/lib/safeStorage';
import type { EventRow, VisibleEvent } from '@/features/events/types';
import { buildCuratedInitialEvents, getLegacyEventSlugToTitleMap } from '@/features/events/presentation';

const VISIBLE_EVENTS_CACHE_KEY = 'social_matching_visible_events_v1';
const VISIBLE_EVENTS_REQUEST_TIMEOUT_MS = 1_500;

function nowIso() {
  return new Date().toISOString();
}

function isoDaysFromNow(daysFromNow: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

function isRegistrationOpen(event: EventRow) {
  if (event.status !== 'active') return false;
  if (!event.is_published) return false;
  if (event.registration_deadline && event.registration_deadline < nowIso()) return false;
  return true;
}

const INITIAL_EVENTS: EventRow[] = buildCuratedInitialEvents(nowIso, isoDaysFromNow);
const LOCKED_FALLBACK_EVENTS: EventRow[] = INITIAL_EVENTS.slice(0, 4);
const CURATED_DEV_EVENT_TITLES = new Set(LOCKED_FALLBACK_EVENTS.map((event) => event.title));
const CURATED_DEV_EVENT_BY_TITLE = new Map(LOCKED_FALLBACK_EVENTS.map((event) => [event.title, event]));

const LEGACY_EVENT_SLUG_TO_TITLE: Record<string, string> = {
  ...getLegacyEventSlugToTitleMap(),
  'initial-tel-aviv-circle': 'מעגל היכרות תל אביב',
  'initial-jerusalem-circle': 'מעגל ירושלים - עומק ושיח',
};

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toVisibleEvents(events: EventRow[]): VisibleEvent[] {
  return events.map((event) => ({
    ...event,
    is_registration_open: isRegistrationOpen(event),
  }));
}

async function fetchEventSocialSignals(eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, { attendee_count: number }>();

  const { data, error } = await supabase.rpc('get_public_event_social_signals', {
    event_ids: eventIds,
  });

  if (error || !data) return new Map<string, { attendee_count: number }>();
  if (!Array.isArray(data)) return new Map<string, { attendee_count: number }>();

  return new Map(
    data.map((row) => [
      row.event_id,
      {
        attendee_count: row.attendee_count,
      },
    ]),
  );
}

async function withSocialSignals(events: EventRow[]): Promise<VisibleEvent[]> {
  try {
    const signals = await fetchEventSocialSignals(events.map((event) => event.id));
    return events.map((event) => ({
      ...event,
      is_registration_open: isRegistrationOpen(event),
      social_signal: signals.get(event.id),
    }));
  } catch (e) {
    console.error('[events/api] withSocialSignals failed', e);
    return events.map((event) => ({
      ...event,
      is_registration_open: isRegistrationOpen(event),
    }));
  }
}

function isEventRow(value: unknown): value is EventRow {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string'
    && typeof record.title === 'string'
    && typeof record.city === 'string'
    && typeof record.starts_at === 'string'
    && typeof record.status === 'string'
    && typeof record.is_published === 'boolean'
  );
}

function readCachedVisibleEvents(): EventRow[] | null {
  const raw = safeSessionStorage.getItem(VISIBLE_EVENTS_CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isEventRow)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedVisibleEvents(events: EventRow[]) {
  try {
    safeSessionStorage.setItem(VISIBLE_EVENTS_CACHE_KEY, JSON.stringify(events));
  } catch {
    // Storage can be unavailable in privacy modes; ignore and keep runtime-only behavior.
  }
}

function looksFixtureLikeBrowseEvent(event: EventRow) {
  const normalizedTitle = event.title.trim().toLowerCase();
  const normalizedCity = event.city.trim().toLowerCase();
  const normalizedVenue = (event.venue_hint ?? '').trim().toLowerCase();
  const normalizedDescription = (event.description ?? '').trim().toLowerCase();

  return (
    normalizedTitle.includes('fixture')
    || normalizedTitle.includes('slice')
    || normalizedTitle.startsWith('ar-')
    || normalizedCity === 'tel aviv'
    || normalizedVenue === 'tel aviv'
    || normalizedDescription.includes('a calm, small gathering')
  );
}

function sanitizeLiveBrowseRows(events: EventRow[]) {
  const cleaned = events.filter((event) => !looksFixtureLikeBrowseEvent(event));
  const removedCount = events.length - cleaned.length;
  if (removedCount > 0) {
    console.warn('[events/api] filtered fixture-like rows from live browse data', {
      receivedCount: events.length,
      removedCount,
      keptCount: cleaned.length,
    });
  }
  if (cleaned.length > 0) return cleaned;
  if (events.length > 0) {
    console.warn('[events/api] no valid live browse rows after filtering, using locked fallback');
  }
  return LOCKED_FALLBACK_EVENTS;
}

function shouldInjectCuratedDevEvents() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

function applyCuratedDevCopy(events: EventRow[]) {
  if (!shouldInjectCuratedDevEvents()) return events;
  return events.map((event) => {
    const curated = CURATED_DEV_EVENT_BY_TITLE.get(event.title);
    if (!curated) return event;
    return {
      ...event,
      // Keep live ids/timestamps/statuses, but enforce curated participant-facing copy on localhost.
      description: curated.description,
      presentation_key: curated.presentation_key ?? event.presentation_key,
    };
  });
}

function mergeCuratedDevEvents(events: EventRow[]) {
  if (!shouldInjectCuratedDevEvents()) return events;

  const withCuratedCopy = applyCuratedDevCopy(events);

  const hasAnyCuratedTitle = withCuratedCopy.some((event) => CURATED_DEV_EVENT_TITLES.has(event.title));
  if (hasAnyCuratedTitle) return withCuratedCopy;

  const byId = new Map<string, EventRow>();
  for (const event of LOCKED_FALLBACK_EVENTS) byId.set(event.id, event);
  for (const event of withCuratedCopy) byId.set(event.id, event);
  return [...byId.values()];
}

async function fetchVisibleEventsFromRemote(): Promise<VisibleEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .eq('status', 'active')
    .order('starts_at', { ascending: true });

  if (error) {
    throw error;
  }

  const rows = mergeCuratedDevEvents(sanitizeLiveBrowseRows(data ?? []));
  writeCachedVisibleEvents(rows);
  return withSocialSignals(rows);
}

function timeoutVisibleEventsRequest(): Promise<null> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(null), VISIBLE_EVENTS_REQUEST_TIMEOUT_MS);
  });
}

/**
 * MVP browse visibility rule for the new app:
 * - `is_published = true`
 * - `status = 'active'`
 * Ordered by `starts_at` ascending.
 */
export async function listVisibleEvents(): Promise<VisibleEvent[]> {
  const cached = readCachedVisibleEvents();
  const sanitizedCached = cached ? applyCuratedDevCopy(sanitizeLiveBrowseRows(cached)) : null;

  try {
    const result = await Promise.race([
      fetchVisibleEventsFromRemote(),
      timeoutVisibleEventsRequest(),
    ]);

    if (result) {
      return result;
    }
  } catch (error) {
    if (sanitizedCached) {
      return withSocialSignals(sanitizedCached);
    }
    throw error;
  }

  return withSocialSignals(sanitizedCached ?? LOCKED_FALLBACK_EVENTS);
}

/**
 * Event detail visibility rule in this block:
 * - event must be published
 * - status may be any value so the UI can render a clean not-open state for published-but-closed events
 */
export async function getVisibleEventById(eventId: string): Promise<VisibleEvent | null> {
  const query = supabase
    .from('events')
    .select('*')
    .eq('is_published', true);

  const normalizedId = eventId.trim();
  let data: EventRow | null = null;
  let error: { message?: string } | null = null;

  if (looksLikeUuid(normalizedId)) {
    const byId = await query.eq('id', normalizedId).maybeSingle();
    data = byId.data;
    error = byId.error;
  } else {
    const legacyTitle = LEGACY_EVENT_SLUG_TO_TITLE[normalizedId];
    if (!legacyTitle) {
      return null;
    }
    const byTitle = await query
      .eq('title', legacyTitle)
      .order('starts_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    data = byTitle.data;
    error = byTitle.error;
  }

  if (error) {
    console.warn('[events/api] getVisibleEventById failed', { eventId, message: error.message });
    const initialEvent = INITIAL_EVENTS.find((event) => event.id === eventId);
    if (!initialEvent) return null;
    const [visibleEvent] = await withSocialSignals([initialEvent]);
    return visibleEvent ?? null;
  }
  if (!data) {
    const initialEvent = INITIAL_EVENTS.find((event) => event.id === eventId);
    if (!initialEvent) return null;
    const [visibleEvent] = await withSocialSignals([initialEvent]);
    return visibleEvent ?? null;
  }

  const [visibleEvent] = await withSocialSignals([data]);
  return visibleEvent ?? null;
}
