import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { PageShell } from '@/components/shared/PageShell';
import { RouteEmptyState, RouteErrorState, RouteLoadingState } from '@/components/shared/RouteState';
import { listVisibleEvents } from '@/features/events/api';
import { EventSummaryCard } from '@/features/events/components/EventSummaryCard';
import type { VisibleEvent } from '@/features/events/types';

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
  const wideDesktopGridClassName =
    events.length >= 4 ? 'xl:grid-cols-4' : events.length === 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-2';

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
      title="אירועים פתוחים"
      subtitle="לראות יותר אפשרויות באותו מדף, ולפתוח את מה שמרגיש נכון."
      heroAlign="start"
    >
      <div className="mx-auto w-full max-w-[1380px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {!isLoading && !error ? (
              <span className="rounded-full border border-border/70 bg-card/92 px-3 py-1.5 text-[11px] font-medium text-foreground/72 shadow-sm">
                {events.length} אירועים פתוחים
              </span>
            ) : null}
            <span className="rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-[11px] font-medium text-primary/90 shadow-sm">
              דפדוף רגוע
            </span>
          </div>

          <PageActionBar variant="participant">
            <Button asChild variant="outline">
              <Link to="/events/propose">להציע מפגש חדש</Link>
            </Button>
          </PageActionBar>
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
          <div
            data-testid="events-discovery-grid"
            className={`grid items-start gap-4 md:grid-cols-2 ${wideDesktopGridClassName}`}
          >
            {events.map((event) => (
              <EventSummaryCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
