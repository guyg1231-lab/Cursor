import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { RouteErrorState, RouteLoadingState } from '@/components/shared/RouteState';
import { StatusBadge } from '@/components/shared/StatusBadge';
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
import { resolveApplicationBadgeTone } from '@/features/applications/presentation';
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

const DASHBOARD_STATUS_LABELS: Record<DashboardStatus, string> = {
  pending: 'ממתין',
  waitlist: 'רשימת המתנה',
  awaiting_response: 'ממתין לתגובה',
  confirmed: 'אושר',
  approved: 'עבר אישור',
  cancelled: 'בוטל',
  other: 'אחר',
};

function applicantNote(applicant: AdminApplicantReview) {
  if (isAwaitingParticipantResponse(applicant.status)) {
    if (isOfferExpired(applicant)) {
      return applicant.expires_at
        ? `תוקף ההצעה פג ב-${formatLifecycleDateTime(applicant.expires_at)}. אפשר להריץ תפוגה/מילוי מחדש.`
        : 'תוקף ההצעה פג. אפשר להריץ תפוגה/מילוי מחדש.';
    }
    return `ממתין לתגובת משתתף/ת עד ${applicant.expires_at ? formatLifecycleDateTime(applicant.expires_at) : '—'}.`;
  }
  if (isConfirmedParticipation(applicant.status)) {
    return 'המקום אושר סופית.';
  }
  if (canManuallyOfferTemporarySpot(applicant)) {
    return 'אפשר להציע מקום זמני ידנית.';
  }
  return formatApplicationStatusDetailed(applicant.status);
}

function bucketForStatus(status: AdminApplicantReview['status']): DashboardStatus {
  if ((DASHBOARD_STATUSES as readonly string[]).includes(status)) {
    return status as DashboardStatus;
  }
  return 'other';
}

function compareSelectionOrder(a: AdminApplicantReview, b: AdminApplicantReview) {
  const rankA = a.selection_rank ?? Number.POSITIVE_INFINITY;
  const rankB = b.selection_rank ?? Number.POSITIVE_INFINITY;
  if (rankA !== rankB) return rankA - rankB;
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    window.prompt('העתקה:', text);
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
      if (!ev) setLoadError('האירוע לא נמצא או שאין הרשאה לצפות בו.');
    } catch {
      setLoadError('לא הצלחנו לטעון את האירוע.');
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
    const parts = DASHBOARD_STATUSES.map((s) => `${DASHBOARD_STATUS_LABELS[s]}: ${grouped.get(s)?.length ?? 0}`);
    parts.push(`${DASHBOARD_STATUS_LABELS.other}: ${grouped.get('other')?.length ?? 0}`);
    return parts.join(' · ');
  }, [grouped]);

  const hasSelectionBatch = useMemo(
    () => applicants.some((a) => a.selection_batch_id != null),
    [applicants],
  );

  const latestSelectionBatchId = useMemo(() => {
    const latest = applicants.find((a) => a.selection_batch_id != null);
    return latest?.selection_batch_id ?? null;
  }, [applicants]);

  const latestSelectionBatch = useMemo(() => {
    if (!latestSelectionBatchId) return null;
    const batchApplicants = applicants.filter((a) => a.selection_batch_id === latestSelectionBatchId);
    const selected = batchApplicants
      .filter((a) => a.selection_outcome === 'selected')
      .slice()
      .sort(compareSelectionOrder);
    const waitlist = batchApplicants
      .filter((a) => a.selection_outcome === 'waitlist')
      .slice()
      .sort(compareSelectionOrder);

    return { batchApplicants, selected, waitlist };
  }, [applicants, latestSelectionBatchId]);

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
      setActionMessage(`נשמרה הצעה זמנית ל-24 שעות עבור הרשמה ${a.id}.`);
    } catch (e) {
      setActionError(e instanceof AdminOfferActionError ? e.message : 'שליחת ההצעה נכשלה.');
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
          ? `נוקו ${result.expired_count} הצעות שפג תוקפן; הוכנו ${result.prepared_offer_count} שלבי מילוי מחדש.`
          : 'לא נמצאו הצעות שפג תוקפן, ולא הוכנו שלבי מילוי מחדש.',
      );
    } catch (e) {
      setActionError(e instanceof AdminOfferActionError ? e.message : 'תהליך תפוגה/מילוי מחדש נכשל.');
    } finally {
      setIsCleaningExpired(false);
    }
  }

  async function handleSelectionSave() {
    if (!eventId) return;
    const selected = parseRegistrationIdList(selectedRaw);
    const waitlist = parseRegistrationIdList(waitlistRaw);
    if (selected.length === 0 && waitlist.length === 0) {
      setActionError('צריך להזין לפחות מזהה הרשמה אחד ב-Selected או ב-Waitlist.');
      return;
    }
    setIsSavingSelection(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const out = await recordEventSelectionOutputForOperator(eventId, selected, waitlist);
      await refresh();
      setActionMessage(
        `הקצאת הקבוצה נשמרה. אצווה ${out.selection_batch_id ?? '—'} · נבחרו: ${out.selected_count}, המתנה: ${out.waitlist_count}.`,
      );
    } catch (e) {
      setActionError(e instanceof AdminSelectionActionError ? e.message : 'שמירת הבחירה נכשלה.');
    } finally {
      setIsSavingSelection(false);
    }
  }

  if (!eventId) {
    return (
      <PageShell variant="minimal" title="אופרטור" subtitle="חסר מזהה אירוע.">
        <Button asChild variant="outline">
          <Link to="/admin/events">חזרה לאירועים</Link>
        </Button>
      </PageShell>
    );
  }

  return (
    <PageShell
      variant="minimal"
      title={eventRow?.title ?? 'אירוע'}
      subtitle="דשבורד תפעולי לאירוע — פעולות מחזור חיים והרשמות."
    >
      <div className="mb-5 flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/events">← כל האירועים</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to={`/admin/events/${eventId}/diagnostics`}>דיאגנוסטיקה</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to={`/admin/events/${eventId}/audit`}>ביקורת</Link>
        </Button>
      </div>

      {loading ? (
        <div data-testid="admin-event-dashboard-skeleton" className="space-y-4" aria-hidden="true">
          <RouteLoadingState title="טוענים נתוני אירוע..." body="מושכים אירוע, הרשמות וסטטוסים." />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={`admin-dashboard-skeleton-${index}`} className={tokens.card.surface}>
                <CardHeader className="pb-3">
                  <div className="h-5 w-40 rounded-full bg-muted skeleton-shimmer" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-3 w-5/6 rounded-full bg-muted/80 skeleton-shimmer" />
                  <div className="h-3 w-3/4 rounded-full bg-muted/80 skeleton-shimmer" />
                  <div className="h-3 w-2/3 rounded-full bg-muted/80 skeleton-shimmer" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : loadError ? (
        <RouteErrorState title="שגיאת טעינה" body={loadError} />
      ) : eventRow ? (
        <>
          <Card className={tokens.card.surface}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold tracking-[-0.015em]">אירוע</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
              <p>תחילה: {formatEventDate(eventRow.starts_at)}</p>
              <p>עיר: {eventRow.city}</p>
              <p>סטטוס: {eventRow.status}</p>
              <p>פורסם: {eventRow.is_published ? 'כן' : 'לא'}</p>
              <p>קיבולת: {eventRow.max_capacity ?? '—'}</p>
              <p>דדליין: {eventRow.registration_deadline ? formatEventDate(eventRow.registration_deadline) : '—'}</p>
              <p className="md:col-span-2">
                אצוות בחירה נשמרו: <strong>{hasSelectionBatch ? 'כן' : 'לא'}</strong>
              </p>
            </CardContent>
          </Card>

          <Card className={tokens.card.surface}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold tracking-[-0.015em]">ספירות חיות</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p className="font-mono text-xs break-all">{countsLabel}</p>
            </CardContent>
          </Card>

          <Card className={tokens.card.surface}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold tracking-[-0.015em]">הקצאת קבוצה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-7">
              {latestSelectionBatch ? (
                <>
                  <p>
                    זו הקבוצה האחרונה שנשמרה לאירוע הזה. נבחרו:{' '}
                    <strong className="text-foreground">{latestSelectionBatch.selected.length}</strong> · המתנה:{' '}
                    <strong className="text-foreground">{latestSelectionBatch.waitlist.length}</strong>
                  </p>
                  <p className="font-mono text-xs break-all text-foreground/75">
                    אצווה: {latestSelectionBatchId}
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className={tokens.card.inner + ' space-y-2 p-4'}>
                      <p className="font-medium text-foreground">נבחרו לקבוצה</p>
                      {latestSelectionBatch.selected.length > 0 ? (
                        <ul className="space-y-1 text-xs text-foreground/80">
                          {latestSelectionBatch.selected.map((a) => (
                            <li key={a.id}>
                              {a.profile?.full_name || a.profile?.email || a.user_id}
                              <span className="text-muted-foreground"> · {a.id}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs">אין כרגע נבחרים באצווה הזו.</p>
                      )}
                    </div>
                    <div className={tokens.card.inner + ' space-y-2 p-4'}>
                      <p className="font-medium text-foreground">רשימת המתנה</p>
                      {latestSelectionBatch.waitlist.length > 0 ? (
                        <ul className="space-y-1 text-xs text-foreground/80">
                          {latestSelectionBatch.waitlist.map((a) => (
                            <li key={a.id}>
                              {a.profile?.full_name || a.profile?.email || a.user_id}
                              <span className="text-muted-foreground"> · {a.id}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs">אין כרגע רשימת המתנה באצווה הזו.</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p>עדיין לא נשמרה הקצאת קבוצה. כאן תופיע תמונת החדר ברגע שתישמר בחירה.</p>
              )}
            </CardContent>
          </Card>

          <section
            data-testid="admin-event-lifecycle-actions"
            aria-labelledby="admin-event-lifecycle-actions-heading"
            className="space-y-5"
          >
            <div className="space-y-1">
              <h2 id="admin-event-lifecycle-actions-heading" className="text-lg font-semibold text-foreground">
                פעולות מחזור חיים
              </h2>
              <p className="text-sm text-muted-foreground">
                בחירה מתואמת, תפוגת הצעות ומילוי מחדש — לצד שאר הבקרות למעלה.
              </p>
            </div>

            <Card className={tokens.card.surface}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold tracking-[-0.015em]">בחירת קבוצה מתוזמרת (RPC)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  מדביקים כאן מזהי הרשמה (UUID), מופרדים בפסיק/רווח/שורה חדשה. אפשר להעתיק מזהים מתוך כל שורת משתתף/ת.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void copyText(pendingAndWaitlistIds.join(', '))}
                    disabled={pendingAndWaitlistIds.length === 0}
                  >
                    העתקת כל מזהי קבוצה + המתנה
                  </Button>
                </div>
                <label className="block space-y-1">
                  <span className="text-foreground">מזהי הרשמה לנבחרי הקבוצה (Selected)</span>
                  <textarea
                    className="min-h-[88px] w-full rounded-xl border border-border bg-background/50 px-3 py-2 font-mono text-xs"
                    value={selectedRaw}
                    onChange={(e) => setSelectedRaw(e.target.value)}
                    placeholder="uuid, uuid, …"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-foreground">מזהי הרשמה לרשימת המתנה (Waitlist)</span>
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
                  {isSavingSelection ? 'שומרים...' : 'שמירת הקצאת קבוצה'}
                </Button>
              </CardContent>
            </Card>

            <Card className={tokens.card.surface}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold tracking-[-0.015em]">תפוגה / מילוי מחדש</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isCleaningExpired || expiredOfferCount === 0}
                  onClick={() => void handleExpire()}
                >
                  {isCleaningExpired
                    ? 'מריצים...'
                    : `הרצת תפוגה ומילוי מחדש${expiredOfferCount > 0 ? ` (${expiredOfferCount})` : ''}`}
                </Button>
              </CardContent>
            </Card>
          </section>

          {actionMessage ? <p className="text-sm text-primary">{actionMessage}</p> : null}
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}

          {[...DASHBOARD_STATUSES, 'other'].map((bucket) => {
            const list = grouped.get(bucket as DashboardStatus) ?? [];
            if (list.length === 0 && bucket === 'other') return null;

            return (
              <Card key={bucket} className={tokens.card.surface}>
                <CardHeader>
                  <CardTitle className="text-lg capitalize">
                    {DASHBOARD_STATUS_LABELS[bucket as DashboardStatus]} ({list.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {list.length === 0 ? (
                    <p className="text-sm text-muted-foreground">אין רשומות</p>
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
                                העתקה
                              </Button>
                            </p>
                            {a.selection_batch_id ? (
                              <p className="text-xs">
                                הקצאה: {a.selection_outcome ?? '—'} · דרגה {a.selection_rank ?? '—'}
                              </p>
                            ) : null}
                          </div>
                          <StatusBadge
                            label={formatApplicationStatusShort(a.status)}
                            tone={resolveApplicationBadgeTone(a.status)}
                          />
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
                              {offeringId === a.id ? 'שולחים...' : 'הצעת מקום זמני (24h)'}
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
