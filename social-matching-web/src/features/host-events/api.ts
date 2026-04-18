import { supabase } from '@/integrations/supabase/client';
import type {
  HostEventRegistrationSummary,
  HostEventRegistrationSummaryRow,
  HostEventRequest,
  HostEventRequestDraftInput,
  HostOverviewEvent,
} from '@/features/host-events/types';

function createEmptySummary(): HostEventRegistrationSummary {
  return {
    total_applied_like: 0,
    awaiting_response: 0,
    confirmed_like: 0,
    waitlisted: 0,
  };
}

function buildRegistrationSummary(rows: HostEventRegistrationSummaryRow[]) {
  const summaryByEventId = new Map<string, HostEventRegistrationSummary>();

  for (const row of rows) {
    summaryByEventId.set(row.event_id, {
      total_applied_like: row.total_applied_like,
      awaiting_response: row.awaiting_response,
      confirmed_like: row.confirmed_like,
      waitlisted: row.waitlisted,
    });
  }

  return summaryByEventId;
}

function parseOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildDraftPayload(userId: string, values: HostEventRequestDraftInput) {
  return {
    created_by_user_id: userId,
    title: values.title.trim(),
    description: parseOptionalText(values.description),
    city: values.city.trim() || 'תל אביב',
    venue_hint: parseOptionalText(values.venue_hint),
    starts_at: values.starts_at,
    registration_deadline: values.registration_deadline || null,
    max_capacity: parseOptionalNumber(values.max_capacity),
    is_published: false,
    host_user_id: null,
  };
}

export async function listMyEventRequests(userId: string): Promise<HostEventRequest[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('created_by_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function listHostOverviewEvents(userId: string): Promise<HostOverviewEvent[]> {
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .or(`created_by_user_id.eq.${userId},host_user_id.eq.${userId}`)
    .order('starts_at', { ascending: true });

  if (eventsError) throw eventsError;

  const baseEvents = events ?? [];
  if (baseEvents.length === 0) return [];

  const hostedEventIds = baseEvents
    .filter((event) => event.host_user_id === userId)
    .map((event) => event.id);

  let summaryByEventId = new Map<string, HostEventRegistrationSummary>();

  if (hostedEventIds.length > 0) {
    const { data: registrationRows, error: registrationsError } = await supabase
      .rpc('list_host_event_registration_summaries');

    if (registrationsError) throw registrationsError;
    const filteredRows = (registrationRows ?? []).filter((row) => hostedEventIds.includes(row.event_id));
    summaryByEventId = buildRegistrationSummary(filteredRows as HostEventRegistrationSummaryRow[]);
  }

  return baseEvents.map((event) => ({
    ...event,
    registration_summary: event.host_user_id === userId
      ? (summaryByEventId.get(event.id) ?? createEmptySummary())
      : null,
  }));
}

export async function createEventDraft(userId: string, values: HostEventRequestDraftInput): Promise<HostEventRequest> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      ...buildDraftPayload(userId, values),
      status: 'draft',
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateEventDraft(eventId: string, userId: string, values: HostEventRequestDraftInput): Promise<HostEventRequest> {
  const { data, error } = await supabase
    .from('events')
    .update(buildDraftPayload(userId, values))
    .eq('id', eventId)
    .eq('created_by_user_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function submitEventRequest(eventId: string, userId: string): Promise<HostEventRequest> {
  const { data, error } = await supabase
    .from('events')
    .update({
      status: 'submitted_for_review',
      is_published: false,
      created_by_user_id: userId,
      host_user_id: null,
    })
    .eq('id', eventId)
    .eq('created_by_user_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
