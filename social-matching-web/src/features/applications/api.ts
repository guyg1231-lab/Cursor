import { supabase } from '@/integrations/supabase/client';
import type {
  ApplicationConfirmErrorReason,
  ApplicationSubmitErrorReason,
  PersistedApplicationAnswers,
  ApplicationSubmissionResult,
  EventRegistrationRow,
  MatchingResponseRow,
} from '@/features/applications/types';
import type { VisibleEvent } from '@/features/events/types';
import type { Database } from '@/integrations/supabase/types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type RegistrationRpcResult = Database['public']['Functions']['register_or_reregister_with_email']['Returns'][number];

type ReadyFunnelStatus =
  | 'ready_for_registration'
  | 'registration_pending'
  | 'registration_waitlist'
  | 'registration_approved'
  | 'registration_rejected'
  | 'registration_cancelled'
  | 'attended'
  | 'no_show';

const READY_FUNNEL_STATUSES = new Set<ReadyFunnelStatus>([
  'ready_for_registration',
  'registration_pending',
  'registration_waitlist',
  'registration_approved',
  'registration_rejected',
  'registration_cancelled',
  'attended',
  'no_show',
]);

export class ApplicationSubmitError extends Error {
  reason: ApplicationSubmitErrorReason;

  constructor(reason: ApplicationSubmitErrorReason, message: string) {
    super(message);
    this.name = 'ApplicationSubmitError';
    this.reason = reason;
  }
}

export class ApplicationConfirmError extends Error {
  reason: ApplicationConfirmErrorReason;

  constructor(reason: ApplicationConfirmErrorReason, message: string) {
    super(message);
    this.name = 'ApplicationConfirmError';
    this.reason = reason;
  }
}

export function parsePersistedApplicationAnswers(value: unknown): PersistedApplicationAnswers | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  if (
    typeof record.why_this_event !== 'string'
    || typeof record.desired_outcome !== 'string'
    || typeof record.what_you_bring !== 'string'
    || typeof record.understand_payment !== 'boolean'
    || typeof record.commit_on_time !== 'boolean'
    || typeof record.submitted_at !== 'string'
  ) {
    return null;
  }

  return {
    why_this_event: record.why_this_event,
    desired_outcome: record.desired_outcome,
    what_you_bring: record.what_you_bring,
    host_note: typeof record.host_note === 'string' ? record.host_note : null,
    understand_payment: record.understand_payment,
    commit_on_time: record.commit_on_time,
    submitted_at: record.submitted_at,
  };
}

/**
 * Temporary MVP readiness rule for the new app:
 * A user is considered ready to apply if either:
 * 1. `matching_responses.completed_at` exists, or
 * 2. `profiles.funnel_status` is already beyond `needs_questionnaire` in the legacy flow.
 *
 * This is a temporary compatibility rule for the new app block, not a final long-term domain rule.
 */
export async function getQuestionnaireReadyState(userId: string): Promise<{
  ready: boolean;
  response: MatchingResponseRow | null;
  profile: Pick<ProfileRow, 'funnel_status'> | null;
}> {
  const [{ data: response, error: responseError }, { data: profile, error: profileError }] = await Promise.all([
    supabase.from('matching_responses').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('profiles').select('funnel_status').eq('id', userId).maybeSingle(),
  ]);

  if (responseError) throw responseError;
  if (profileError) throw profileError;

  const readyByResponse = !!response?.completed_at;
  const readyByProfile = !!profile?.funnel_status && READY_FUNNEL_STATUSES.has(profile.funnel_status as ReadyFunnelStatus);

  return {
    ready: readyByResponse || readyByProfile,
    response: response ?? null,
    profile: profile ?? null,
  };
}

export async function getExistingApplication(eventId: string, userId: string): Promise<EventRegistrationRow | null> {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function listExistingApplicationsForUser(eventIds: string[], userId: string): Promise<EventRegistrationRow[]> {
  if (eventIds.length === 0) return [];

  const { data, error } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('user_id', userId)
    .in('event_id', eventIds);

  if (error) throw error;
  return data ?? [];
}

function mapRegistrationRpcError(error: { message?: string } | null | undefined) {
  const message = error?.message ?? 'Registration failed';

  if (/authentication required/i.test(message)) {
    return new ApplicationSubmitError('unauthenticated', message);
  }

  if (/event is full/i.test(message)) {
    return new ApplicationSubmitError('event_full', message);
  }

  if (/registration deadline has passed|event is not accepting registrations/i.test(message)) {
    return new ApplicationSubmitError('event_closed', message);
  }

  if (/event has already started/i.test(message)) {
    return new ApplicationSubmitError('event_started', message);
  }

  if (/only admins can change registration status/i.test(message)) {
    return new ApplicationSubmitError('already_applied', message);
  }

  return new ApplicationSubmitError('unknown', message);
}

function mapConfirmRegistrationError(error: { message?: string } | null | undefined) {
  const message = error?.message ?? 'Confirmation failed';

  if (/authentication required|unauthorized request/i.test(message)) {
    return new ApplicationConfirmError('unauthenticated', message);
  }

  if (/forbidden_registration_confirmation|forbidden_registration_decline|forbidden/i.test(message)) {
    return new ApplicationConfirmError('forbidden', message);
  }

  if (/offer has expired/i.test(message)) {
    return new ApplicationConfirmError('offer_expired', message);
  }

  if (/registration is not awaiting a response/i.test(message)) {
    return new ApplicationConfirmError('not_awaiting_response', message);
  }

  return new ApplicationConfirmError('unknown', message);
}

export async function createApplication(params: {
  event: VisibleEvent;
  userId: string;
  questionnaireResponse?: Pick<MatchingResponseRow, 'birth_date' | 'social_link'> | null;
  applicationAnswers: PersistedApplicationAnswers;
}): Promise<ApplicationSubmissionResult> {
  const { data, error } = await supabase.rpc('register_or_reregister_with_email', {
    p_event_id: params.event.id,
    p_birth_date: params.questionnaireResponse?.birth_date ?? null,
    p_social_link: params.questionnaireResponse?.social_link ?? null,
    p_application_answers: params.applicationAnswers,
  });

  if (error) {
    throw mapRegistrationRpcError(error);
  }

  const rpcResult = (Array.isArray(data) ? data[0] : data) as RegistrationRpcResult | null | undefined;
  const registration = await getExistingApplication(params.event.id, params.userId);

  if (!registration) {
    throw new ApplicationSubmitError('unknown', 'Registration succeeded but could not be reloaded.');
  }

  return {
    registration,
    mode: rpcResult?.is_new === false ? 're_registered' : 'created',
  };
}

export async function confirmRegistrationResponse(params: {
  registrationId: string;
  eventId: string;
  userId: string;
}) {
  const { error } = await supabase.rpc('confirm_registration_response', {
    p_registration_id: params.registrationId,
  });

  if (error) {
    throw mapConfirmRegistrationError(error);
  }

  const registration = await getExistingApplication(params.eventId, params.userId);
  if (!registration) {
    throw new ApplicationConfirmError('unknown', 'Confirmation succeeded but the registration could not be reloaded.');
  }

  return registration;
}

export async function declineRegistrationResponse(params: {
  registrationId: string;
  eventId: string;
  userId: string;
}) {
  const { error } = await supabase.rpc('decline_registration_response', {
    p_registration_id: params.registrationId,
  });

  if (error) {
    throw mapConfirmRegistrationError(error);
  }

  const registration = await getExistingApplication(params.eventId, params.userId);
  if (!registration) {
    throw new ApplicationConfirmError('unknown', 'Decline succeeded but the registration could not be reloaded.');
  }

  return registration;
}
