import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { tokens } from '@/lib/design-tokens';
import { listOperatorEvents } from '@/features/admin/api';
import type { OperatorEventListRow } from '@/features/admin/types';
import { formatEventDate, formatEventStatus } from '@/features/events/formatters';

export function OperatorEventsListPage() {
  const [events, setEvents] = useState<OperatorEventListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const ev = await listOperatorEvents();
        if (!active) return;
        setEvents(ev);
      } catch {
        if (!active) return;
        setError('Failed to load events.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <PageShell
      variant="minimal"
      title="Operator — Events"
      subtitle="List, create, and open an event dashboard. Internal use only."
    >
      <div className="mb-4 flex flex-wrap gap-3">
        <Button asChild variant="default">
          <Link to="/admin/events/new">Create event</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/admin/event-requests">לבקשות מארחים ממתינות</Link>
        </Button>
      </div>

      <Card className={tokens.card.surface}>
        <CardHeader>
          <CardTitle className="text-xl">All events</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Title</th>
                    <th className="py-2 pr-4 font-medium">Starts</th>
                    <th className="py-2 pr-4 font-medium">Deadline</th>
                    <th className="py-2 pr-4 font-medium">City</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Capacity</th>
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
                          <Link to={`/admin/events/${ev.id}`}>Open</Link>
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
