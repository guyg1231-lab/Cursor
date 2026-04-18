import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { tokens } from '@/lib/design-tokens';
import { listVisibleEvents } from '@/features/events/api';
import { formatEventDate } from '@/features/events/formatters';
import type { VisibleEvent } from '@/features/events/types';

const PREVIEW_MAX_LENGTH = 100;

function truncatePreview(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length <= PREVIEW_MAX_LENGTH) return trimmed;
  return `${trimmed.slice(0, PREVIEW_MAX_LENGTH).trimEnd()}…`;
}

/**
 * Minimal discovery surface: lists every currently open gathering
 * (`status = 'active' AND is_published = true`, ordered by `starts_at ASC` —
 * filtering handled inside `listVisibleEvents`). One-column list, title +
 * city + starts_at + entry button. No filters, search, sorting, categories,
 * participant counts, host names, or detail page links — intentionally.
 */
export function EventsPage() {
  const navigate = useNavigate();
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
          {events.map((event) => {
            const preview = truncatePreview(event.description);
            return (
              <Card key={event.id} className={tokens.card.accent}>
                <CardHeader>
                  <CardTitle className="text-xl leading-tight">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-foreground/85">
                  <p>
                    <strong className="text-foreground">עיר:</strong> {event.city}
                  </p>
                  <p>
                    <strong className="text-foreground">מתי:</strong> {formatEventDate(event.starts_at)}
                  </p>
                  {preview ? <p className="text-muted-foreground">{preview}</p> : null}
                  <Button type="button" variant="primary" onClick={() => navigate(`/gathering/${event.id}`)}>
                    כניסה למפגש
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
