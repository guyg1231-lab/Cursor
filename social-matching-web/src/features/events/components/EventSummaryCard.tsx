import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EventAttendeeCircles } from '@/features/events/components/EventAttendeeCircles';
import { formatEventDate, formatVisibleEventRegistrationState } from '@/features/events/formatters';
import { tokens } from '@/lib/design-tokens';
import type { VisibleEvent } from '@/features/events/types';

const DESCRIPTION_PREVIEW_MAX_LENGTH = 120;

function truncateForPreview(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max).trimEnd()}…`;
}

export function EventSummaryCard({ event }: { event: VisibleEvent }) {
  const description = event.description?.trim() ?? '';
  const areaHint = event.venue_hint?.trim() ?? event.city;
  const registrationState = formatVisibleEventRegistrationState(event);
  const capacityLabel = event.max_capacity ? `עד ${event.max_capacity} אנשים` : 'קבוצה קטנה';

  return (
    <Card className={tokens.card.accent}>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={registrationState.label} tone={registrationState.tone} />
          <StatusBadge label={capacityLabel} tone="muted" />
        </div>
        <CardTitle className="text-xl leading-tight">{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-foreground/85">
        <div className={tokens.card.inner + ' p-4 space-y-3'}>
          <div className="space-y-1">
            <p className={tokens.typography.eyebrow}>מתי?</p>
            <p className="text-foreground">{formatEventDate(event.starts_at)}</p>
          </div>
          <div className="space-y-1">
            <p className={tokens.typography.eyebrow}>איפה בערך?</p>
            <p className="text-foreground">{areaHint}</p>
          </div>
        </div>
        {description.length > 0 ? (
          <div className="space-y-1">
            <p className={tokens.typography.eyebrow}>מה האווירה?</p>
            <p className="text-foreground/75 leading-relaxed">
              {truncateForPreview(description, DESCRIPTION_PREVIEW_MAX_LENGTH)}
            </p>
          </div>
        ) : null}
        {event.social_signal?.attendee_count ? (
          <EventAttendeeCircles count={event.social_signal.attendee_count} />
        ) : null}
        <p className="text-sm text-muted-foreground">תהליך התאמה אנושי לפני אישור מקום סופי.</p>
        <Button asChild variant="primary">
          <Link to={`/events/${event.id}`}>לפרטי המפגש</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
