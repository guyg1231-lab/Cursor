import { supabase } from '@/integrations/supabase/client';
import { safeSessionStorage } from '@/lib/safeStorage';
import type { EventRow, VisibleEvent } from '@/features/events/types';

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

const INITIAL_EVENTS: EventRow[] = [
  {
    id: 'initial-tel-aviv-circle',
    title: 'מעגל היכרות תל אביב',
    description: 'מפגש קטן בסלון אינטימי עם שיחה מונחית וחיבור בין אנשים שחושבים דומה.',
    city: 'תל אביב',
    starts_at: isoDaysFromNow(10),
    registration_deadline: isoDaysFromNow(7),
    venue_hint: 'פלורנטין, כתובת מלאה תישלח אחרי התאמה',
    max_capacity: 8,
    status: 'active',
    is_published: true,
    created_at: nowIso(),
    updated_at: nowIso(),
    created_by_user_id: null,
    host_user_id: null,
    payment_required: false,
    price_cents: 0,
    currency: 'ILS',
  },
  {
    id: 'initial-jerusalem-circle',
    title: 'מעגל ירושלים - עומק ושיח',
    description: 'שיח פתוח עם קבוצה קטנה סביב נושאי חיים, קהילה ומשמעות.',
    city: 'ירושלים',
    starts_at: isoDaysFromNow(16),
    registration_deadline: isoDaysFromNow(13),
    venue_hint: 'מרכז העיר, מיקום מדויק יישלח לנרשמים',
    max_capacity: 6,
    status: 'active',
    is_published: true,
    created_at: nowIso(),
    updated_at: nowIso(),
    created_by_user_id: null,
    host_user_id: null,
    payment_required: false,
    price_cents: 0,
    currency: 'ILS',
  },
];

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

  const rows = data ?? INITIAL_EVENTS;
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

  try {
    const result = await Promise.race([
      fetchVisibleEventsFromRemote(),
      timeoutVisibleEventsRequest(),
    ]);

    if (result) {
      return result;
    }
  } catch {
    // Fall through to cached/seeded fallback below.
  }

  return withSocialSignals(cached ?? INITIAL_EVENTS);
}

/**
 * Event detail visibility rule in this block:
 * - event must be published
 * - status may be any value so the UI can render a clean not-open state for published-but-closed events
 */
export async function getVisibleEventById(eventId: string): Promise<VisibleEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('is_published', true)
    .maybeSingle();

  if (error) {
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
