import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
      subtitle="כל המפגשים שפתוחים עכשיו. כניסה ישירה לעמוד ההרשמה של המפגש."
    >
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link to="/events/propose">להציע מפגש חדש</Link>
        </Button>
      </div>
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
        <div className={tokens.spacing.content}>
          {events.map((event) => (
            <EventSummaryCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
