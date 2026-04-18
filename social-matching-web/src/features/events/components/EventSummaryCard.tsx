import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatEventDate } from '@/features/events/formatters';
import { tokens } from '@/lib/design-tokens';
import type { VisibleEvent } from '@/features/events/types';

export function EventSummaryCard({ event }: { event: VisibleEvent }) {
  return (
    <Card className={tokens.card.accent}>
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
        <Button asChild variant="primary">
          <Link to={`/events/${event.id}`}>לפרטי המפגש</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
