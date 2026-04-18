import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type {
  AdminApplicantProfile,
  AdminApplicantReview,
  AdminReviewEvent,
  AdminSubmittedEventRequest,
  OperatorEventDetail,
  OperatorEventListRow,
} from '@/features/admin/types';

type EventRow = Database['public']['Tables']['events']['Row'];
type RegistrationRow = Database['public']['Tables']['event_registrations']['Row'];

type AdminApplicantQueryRow = Pick<
  RegistrationRow,
  | 'id'
  | 'user_id'
  | 'status'
  | 'created_at'
  | 'offered_at'
  | 'expires_at'
  | 'questionnaire_completed'
  | 'application_answers'
  | 'selection_batch_id'
  | 'selection_outcome'
  | 'selection_rank'
> & {
  profile?: {
    full_name?: unknown;
    email?: unknown;
    phone?: unknown;
  } | null;
};

type AdminSubmittedEventRequestQueryRow = Pick<
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
> & {
  creator?: {
    full_name?: unknown;
    email?: unknown;
    phone?: unknown;
  } | null;
};

function parseProfile(value: unknown): AdminApplicantProfile | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  return {
    full_name: typeof record.full_name === 'string' ? record.full_name : null,
    email: typeof record.email === 'string' ? record.email : null,
    phone: typeof record.phone === 'string' ? record.phone : null,
  };
}

export class AdminOfferActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdminOfferActionError';
  }
}

export class AdminEventRequestActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdminEventRequestActionError';
  }
}

export class AdminSelectionActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdminSelectionActionError';
  }
}

function mapAdminOfferError(message?: string) {
  if (!message) return new AdminOfferActionError('לא הצלחנו להשלים את הפעולה כרגע.');

  if (/registration is not eligible for a temporary offer/i.test(message)) {
    return new AdminOfferActionError('לא ניתן לשמור כרגע מקום זמני עבור ההרשמה הזו, כנראה כי הסטטוס שלה כבר השתנה.');
  }

  if (/registration not found/i.test(message)) {
    return new AdminOfferActionError('לא מצאנו את ההרשמה הזאת יותר. כדאי לרענן את הרשימה.');
  }

  if (/unauthorized_admin_only|only admins/i.test(message)) {
    return new AdminOfferActionError('הפעולה הזו זמינה רק למנהלים מחוברים.');
  }

  if (/timeout_hours_must_be_positive/i.test(message)) {
    return new AdminOfferActionError('חלון התגובה שנשלח אינו תקין.');
  }

  return new AdminOfferActionError(message);
}

function mapAdminSelectionError(message?: string) {
  if (!message) return new AdminSelectionActionError('לא הצלחנו לשמור את תוצאות הסלקציה כרגע.');

  if (/unauthorized_admin_only|only admins/i.test(message)) {
    return new AdminSelectionActionError('הפעולה זמינה רק למנהלים מחוברים.');
  }

  if (/duplicate registration ids/i.test(message)) {
    return new AdminSelectionActionError('אותה הרשמה הופיעה פעמיים ברשימה — הסירו כפילויות.');
  }

  if (/all registrations must belong to the same event/i.test(message)) {
    return new AdminSelectionActionError('חלק מהמזהים אינם שייכים לאירוע הזה.');
  }

  if (/selection output cannot include terminal/i.test(message)) {
    return new AdminSelectionActionError('לא ניתן לכלול הרשמות בסטטוס סופי (בוטל/נדחה וכו׳).');
  }

  if (/mismatch/i.test(message)) {
    return new AdminSelectionActionError('מספר המזהים לא תואם לעדכון — בדקו רשימות נבחרים ורשימת המתנה.');
  }

  return new AdminSelectionActionError(message);
}

function mapAdminEventRequestError(message?: string) {
  if (!message) return new AdminEventRequestActionError('לא הצלחנו להשלים את פעולת בדיקת האירוע כרגע.');

  if (/row-level security|permission denied|not allowed/i.test(message)) {
    return new AdminEventRequestActionError('הפעולה הזו זמינה רק למנהלים מורשים.');
  }

  return new AdminEventRequestActionError(message);
}

export async function listAdminReviewEvents(): Promise<AdminReviewEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, city, starts_at, status, is_published, max_capacity')
    .neq('status', 'draft')
    .neq('status', 'submitted_for_review')
    .order('starts_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Pick<
    EventRow,
    'id' | 'title' | 'city' | 'starts_at' | 'status' | 'is_published' | 'max_capacity'
  >[];
}

export async function listOperatorEvents(): Promise<OperatorEventListRow[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, city, starts_at, registration_deadline, status, max_capacity, is_published')
    .order('starts_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as OperatorEventListRow[];
}

export type OperatorEventCreateInput = {
  title: string;
  starts_at: string;
  city: string;
  venue_hint: string | null;
  registration_deadline: string | null;
  max_capacity: number | null;
};

/**
 * Step 1: insert draft (same RLS as host draft). Step 2: admin update → active + published.
 */
export function parseRegistrationIdList(raw: string): string[] {
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const parts = raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    if (uuidRe.test(p) && !seen.has(p.toLowerCase())) {
      seen.add(p.toLowerCase());
      out.push(p);
    }
  }
  return out;
}

export async function getOperatorEvent(eventId: string): Promise<OperatorEventDetail | null> {
  const { data, error } = await supabase
    .from('events')
    .select(
      'id, title, city, venue_hint, starts_at, registration_deadline, status, max_capacity, is_published',
    )
    .eq('id', eventId)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as OperatorEventDetail | null;
}

export async function insertOperatorEventDraftAndPublish(
  operatorUserId: string,
  input: OperatorEventCreateInput,
): Promise<{ id: string }> {
  const title = input.title.trim();
  const city = input.city.trim() || 'תל אביב';

  const { data: inserted, error: insertError } = await supabase
    .from('events')
    .insert({
      created_by_user_id: operatorUserId,
      title,
      description: null,
      city,
      venue_hint: input.venue_hint?.trim() || null,
      starts_at: input.starts_at,
      registration_deadline: input.registration_deadline || null,
      max_capacity: input.max_capacity,
      is_published: false,
      host_user_id: null,
      status: 'draft',
    })
    .select('id')
    .single();

  if (insertError) {
    throw mapAdminEventRequestError(insertError.message);
  }

  if (!inserted?.id) {
    throw mapAdminEventRequestError('insert returned no id');
  }

  const { data: updated, error: updateError } = await supabase
    .from('events')
    .update({
      status: 'active',
      is_published: true,
      host_user_id: operatorUserId,
    })
    .eq('id', inserted.id)
    .select('id')
    .single();

  if (updateError) {
    throw mapAdminEventRequestError(updateError.message);
  }

  if (!updated?.id) {
    throw mapAdminEventRequestError('publish update returned no id');
  }

  return { id: updated.id };
}

export async function listAdminSubmittedEventRequests(): Promise<AdminSubmittedEventRequest[]> {
  const { data, error } = await supabase
    .from('events')
    .select(
      'id, title, description, city, venue_hint, starts_at, registration_deadline, max_capacity, status, is_published, created_at, updated_at, created_by_user_id, host_user_id, creator:profiles!events_created_by_user_id_fkey(full_name, email, phone)',
    )
    .eq('status', 'submitted_for_review')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return ((data ?? []) as AdminSubmittedEventRequestQueryRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    city: row.city,
    venue_hint: row.venue_hint ?? null,
    starts_at: row.starts_at,
    registration_deadline: row.registration_deadline ?? null,
    max_capacity: row.max_capacity ?? null,
    status: row.status,
    is_published: row.is_published,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by_user_id: row.created_by_user_id ?? null,
    host_user_id: row.host_user_id ?? null,
    creator: parseProfile(row.creator),
  }));
}

export async function approveSubmittedEventRequest(eventId: string) {
  const { data: current, error: currentError } = await supabase
    .from('events')
    .select('id, created_by_user_id')
    .eq('id', eventId)
    .eq('status', 'submitted_for_review')
    .single();

  if (currentError) {
    throw mapAdminEventRequestError(currentError.message);
  }

  const { data, error } = await supabase
    .from('events')
    .update({
      status: 'active',
      is_published: true,
      host_user_id: current.created_by_user_id,
    })
    .eq('id', eventId)
    .eq('status', 'submitted_for_review')
    .select(
      'id, title, description, city, venue_hint, starts_at, registration_deadline, max_capacity, status, is_published, created_at, updated_at, created_by_user_id, host_user_id, creator:profiles!events_created_by_user_id_fkey(full_name, email, phone)',
    )
    .single();

  if (error) {
    throw mapAdminEventRequestError(error.message);
  }

  const row = data as AdminSubmittedEventRequestQueryRow;
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    city: row.city,
    venue_hint: row.venue_hint ?? null,
    starts_at: row.starts_at,
    registration_deadline: row.registration_deadline ?? null,
    max_capacity: row.max_capacity ?? null,
    status: row.status,
    is_published: row.is_published,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by_user_id: row.created_by_user_id ?? null,
    host_user_id: row.host_user_id ?? null,
    creator: parseProfile(row.creator),
  };
}

export async function rejectSubmittedEventRequest(eventId: string) {
  const { data, error } = await supabase
    .from('events')
    .update({
      status: 'rejected',
      is_published: false,
      host_user_id: null,
    })
    .eq('id', eventId)
    .eq('status', 'submitted_for_review')
    .select(
      'id, title, description, city, venue_hint, starts_at, registration_deadline, max_capacity, status, is_published, created_at, updated_at, created_by_user_id, host_user_id, creator:profiles!events_created_by_user_id_fkey(full_name, email, phone)',
    )
    .single();

  if (error) {
    throw mapAdminEventRequestError(error.message);
  }

  const row = data as AdminSubmittedEventRequestQueryRow;
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    city: row.city,
    venue_hint: row.venue_hint ?? null,
    starts_at: row.starts_at,
    registration_deadline: row.registration_deadline ?? null,
    max_capacity: row.max_capacity ?? null,
    status: row.status,
    is_published: row.is_published,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by_user_id: row.created_by_user_id ?? null,
    host_user_id: row.host_user_id ?? null,
    creator: parseProfile(row.creator),
  };
}

export async function listAdminApplicantsForEvent(eventId: string): Promise<AdminApplicantReview[]> {
  const { data, error } = await supabase
    .from('event_registrations')
    .select(
      'id, user_id, status, created_at, offered_at, expires_at, questionnaire_completed, application_answers, selection_batch_id, selection_outcome, selection_rank, profile:profiles(full_name, email, phone)',
    )
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return ((data ?? []) as AdminApplicantQueryRow[])
    .filter(
      (row): row is AdminApplicantQueryRow =>
        Boolean(
          row
          && typeof row.id === 'string'
          && typeof row.user_id === 'string'
          && typeof row.status === 'string'
          && typeof row.created_at === 'string',
        ),
    )
    .map((row) => ({
      id: row.id,
      user_id: row.user_id,
      status: row.status,
      created_at: row.created_at,
      offered_at: row.offered_at ?? null,
      expires_at: row.expires_at ?? null,
      questionnaire_completed: row.questionnaire_completed === true,
      application_answers: row.application_answers ?? null,
      profile: parseProfile(row.profile),
      selection_batch_id: row.selection_batch_id ?? null,
      selection_outcome: row.selection_outcome ?? null,
      selection_rank: row.selection_rank ?? null,
    }));
}

export async function recordEventSelectionOutputForOperator(
  eventId: string,
  selectedRegistrationIds: string[],
  waitlistRegistrationIds: string[],
) {
  const { data, error } = await supabase.rpc('record_event_selection_output', {
    p_event_id: eventId,
    p_selected_registration_ids: selectedRegistrationIds,
    p_waitlist_registration_ids: waitlistRegistrationIds,
  });

  if (error) {
    throw mapAdminSelectionError(error.message);
  }

  const row = Array.isArray(data) ? data[0] : null;
  return {
    selection_batch_id:
      row && typeof row.selection_batch_id === 'string' ? row.selection_batch_id : null,
    selected_count: row && typeof row.selected_count === 'number' ? row.selected_count : 0,
    waitlist_count: row && typeof row.waitlist_count === 'number' ? row.waitlist_count : 0,
  };
}

export async function offerTemporarySpot(registrationId: string, timeoutHours = 24) {
  const { error } = await supabase.rpc('offer_registration_with_timeout', {
    p_registration_id: registrationId,
    p_timeout_hours: timeoutHours,
  });

  if (error) {
    throw mapAdminOfferError(error.message);
  }
}

export async function adminMarkAttended(registrationId: string) {
  const { error } = await supabase.rpc('admin_mark_attended', {
    p_registration_id: registrationId,
  });

  if (error) {
    throw mapAdminOfferError(error.message);
  }
}

export async function expireOffersAndPrepareRefillForEvent(eventId: string) {
  const { data, error } = await supabase.rpc('expire_offers_and_prepare_refill', {
    p_event_id: eventId,
  });

  if (error) {
    throw mapAdminOfferError(error.message);
  }

  const result = Array.isArray(data) ? data[0] : null;

  return {
    expired_count:
      result && typeof result.expired_count === 'number'
        ? result.expired_count
        : 0,
    prepared_offer_count:
      result && typeof result.prepared_offer_count === 'number'
        ? result.prepared_offer_count
        : 0,
  };
}
