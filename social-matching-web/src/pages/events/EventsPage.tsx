import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { tokens } from '@/lib/design-tokens';
import { listVisibleEvents } from '@/features/events/api';
import { EventSummaryCard } from '@/features/events/components/EventSummaryCard';
import type { VisibleEvent } from '@/features/events/types';

/**
 * Minimal discovery surface: lists every currently open gathering
 * (`status = 'active' AND is_published = true`, ordered by `starts_at ASC` —
 * filtering handled inside `listVisibleEvents`). One-column list, title +
 * city + starts_at + entry button. No filters, search, sorting, categories,
 * participant counts, host names, or detail page links — intentionally.
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
        <Card className={tokens.card.surface}>
          <CardContent className="py-10 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : events.length === 0 ? (
        <Card className={tokens.card.surface}>
          <CardContent className="py-10 text-sm text-muted-foreground">אין כרגע מפגשים פתוחים</CardContent>
        </Card>
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
