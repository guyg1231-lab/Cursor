import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { RouteEmptyState, RouteErrorState, RouteLoadingState } from '@/components/shared/RouteState';
import { tokens } from '@/lib/design-tokens';
import {
  AdminEventRequestActionError,
  approveSubmittedEventRequest,
  listAdminSubmittedEventRequests,
  rejectSubmittedEventRequest,
} from '@/features/admin/api';
import type { AdminSubmittedEventRequest } from '@/features/admin/types';
import { formatEventDate, formatEventStatus } from '@/features/events/formatters';

/**
 * Admin-review slice: the single screen that takes a host-submitted event from
 * `status=submitted_for_review` to `status=active, is_published=true` (or to
 * `status=rejected`). Uses the existing `events_update_admin` RLS policy via
 * `approveSubmittedEventRequest` / `rejectSubmittedEventRequest`. No new DB
 * surface, no new RPCs.
 */
export function AdminEventRequestsPage() {
  const [submittedRequests, setSubmittedRequests] = useState<AdminSubmittedEventRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittedError, setSubmittedError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [requestActionId, setRequestActionId] = useState<string | null>(null);

  useEffect(() => {
    let stale = false;
    async function load() {
      setLoading(true);
      setSubmittedError(null);
      try {
        const req = await listAdminSubmittedEventRequests();
        if (stale) return;
        setSubmittedRequests(req);
      } catch {
        if (stale) return;
        setSubmittedError('לא הצלחנו לטעון בקשות שנשלחו לבדיקה.');
      } finally {
        if (!stale) setLoading(false);
      }
    }
    void load();
    return () => {
      stale = true;
    };
  }, []);

  async function refreshRequests() {
    const req = await listAdminSubmittedEventRequests();
    setSubmittedRequests(req);
  }

  async function handleApprove(request: AdminSubmittedEventRequest) {
    setRequestActionId(request.id);
    setActionError(null);
    setActionMessage(null);
    try {
      await approveSubmittedEventRequest(request.id);
      await refreshRequests();
      setActionMessage(`הבקשה אושרה ופורסמה: "${request.title}".`);
    } catch (e) {
      setActionError(e instanceof AdminEventRequestActionError ? e.message : 'האישור נכשל.');
    } finally {
      setRequestActionId(null);
    }
  }

  async function handleReject(request: AdminSubmittedEventRequest) {
    setRequestActionId(request.id);
    setActionError(null);
    setActionMessage(null);
    try {
      await rejectSubmittedEventRequest(request.id);
      await refreshRequests();
      setActionMessage(`הבקשה נדחתה: "${request.title}".`);
    } catch (e) {
      setActionError(e instanceof AdminEventRequestActionError ? e.message : 'הדחייה נכשלה.');
    } finally {
      setRequestActionId(null);
    }
  }

  return (
    <PageShell
      variant="minimal"
      title="בקשות מארחים"
      subtitle="אישור בקשה מפרסם את המפגש; דחייה סוגרת את הבקשה."
    >
      <Card data-testid="admin-event-requests-review-queue" className={tokens.card.surface}>
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-[-0.015em]">נשלח לבדיקה</CardTitle>
          <CardDescription data-testid="admin-event-requests-queue-description" className="text-sm text-muted-foreground">
            תור הבדיקה: מוצגות כאן בקשות בסטטוס &quot;נשלח לאישור&quot;; אישור מפרסם, דחייה סוגרת את הבקשה.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {loading ? (
            <RouteLoadingState title="טוענים בקשות..." body="אוספים בקשות מארחים שממתינות לבדיקה." />
          ) : submittedError ? (
            <RouteErrorState title="שגיאת טעינה" body={submittedError} />
          ) : submittedRequests.length === 0 ? (
            <RouteEmptyState title="אין כרגע בקשות ממתינות" body="בקשות חדשות יופיעו כאן אוטומטית." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {submittedRequests.map((request) => (
                <div
                  key={request.id}
                  data-testid={`admin-event-request-${request.id}`}
                  className={tokens.card.inner + ' space-y-2 p-4'}
                >
                  <p className="font-medium text-foreground">{request.title}</p>
                  <p>{formatEventStatus(request.status)}</p>
                  <p>יוצר/ת: {request.creator?.full_name || request.creator?.email || request.created_by_user_id}</p>
                  <p>תחילה: {formatEventDate(request.starts_at)}</p>
                  <p>
                    דדליין: {request.registration_deadline ? formatEventDate(request.registration_deadline) : '—'}
                  </p>
                  <p>עיר: {request.city}</p>
                  <p>קיבולת: {request.max_capacity ?? '—'}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={requestActionId === request.id}
                      onClick={() => void handleApprove(request)}
                    >
                      {requestActionId === request.id ? '…' : 'אישור ופרסום'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={requestActionId === request.id}
                      onClick={() => void handleReject(request)}
                    >
                      דחייה
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {actionMessage ? <p className="text-primary">{actionMessage}</p> : null}
          {actionError ? <p className="text-destructive">{actionError}</p> : null}
        </CardContent>
      </Card>
    </PageShell>
  );
}
