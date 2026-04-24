import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EventAttendeeCircles } from '@/features/events/components/EventAttendeeCircles';
import { EventPresentationIcon } from '@/features/events/components/EventPresentationIcon';
import {
  formatEventAreaHint,
  formatEventCapacityLabel,
  formatEventDate,
} from '@/features/events/formatters';
import { getEventPresentation } from '@/features/events/presentation';
import type { VisibleEvent } from '@/features/events/types';
import { tokens } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

type EventIdentityHeroProps = {
  event: VisibleEvent;
  eyebrow: string;
  subtitle: string;
  badges?: ReactNode;
  socialLabel?: string;
  socialDetail?: string;
  className?: string;
};

export function EventIdentityHero({
  event,
  eyebrow,
  subtitle,
  badges,
  socialLabel,
  socialDetail,
  className,
}: EventIdentityHeroProps) {
  const presentation = getEventPresentation(event);
  const facts = [
    { label: 'מתי', value: formatEventDate(event.starts_at) },
    { label: 'איפה בערך', value: formatEventAreaHint(event) },
    { label: 'קבוצה', value: formatEventCapacityLabel(event) },
    {
      label: event.is_registration_open ? 'הרשמה עד' : 'ההרשמה נסגרה',
      value: event.registration_deadline ? formatEventDate(event.registration_deadline) : 'יעודכן בהמשך',
    },
  ];

  return (
    <Card data-testid="event-identity-hero" className={cn(tokens.card.surface, 'overflow-hidden', className)}>
      <div
        className={cn(
          'relative overflow-hidden border-b border-border/55 bg-gradient-to-br px-5 pb-3 pt-3',
          presentation.bandGradientClassName,
        )}
      >
        <div className="pointer-events-none absolute inset-x-10 top-0 h-14 rounded-full bg-white/35 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className={cn(tokens.typography.eyebrow, 'text-foreground/65')}>{eyebrow}</p>
            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  'rounded-full border px-3 py-1 text-[11px] font-medium shadow-sm',
                  presentation.moodChipClassName,
                )}
              >
                {presentation.moodLabel}
              </span>
              {badges}
            </div>
          </div>
          <div
            data-testid="event-identity-symbol"
            data-presentation-key={presentation.key}
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border text-[1.35rem] shadow-[0_12px_22px_-16px_hsl(var(--foreground)/0.28)]',
              presentation.symbolShellClassName,
            )}
          >
            <EventPresentationIcon presentationKey={presentation.key} className="h-6 w-6" />
          </div>
        </div>
      </div>

      <CardContent className="space-y-3 p-4 sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.12fr)_minmax(270px,0.88fr)]">
          <div className="space-y-2.5">
            <div className="space-y-2">
              <h2 className="text-[1.9rem] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[2.45rem]">
                {event.title}
              </h2>
              <p className="max-w-[34rem] text-sm leading-6 text-foreground/80 sm:text-[15px] sm:leading-6">{subtitle}</p>
            </div>
          </div>
          <div className="space-y-3">
            {event.social_signal ? (
              <EventAttendeeCircles
                count={event.social_signal.attendee_count}
                label={socialLabel}
                detail={socialDetail}
                density="compact"
              />
            ) : null}

            <div className="grid grid-cols-2 gap-2.5">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-[18px] border border-primary/10 bg-background/90 px-3 py-2 text-center shadow-[0_10px_22px_-18px_hsl(var(--foreground)/0.25)]"
                >
                  <p className={tokens.typography.eyebrow}>{fact.label}</p>
                  <p className="mt-1 text-[13px] leading-5 text-foreground sm:text-sm sm:leading-6">{fact.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
