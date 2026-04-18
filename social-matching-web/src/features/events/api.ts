import { supabase } from '@/integrations/supabase/client';
import type { EventRow, VisibleEvent } from '@/features/events/types';

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

/**
 * MVP browse visibility rule for the new app:
 * - `is_published = true`
 * - `status = 'active'`
 * Ordered by `starts_at` ascending.
 */
export async function listVisibleEvents(): Promise<VisibleEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .eq('status', 'active')
    .order('starts_at', { ascending: true });

  if (error) {
    return toVisibleEvents(INITIAL_EVENTS);
  }

  return toVisibleEvents(data ?? INITIAL_EVENTS);
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
    return initialEvent ? { ...initialEvent, is_registration_open: isRegistrationOpen(initialEvent) } : null;
  }
  if (!data) {
    const initialEvent = INITIAL_EVENTS.find((event) => event.id === eventId);
    return initialEvent ? { ...initialEvent, is_registration_open: isRegistrationOpen(initialEvent) } : null;
  }

  return {
    ...data,
    is_registration_open: isRegistrationOpen(data),
  };
}
