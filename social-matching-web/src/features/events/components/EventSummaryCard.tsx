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
  const atmospherePreview = formatEventAtmosphereSnippet(event.description, 72);
  const areaHint = formatEventAreaHint(event);
  const registrationState = formatVisibleEventRegistrationState(event);
  const capacityLabel = formatEventCapacityLabel(event);
  const attendeeSignal = event.social_signal;
  const hasAttendeeSignal = attendeeSignal !== undefined;

  return (
    <Card data-testid="event-summary-card" className={tokens.card.accent + ' self-start overflow-hidden'}>
      <CardHeader className="space-y-2.5 p-4 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={registrationState.label} tone={registrationState.tone} />
          <StatusBadge label={capacityLabel} tone="muted" />
        </div>
        <CardTitle className="text-xl leading-tight tracking-[-0.01em]">{event.title}</CardTitle>
        {atmospherePreview ? (
          <p className="max-w-[54ch] text-sm leading-5 text-foreground/80">{atmospherePreview}</p>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-4 pt-0 text-sm text-foreground/85">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className={tokens.participant.panelInner + ' space-y-1 p-3'}>
            <p className={tokens.typography.eyebrow}>מתי?</p>
            <p className="text-sm leading-5 text-foreground">{formatEventDate(event.starts_at)}</p>
          </div>
          <div className={tokens.participant.panelInner + ' space-y-1 p-3'}>
            <p className={tokens.typography.eyebrow}>איפה בערך?</p>
            <p className="text-sm leading-5 text-foreground">{areaHint}</p>
          </div>
        </div>

        <div className="grid gap-2.5 border-t border-border/60 pt-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          {hasAttendeeSignal ? (
            <EventAttendeeCircles
              count={attendeeSignal.attendee_count}
              detail="החדר נבנה בקצב רגוע"
              density="compact"
              className="sm:min-w-[220px]"
            />
          ) : (
            <div className={tokens.participant.panelInner + ' space-y-1.5 p-4 sm:min-w-[220px]'}>
              <p className={tokens.typography.eyebrow}>אנרגיה חברתית</p>
              <p className="text-foreground">קבוצה קטנה ומאוצרת</p>
              <p className="text-xs leading-5 text-muted-foreground">
                עדיין לא מוצג מספר מצטרפים, אבל התחושה נשארת אנושית ושקטה.
              </p>
            </div>
          )}

          <Button asChild variant="primary" className="w-full sm:min-w-[176px] sm:justify-self-end">
            <Link data-testid="event-summary-card-action" to={`/events/${event.id}`}>
              לפרטי המפגש
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
