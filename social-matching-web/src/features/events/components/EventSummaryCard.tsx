import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EventAttendeeCircles } from '@/features/events/components/EventAttendeeCircles';
import { EventPresentationIcon } from '@/features/events/components/EventPresentationIcon';
import {
  formatEventAreaHint,
  formatEventAtmosphereSnippet,
  formatEventCapacityLabel,
  formatEventDate,
  formatVisibleEventRegistrationState,
} from '@/features/events/formatters';
import { getEventPresentation } from '@/features/events/presentation';
import { tokens } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
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
  const presentation = getEventPresentation(event);

  return (
    <Card
      data-testid="event-summary-card"
      className={
        tokens.card.surface +
        ' group flex h-full min-w-0 flex-col self-start overflow-hidden border-border/65 bg-card/98 hover:-translate-y-0.5 hover:border-primary/12 hover:shadow-[0_26px_52px_-30px_hsl(var(--foreground)/0.28),0_16px_24px_-20px_hsl(var(--foreground)/0.1)]'
      }
    >
      <div
        className={cn(
          'relative overflow-hidden border-b border-border/55 bg-gradient-to-br px-4 pb-2 pt-2.5',
          presentation.bandGradientClassName,
        )}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-10 rounded-full bg-white/35 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-full border px-3 py-1 text-[11px] font-medium shadow-sm',
                presentation.moodChipClassName,
              )}
            >
              {presentation.moodLabel}
            </span>
            <span className="rounded-full border border-white/70 bg-white/82 px-3 py-1 text-[11px] font-medium text-foreground/74 shadow-sm">
              {areaHint}
            </span>
          </div>
          <div
            data-testid="event-presentation-symbol"
            data-presentation-key={presentation.key}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border text-[1.15rem] shadow-[0_10px_18px_-14px_hsl(var(--foreground)/0.28)]',
              presentation.symbolShellClassName,
            )}
          >
            <EventPresentationIcon presentationKey={presentation.key} className="h-5 w-5" />
          </div>
        </div>
        <div className="relative mt-1.5 flex min-w-0 flex-wrap items-center gap-2">
          <StatusBadge label={registrationState.label} tone={registrationState.tone} />
          <span className="rounded-full border border-white/70 bg-white/76 px-3 py-1 text-[11px] font-medium text-foreground/72 shadow-sm">
            {capacityLabel}
          </span>
        </div>
      </div>

      <CardHeader className="space-y-1.5 p-4 pb-1.5">
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
              <p className={tokens.typography.eyebrow}>קבוצה</p>
              <p className="text-[13px] leading-5 text-foreground">{capacityLabel}</p>
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
