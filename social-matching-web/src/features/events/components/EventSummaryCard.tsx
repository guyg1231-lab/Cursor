import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatEventDate } from '@/features/events/formatters';
import { tokens } from '@/lib/design-tokens';
import type { VisibleEvent } from '@/features/events/types';

const DESCRIPTION_PREVIEW_MAX_LENGTH = 120;

function truncateForPreview(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max).trimEnd()}…`;
}

export function EventSummaryCard({ event }: { event: VisibleEvent }) {
  const description = event.description?.trim() ?? '';

  return (
    <Card className={tokens.card.accent}>
      <CardHeader>
        <CardTitle className="text-xl leading-tight">{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-foreground/85">
        <p>
          <strong className="text-foreground">עיר:</strong> {event.city}
        </p>
        {description.length > 0 ? (
          <p className="text-foreground/75 leading-relaxed">
            {truncateForPreview(description, DESCRIPTION_PREVIEW_MAX_LENGTH)}
          </p>
        ) : null}
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
