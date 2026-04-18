import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
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
    let active = true;
    async function load() {
      setLoading(true);
      setSubmittedError(null);
      try {
        const req = await listAdminSubmittedEventRequests();
        if (!active) return;
        setSubmittedRequests(req);
      } catch {
        if (!active) return;
        setSubmittedError('Failed to load submitted requests.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
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
      setActionMessage(`Approved and published: "${request.title}".`);
    } catch (e) {
      setActionError(e instanceof AdminEventRequestActionError ? e.message : 'Approve failed.');
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
      setActionMessage(`Rejected: "${request.title}".`);
    } catch (e) {
      setActionError(e instanceof AdminEventRequestActionError ? e.message : 'Reject failed.');
    } finally {
      setRequestActionId(null);
    }
  }

  return (
    <PageShell
      variant="minimal"
      title="Host event requests"
      subtitle="Approve a submitted request to publish the gathering, or reject it."
    >
      <Card className={tokens.card.surface}>
        <CardHeader>
          <CardTitle className="text-xl">Submitted for review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {loading ? (
            <p>Loading…</p>
          ) : submittedError ? (
            <p className="text-destructive">{submittedError}</p>
          ) : submittedRequests.length === 0 ? (
            <p>אין כרגע בקשות ממתינות לאישור.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {submittedRequests.map((request) => (
                <div key={request.id} className={tokens.card.inner + ' space-y-2 p-4'}>
                  <p className="font-medium text-foreground">{request.title}</p>
                  <p>{formatEventStatus(request.status)}</p>
                  <p>Creator: {request.creator?.full_name || request.creator?.email || request.created_by_user_id}</p>
                  <p>Starts: {formatEventDate(request.starts_at)}</p>
                  <p>
                    Deadline: {request.registration_deadline ? formatEventDate(request.registration_deadline) : '—'}
                  </p>
                  <p>City: {request.city}</p>
                  <p>Capacity: {request.max_capacity ?? '—'}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={requestActionId === request.id}
                      onClick={() => void handleApprove(request)}
                    >
                      {requestActionId === request.id ? '…' : 'Approve & publish'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={requestActionId === request.id}
                      onClick={() => void handleReject(request)}
                    >
                      Reject
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
