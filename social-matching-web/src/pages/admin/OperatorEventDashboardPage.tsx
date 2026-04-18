import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { tokens } from '@/lib/design-tokens';
import {
  AdminOfferActionError,
  AdminSelectionActionError,
  expireOffersAndPrepareRefillForEvent,
  getOperatorEvent,
  listAdminApplicantsForEvent,
  offerTemporarySpot,
  parseRegistrationIdList,
  recordEventSelectionOutputForOperator,
} from '@/features/admin/api';
import type { AdminApplicantReview } from '@/features/admin/types';
import { formatEventDate } from '@/features/events/formatters';
import {
  canManuallyOfferTemporarySpot,
  formatApplicationStatusDetailed,
  formatApplicationStatusShort,
  formatLifecycleDateTime,
  isAwaitingParticipantResponse,
  isConfirmedParticipation,
  isOfferExpired,
} from '@/features/applications/status';

const DASHBOARD_STATUSES = [
  'pending',
  'waitlist',
  'awaiting_response',
  'confirmed',
  'approved',
  'cancelled',
] as const;

type DashboardStatus = (typeof DASHBOARD_STATUSES)[number] | 'other';

function applicantNote(applicant: AdminApplicantReview) {
  if (isAwaitingParticipantResponse(applicant.status)) {
    if (isOfferExpired(applicant)) {
      return applicant.expires_at
        ? `Offer expired at ${formatLifecycleDateTime(applicant.expires_at)}. Run expiry/refill.`
        : 'Offer expired. Run expiry/refill.';
    }
    return `Awaiting response until ${applicant.expires_at ? formatLifecycleDateTime(applicant.expires_at) : '—'}.`;
  }
  if (isConfirmedParticipation(applicant.status)) {
    return 'Committed seat.';
  }
  if (canManuallyOfferTemporarySpot(applicant)) {
    return 'Eligible for temporary offer (manual).';
  }
  return formatApplicationStatusDetailed(applicant.status);
}

function bucketForStatus(status: AdminApplicantReview['status']): DashboardStatus {
  if ((DASHBOARD_STATUSES as readonly string[]).includes(status)) {
    return status as DashboardStatus;
  }
  return 'other';
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    window.prompt('Copy:', text);
  }
}

export function OperatorEventDashboardPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [eventRow, setEventRow] = useState<Awaited<ReturnType<typeof getOperatorEvent>>>(null);
  const [applicants, setApplicants] = useState<AdminApplicantReview[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [offeringId, setOfferingId] = useState<string | null>(null);
  const [isCleaningExpired, setIsCleaningExpired] = useState(false);
  const [selectedRaw, setSelectedRaw] = useState('');
  const [waitlistRaw, setWaitlistRaw] = useState('');
  const [isSavingSelection, setIsSavingSelection] = useState(false);

  const refresh = useCallback(async () => {
    if (!eventId) return;
    setLoadError(null);
    setLoading(true);
    try {
      const [ev, apps] = await Promise.all([getOperatorEvent(eventId), listAdminApplicantsForEvent(eventId)]);
      setEventRow(ev);
      setApplicants(apps);
      if (!ev) setLoadError('Event not found or not accessible.');
    } catch {
      setLoadError('Failed to load event.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const grouped = useMemo(() => {
    const map = new Map<DashboardStatus, AdminApplicantReview[]>();
    for (const s of [...DASHBOARD_STATUSES, 'other' as const]) {
      map.set(s, []);
    }
    for (const a of applicants) {
      const b = bucketForStatus(a.status);
      map.get(b)!.push(a);
    }
    return map;
  }, [applicants]);

  const countsLabel = useMemo(() => {
    const parts = DASHBOARD_STATUSES.map((s) => `${s}: ${grouped.get(s)?.length ?? 0}`);
    parts.push(`other: ${grouped.get('other')?.length ?? 0}`);
    return parts.join(' · ');
  }, [grouped]);

  const hasSelectionBatch = useMemo(
    () => applicants.some((a) => a.selection_batch_id != null),
    [applicants],
  );

  const expiredOfferCount = useMemo(
    () => applicants.filter((a) => isAwaitingParticipantResponse(a.status) && isOfferExpired(a)).length,
    [applicants],
  );

  const pendingAndWaitlistIds = useMemo(
    () =>
      applicants
        .filter((a) => a.status === 'pending' || a.status === 'waitlist')
        .map((a) => a.id),
    [applicants],
  );

  async function handleOffer(a: AdminApplicantReview) {
    if (!eventId) return;
    setOfferingId(a.id);
    setActionError(null);
    setActionMessage(null);
    try {
      await offerTemporarySpot(a.id, 24);
      await refresh();
      setActionMessage(`Temporary offer saved (24h) for registration ${a.id}.`);
    } catch (e) {
      setActionError(e instanceof AdminOfferActionError ? e.message : 'Offer failed.');
    } finally {
      setOfferingId(null);
    }
  }

  async function handleExpire() {
    if (!eventId) return;
    setIsCleaningExpired(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const result = await expireOffersAndPrepareRefillForEvent(eventId);
      await refresh();
      setActionMessage(
        result.expired_count > 0
          ? `Expired ${result.expired_count} offer(s); prepared ${result.prepared_offer_count} refill step(s).`
          : 'No expired offers to clean; no refill steps prepared.',
      );
    } catch (e) {
      setActionError(e instanceof AdminOfferActionError ? e.message : 'Expire/refill failed.');
    } finally {
      setIsCleaningExpired(false);
    }
  }

  async function handleSelectionSave() {
    if (!eventId) return;
    const selected = parseRegistrationIdList(selectedRaw);
    const waitlist = parseRegistrationIdList(waitlistRaw);
    if (selected.length === 0 && waitlist.length === 0) {
      setActionError('Enter at least one registration UUID in selected or waitlist (comma / space / newline separated).');
      return;
    }
    setIsSavingSelection(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const out = await recordEventSelectionOutputForOperator(eventId, selected, waitlist);
      await refresh();
      setActionMessage(
        `Selection saved. Batch ${out.selection_batch_id ?? '—'} · selected: ${out.selected_count}, waitlist: ${out.waitlist_count}.`,
      );
    } catch (e) {
      setActionError(e instanceof AdminSelectionActionError ? e.message : 'Selection RPC failed.');
    } finally {
      setIsSavingSelection(false);
    }
  }

  if (!eventId) {
    return (
      <PageShell variant="minimal" title="Operator" subtitle="Missing event id.">
        <Button asChild variant="outline">
          <Link to="/admin/events">Back to events</Link>
        </Button>
      </PageShell>
    );
  }

  return (
    <PageShell
      variant="minimal"
      title={eventRow?.title ?? 'Event'}
      subtitle="Operator dashboard — curated lifecycle actions only."
    >
      <div className="mb-4 flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/events">← All events</Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : eventRow ? (
        <>
          <Card className={tokens.card.surface}>
            <CardHeader>
              <CardTitle className="text-lg">Event</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
              <p>Starts: {formatEventDate(eventRow.starts_at)}</p>
              <p>City: {eventRow.city}</p>
              <p>Status: {eventRow.status}</p>
              <p>Published: {eventRow.is_published ? 'yes' : 'no'}</p>
              <p>Capacity: {eventRow.max_capacity ?? '—'}</p>
              <p>Deadline: {eventRow.registration_deadline ? formatEventDate(eventRow.registration_deadline) : '—'}</p>
              <p className="md:col-span-2">
                Selection batch recorded: <strong>{hasSelectionBatch ? 'yes' : 'no'}</strong>
              </p>
            </CardContent>
          </Card>

          <Card className={tokens.card.surface}>
            <CardHeader>
              <CardTitle className="text-lg">Live counts</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p className="font-mono text-xs break-all">{countsLabel}</p>
            </CardContent>
          </Card>

          <Card className={tokens.card.surface}>
            <CardHeader>
              <CardTitle className="text-lg">Orchestrated selection (RPC)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Paste registration UUIDs below (commas, spaces, or newlines). IDs are shown on each participant row —
                use Copy.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void copyText(pendingAndWaitlistIds.join(', '))}
                  disabled={pendingAndWaitlistIds.length === 0}
                >
                  Copy all pending + waitlist IDs
                </Button>
              </div>
              <label className="block space-y-1">
                <span className="text-foreground">Selected registration IDs</span>
                <textarea
                  className="min-h-[88px] w-full rounded-xl border border-border bg-background/50 px-3 py-2 font-mono text-xs"
                  value={selectedRaw}
                  onChange={(e) => setSelectedRaw(e.target.value)}
                  placeholder="uuid, uuid, …"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-foreground">Waitlist registration IDs</span>
                <textarea
                  className="min-h-[88px] w-full rounded-xl border border-border bg-background/50 px-3 py-2 font-mono text-xs"
                  value={waitlistRaw}
                  onChange={(e) => setWaitlistRaw(e.target.value)}
                  placeholder="uuid, uuid, …"
                />
              </label>
              <Button
                type="button"
                variant="default"
                disabled={isSavingSelection}
                onClick={() => void handleSelectionSave()}
              >
                {isSavingSelection ? 'Saving…' : 'Save selection (record_event_selection_output)'}
              </Button>
            </CardContent>
          </Card>

          <Card className={tokens.card.surface}>
            <CardHeader>
              <CardTitle className="text-lg">Expiry / refill</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isCleaningExpired || expiredOfferCount === 0}
                onClick={() => void handleExpire()}
              >
                {isCleaningExpired
                  ? 'Running…'
                  : `Run expire_offers_and_prepare_refill${expiredOfferCount > 0 ? ` (${expiredOfferCount})` : ''}`}
              </Button>
            </CardContent>
          </Card>

          {actionMessage ? <p className="text-sm text-primary">{actionMessage}</p> : null}
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}

          {[...DASHBOARD_STATUSES, 'other'].map((bucket) => {
            const list = grouped.get(bucket as DashboardStatus) ?? [];
            if (list.length === 0 && bucket === 'other') return null;

            return (
              <Card key={bucket} className={tokens.card.surface}>
                <CardHeader>
                  <CardTitle className="text-lg capitalize">
                    {bucket.replace('_', ' ')} ({list.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {list.length === 0 ? (
                    <p className="text-sm text-muted-foreground">None</p>
                  ) : (
                    list.map((a) => (
                      <div
                        key={a.id}
                        className={tokens.card.inner + ' space-y-2 border border-border/60 p-4 text-sm'}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">
                              {a.profile?.full_name || a.profile?.email || a.user_id}
                            </p>
                            <p className="font-mono text-xs break-all">
                              registration_id: {a.id}
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="ml-2 h-7 px-2 text-xs"
                                onClick={() => void copyText(a.id)}
                              >
                                Copy
                              </Button>
                            </p>
                            {a.selection_batch_id ? (
                              <p className="text-xs">
                                selection: {a.selection_outcome ?? '—'} rank {a.selection_rank ?? '—'}
                              </p>
                            ) : null}
                          </div>
                          <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs">
                            {formatApplicationStatusShort(a.status)}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{applicantNote(a)}</p>
                        <div className="flex flex-wrap gap-2">
                          {canManuallyOfferTemporarySpot(a) ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="default"
                              disabled={offeringId === a.id}
                              onClick={() => void handleOffer(a)}
                            >
                              {offeringId === a.id ? 'Offering…' : 'Offer temporary spot (24h)'}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </>
      ) : null}
    </PageShell>
  );
}
