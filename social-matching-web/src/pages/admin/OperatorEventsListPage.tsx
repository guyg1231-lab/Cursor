import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { RouteEmptyState, RouteErrorState, RouteLoadingState } from '@/components/shared/RouteState';
import { tokens } from '@/lib/design-tokens';
import { listOperatorEvents } from '@/features/admin/api';
import type { OperatorEventListRow } from '@/features/admin/types';
import { formatEventDate, formatEventStatus } from '@/features/events/formatters';

export function OperatorEventsListPage() {
  const [events, setEvents] = useState<OperatorEventListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stale = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const ev = await listOperatorEvents();
        if (stale) return;
        setEvents(ev);
      } catch {
        if (stale) return;
        setError('לא הצלחנו לטעון את האירועים.');
      } finally {
        if (!stale) setLoading(false);
      }
    }
    void load();
    return () => {
      stale = true;
    };
  }, []);

  return (
    <PageShell
      variant="minimal"
      title="ניהול אירועים (אופרטור)"
      subtitle="רשימה, יצירה וכניסה לדשבורד אירוע לשימוש תפעולי פנימי."
    >
      <div className="mb-5 flex flex-wrap gap-3">
        <Button asChild variant="default">
          <Link to="/admin/events/new">יצירת אירוע</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/admin/event-requests">בקשות מארחים ממתינות</Link>
        </Button>
      </div>

      <Card className={tokens.card.surface}>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold tracking-[-0.015em]">כל האירועים</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div data-testid="admin-events-table-skeleton" className="space-y-4" aria-hidden="true">
              <div className="h-4 w-44 rounded-full bg-muted skeleton-shimmer" />
              <div className="overflow-x-auto rounded-3xl border border-border/60">
                <div className="min-w-[760px] p-4">
                  <div className="mb-3 grid grid-cols-7 gap-3">
                    {Array.from({ length: 7 }).map((_, index) => (
                      <div key={`head-${index}`} className="h-3 rounded-full bg-muted/80 skeleton-shimmer" />
                    ))}
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, rowIndex) => (
                      <div key={`row-${rowIndex}`} className="grid grid-cols-7 gap-3">
                        {Array.from({ length: 7 }).map((__, colIndex) => (
                          <div key={`cell-${rowIndex}-${colIndex}`} className="h-8 rounded-xl bg-muted/70 skeleton-shimmer" />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : error ? (
            <RouteErrorState title="שגיאת טעינה" body="לא הצלחנו לטעון את האירועים כרגע." />
          ) : events.length === 0 ? (
            <RouteEmptyState title="אין עדיין אירועים" body="אירועים חדשים יופיעו כאן אחרי יצירה." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">כותרת</th>
                    <th className="py-2 pr-4 font-medium">תחילה</th>
                    <th className="py-2 pr-4 font-medium">דדליין</th>
                    <th className="py-2 pr-4 font-medium">עיר</th>
                    <th className="py-2 pr-4 font-medium">סטטוס</th>
                    <th className="py-2 pr-4 font-medium">קיבולת</th>
                    <th className="py-2 font-medium"> </th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.id} className="border-b border-border/60">
                      <td className="py-2 pr-4 text-foreground">{ev.title}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{formatEventDate(ev.starts_at)}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {ev.registration_deadline ? formatEventDate(ev.registration_deadline) : '—'}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">{ev.city}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{formatEventStatus(ev.status)}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{ev.max_capacity ?? '—'}</td>
                      <td className="py-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/admin/events/${ev.id}`}>פתיחה</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
