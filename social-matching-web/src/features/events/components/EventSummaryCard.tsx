import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EventAttendeeCircles } from '@/features/events/components/EventAttendeeCircles';
import {
  formatEventAreaHint,
  formatEventAtmosphereSnippet,
  formatEventCapacityLabel,
  formatEventDate,
  formatVisibleEventRegistrationState,
} from '@/features/events/formatters';
import { tokens } from '@/lib/design-tokens';
import type { VisibleEvent } from '@/features/events/types';

export function EventSummaryCard({ event }: { event: VisibleEvent }) {
  const atmospherePreview = formatEventAtmosphereSnippet(event.description, 88);
  const areaHint = formatEventAreaHint(event);
  const registrationState = formatVisibleEventRegistrationState(event);
  const capacityLabel = formatEventCapacityLabel(event);
  const attendeeSignal = event.social_signal;
  const hasAttendeeSignal = attendeeSignal !== undefined;

  return (
    <Card data-testid="event-summary-card" className={tokens.card.accent + ' h-full'}>
      <CardHeader className="space-y-3 p-5 pb-3">
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={registrationState.label} tone={registrationState.tone} />
          <StatusBadge label={capacityLabel} tone="muted" />
        </div>
        <CardTitle className="text-xl leading-tight tracking-[-0.01em]">{event.title}</CardTitle>
        {atmospherePreview ? (
          <p className="max-w-[56ch] text-sm leading-6 text-foreground/80">{atmospherePreview}</p>
        ) : null}
      </CardHeader>
      <CardContent className="grid h-full gap-3 p-5 pt-0 text-sm text-foreground/85 md:grid-cols-[minmax(0,1.15fr)_minmax(220px,0.85fr)]">
        <div className={tokens.participant.panelInner + ' space-y-3 p-4'}>
          <div className="space-y-1.5">
            <p className={tokens.typography.eyebrow}>מתי?</p>
            <p className="text-foreground">{formatEventDate(event.starts_at)}</p>
          </div>
          <div className="space-y-1.5">
            <p className={tokens.typography.eyebrow}>איפה בערך?</p>
            <p className="text-foreground">{areaHint}</p>
          </div>
        </div>

        <div className="flex h-full flex-col gap-3">
          {hasAttendeeSignal ? (
            <EventAttendeeCircles
              count={attendeeSignal.attendee_count}
              detail="החדר נבנה בקצב רגוע"
              density="compact"
            />
          ) : (
            <div className={tokens.participant.panelInner + ' space-y-1.5 p-4'}>
              <p className={tokens.typography.eyebrow}>אנרגיה חברתית</p>
              <p className="text-foreground">קבוצה קטנה ומאוצרת</p>
              <p className="text-xs leading-5 text-muted-foreground">
                עדיין לא מוצג מספר מצטרפים, אבל התחושה נשארת אנושית ושקטה.
              </p>
            </div>
          )}

          <Button asChild variant="primary" className="mt-auto w-full">
            <Link data-testid="event-summary-card-action" to={`/events/${event.id}`}>
              לפרטי המפגש
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
