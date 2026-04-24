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
  const attendeeCount = attendeeSignal?.attendee_count ?? 0;
  const socialLabel = attendeeCount > 0 ? `${attendeeCount} כבר בפנים` : 'עדיין אין בפנים';
  const socialDetail = 'החדר נבנה בקצב רגוע';

  return (
    <Card
      data-testid="event-summary-card"
      className={
        tokens.card.surface +
        ' group flex h-full min-w-0 flex-col self-start overflow-hidden border-border/65 bg-card/98 hover:-translate-y-0.5 hover:border-primary/12 hover:shadow-[0_26px_52px_-30px_hsl(var(--foreground)/0.28),0_16px_24px_-20px_hsl(var(--foreground)/0.1)]'
      }
    >
      <div className="relative overflow-hidden border-b border-border/55 bg-[linear-gradient(135deg,hsl(var(--background))_0%,hsl(var(--accent-lavender)/0.18)_62%,hsl(var(--accent-sky)/0.08)_100%)] px-4 pb-2.5 pt-3">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-12 rounded-full bg-white/35 blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-2">
          <StatusBadge label={registrationState.label} tone={registrationState.tone} />
          <StatusBadge label={capacityLabel} tone="muted" />
          <span className="rounded-full border border-white/65 bg-white/84 px-3 py-1 text-[11px] font-medium text-foreground/72 shadow-sm">
            {areaHint}
          </span>
        </div>
      </div>

      <CardHeader className="space-y-1.5 p-4 pb-2">
        <CardTitle className="max-h-12 overflow-hidden text-[1.08rem] leading-6 tracking-[-0.02em]">
          {event.title}
        </CardTitle>
        {atmospherePreview ? (
          <p className="max-h-10 overflow-hidden text-[13px] leading-5 text-foreground/78">{atmospherePreview}</p>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 p-4 pt-0 text-sm text-foreground/85">
        <div className={tokens.card.inner + ' grid gap-2 p-2.5'}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className={tokens.typography.eyebrow}>מתי</p>
              <p className="text-[13px] leading-5 text-foreground">{formatEventDate(event.starts_at)}</p>
            </div>
            <div className="min-w-0 max-w-[44%] space-y-1 text-end">
              <p className={tokens.typography.eyebrow}>איפה בערך</p>
              <p className="text-[13px] leading-5 text-foreground">{areaHint}</p>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-2 border-t border-border/55 pt-2.5">
          <EventAttendeeCircles
            count={attendeeCount}
            label={socialLabel}
            detail={socialDetail}
            density="compact"
            className="transition duration-300 group-hover:border-primary/10 group-hover:bg-background/96 group-hover:shadow-[inset_0_1px_0_hsl(var(--card)),0_10px_18px_-16px_hsl(var(--foreground)/0.24)]"
          />

          <Button
            asChild
            variant="primary"
            className="w-full shadow-[0_12px_24px_-18px_hsl(var(--primary)/0.56)] hover:-translate-y-[2px] hover:shadow-[0_18px_28px_-16px_hsl(var(--primary)/0.48)]"
          >
            <Link data-testid="event-summary-card-action" to={`/events/${event.id}`}>
              לפרטי המפגש
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
