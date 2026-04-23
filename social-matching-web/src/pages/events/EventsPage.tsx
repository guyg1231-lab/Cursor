import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { PageShell } from '@/components/shared/PageShell';
import { RouteEmptyState, RouteErrorState, RouteLoadingState } from '@/components/shared/RouteState';
import { listVisibleEvents } from '@/features/events/api';
import { EventSummaryCard } from '@/features/events/components/EventSummaryCard';
import type { VisibleEvent } from '@/features/events/types';
import { tokens } from '@/lib/design-tokens';

/**
 * Discovery page: lists active published events. Each card links to the
 * canonical `/events/:eventId` detail route via the shared `EventSummaryCard`.
 * No filters, search, sorting, categories, participant counts, or host names
 * — intentionally.
 */
export function EventsPage() {
  const [events, setEvents] = useState<VisibleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stale = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const visibleEvents = await listVisibleEvents();
        if (stale) return;
        setEvents(visibleEvents);
      } catch {
        if (stale) return;
        setError('לא הצלחנו לטעון את המפגשים כרגע. אפשר לנסות שוב בעוד רגע.');
      } finally {
        if (!stale) setIsLoading(false);
      }
    }
    void load();
    return () => {
      stale = true;
    };
  }, []);

  return (
    <PageShell
      title="מפגשים פתוחים"
      subtitle="יותר מפגשים באותו מסך, בקצב רגוע ועם דרך ברורה להבין אם זה מתאים."
      heroAlign="center"
    >
      <PageActionBar variant="participant">
        <Button asChild variant="outline">
          <Link to="/events/propose">להציע מפגש חדש</Link>
        </Button>
      </PageActionBar>
      {isLoading ? (
        <RouteLoadingState />
      ) : error ? (
        <RouteErrorState title="שגיאת טעינה" body={error} />
      ) : events.length === 0 ? (
        <RouteEmptyState
          title="אין כרגע מפגשים פתוחים"
          body="ברגע שיתפרסמו מפגשים חדשים, הם יופיעו כאן."
        />
      ) : (
        <section className={tokens.participant.panel + ' p-3 sm:p-4'}>
          <div className={tokens.participant.panelInner + ' p-3 sm:p-4'}>
            <div data-testid="events-discovery-grid" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {events.map((event) => (
                <EventSummaryCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}
    </PageShell>
  );
}
