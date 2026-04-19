import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { RouteEmptyState, RouteErrorState } from '@/components/shared/RouteState';
import { tokens } from '@/lib/design-tokens';
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

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const visibleEvents = await listVisibleEvents();
        if (!active) return;
        setEvents(visibleEvents);
      } catch {
        if (!active) return;
        setError('לא הצלחנו לטעון את המפגשים כרגע. אפשר לנסות שוב בעוד רגע.');
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <PageShell
      title="מפגשים פתוחים"
      subtitle="כל המפגשים שפתוחים עכשיו. כניסה ישירה לעמוד ההרשמה של המפגש."
    >
      {isLoading ? (
        <Card className={tokens.card.surface}>
          <CardContent className="py-10 text-sm text-muted-foreground">טוענים מפגשים...</CardContent>
        </Card>
      ) : error ? (
        <RouteErrorState title="שגיאת טעינה" body={error} />
      ) : events.length === 0 ? (
        <RouteEmptyState
          title="אין כרגע מפגשים פתוחים"
          body="ברגע שיתפרסמו מפגשים חדשים, הם יופיעו כאן."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <EventSummaryCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
