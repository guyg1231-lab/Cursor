import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { tokens } from '@/lib/design-tokens';
import {
  adminMarkAttended,
  getOperatorEvent,
  listAdminApplicantsForEvent,
  offerTemporarySpot,
  recordEventSelectionOutputForOperator,
} from '@/features/admin/api';
import type { AdminApplicantReview, OperatorEventDetail } from '@/features/admin/types';
import { formatEventDate } from '@/features/events/formatters';
import { formatLifecycleDateTime } from '@/features/applications/status';

const SLICE_COHORT_SIZE = 4;
const INVITATION_TIMEOUT_HOURS = 48;

export function TeamGatheringPage() {
  const { eventId } = useParams();

  const [event, setEvent] = useState<OperatorEventDetail | null>(null);
  const [rows, setRows] = useState<AdminApplicantReview[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSendingInvitations, setIsSendingInvitations] = useState(false);
  const [isMarkingAttended, setIsMarkingAttended] = useState(false);

  const loadData = useCallback(async () => {
    if (!eventId) {
      setLoadError('לא נמצא מזהה מפגש.');
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    setLoadError(null);

    try {
      const [eventDetail, applicants] = await Promise.all([
        getOperatorEvent(eventId),
        listAdminApplicantsForEvent(eventId),
      ]);
      setEvent(eventDetail);
      setRows(applicants);
    } catch {
      setLoadError('לא הצלחנו לטעון את המפגש כרגע.');
    } finally {
      setPageLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const cohortSizeOk = rows.length === SLICE_COHORT_SIZE;
  const allPending = cohortSizeOk && rows.every((row) => row.status === 'pending');
  const allConfirmed = cohortSizeOk && rows.every((row) => row.status === 'confirmed');

  async function handleSendInvitations() {
    if (!eventId || !allPending) return;

    setIsSendingInvitations(true);
    setActionError(null);
    setInfoMessage(null);

    try {
      const ids = rows.map((row) => row.id);
      await recordEventSelectionOutputForOperator(eventId, ids, []);
      for (const id of ids) {
        await offerTemporarySpot(id, INVITATION_TIMEOUT_HOURS);
      }
      await loadData();
      setInfoMessage('ההזמנות נשלחו. כל 4 ההרשמות עברו למצב awaiting_response.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'לא הצלחנו לשלוח את ההזמנות כרגע.';
      setActionError(message);
    } finally {
      setIsSendingInvitations(false);
    }
  }

  async function handleMarkAttended() {
    if (!allConfirmed) return;

    setIsMarkingAttended(true);
    setActionError(null);
    setInfoMessage(null);

    try {
      for (const row of rows) {
        await adminMarkAttended(row.id);
      }
      await loadData();
      setInfoMessage('כל 4 ההרשמות סומנו כ-attended.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'לא הצלחנו לסמן הגעה כרגע.';
      setActionError(message);
    } finally {
      setIsMarkingAttended(false);
    }
  }

  if (pageLoading) {
    return (
      <PageShell title="ניהול מפגש" subtitle="טוענים את נתוני המפגש...">
        <Card className={tokens.card.surface}>
          <CardContent className="py-10 text-sm text-muted-foreground">טוענים...</CardContent>
        </Card>
      </PageShell>
    );
  }

  if (loadError) {
    return (
      <PageShell title="ניהול מפגש" subtitle="לא הצלחנו לטעון את המפגש כרגע.">
        <Card className={tokens.card.surface}>
          <CardContent className="py-10 text-sm text-destructive">{loadError}</CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!event) {
    return (
      <PageShell title="המפגש לא נמצא" subtitle="יכול להיות שהקישור אינו תקין.">
        <Card className={tokens.card.surface}>
          <CardContent className="py-8 text-sm text-muted-foreground">
            לא מצאנו מפגש שמתאים לקישור הזה.
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={event.title}
      subtitle={`ניהול מפגש · ${event.city} · ${formatEventDate(event.starts_at)}`}
    >
      <Card className={tokens.card.surface}>
        <CardHeader>
          <CardTitle className="text-xl">רשימת הנרשמים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {infoMessage ? <p className="text-sm text-primary">{infoMessage}</p> : null}
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              disabled={!allPending || isSendingInvitations || isMarkingAttended}
              onClick={() => void handleSendInvitations()}
            >
              {isSendingInvitations ? 'שולחים...' : 'שליחת הזמנות'}
            </Button>
            <Button
              variant="outline"
              disabled={!allConfirmed || isSendingInvitations || isMarkingAttended}
              onClick={() => void handleMarkAttended()}
            >
              {isMarkingAttended ? 'מסמנים...' : 'סימון הגעה'}
            </Button>
            <p className="text-xs text-muted-foreground">
              סה״כ רשומים: {rows.length} · דרושים {SLICE_COHORT_SIZE} במצב pending לשליחת הזמנות
              · ודרושים {SLICE_COHORT_SIZE} במצב confirmed לסימון הגעה.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-border/60">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-background/40 text-foreground">
                <tr className="text-start">
                  <th className="px-4 py-3 text-start font-medium">שם מלא</th>
                  <th className="px-4 py-3 text-start font-medium">טלפון</th>
                  <th className="px-4 py-3 text-start font-medium">registration_id</th>
                  <th className="px-4 py-3 text-start font-medium">status</th>
                  <th className="px-4 py-3 text-start font-medium">expires_at</th>
                </tr>
              </thead>
              <tbody className="text-foreground/90">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-muted-foreground text-center">
                      עדיין אין רשומות עבור המפגש הזה.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-t border-border/40">
                      <td className="px-4 py-3">{row.profile?.full_name ?? '—'}</td>
                      <td className="px-4 py-3">{row.profile?.phone ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs">{row.id}</td>
                      <td className="px-4 py-3">{row.status}</td>
                      <td className="px-4 py-3">
                        {row.expires_at ? formatLifecycleDateTime(row.expires_at) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
