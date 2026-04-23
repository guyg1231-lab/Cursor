import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EventAttendeeCircles } from '@/features/events/components/EventAttendeeCircles';
import {
  formatEventAreaHint,
  formatEventCapacityLabel,
  formatEventDate,
} from '@/features/events/formatters';
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
  const facts = [
    { label: 'מתי', value: formatEventDate(event.starts_at) },
    { label: 'איפה בערך', value: formatEventAreaHint(event) },
    { label: 'קבוצה', value: formatEventCapacityLabel(event) },
    {
      label: event.is_registration_open ? 'להגשה עד' : 'נסגר להגשה',
      value: event.registration_deadline ? formatEventDate(event.registration_deadline) : 'יעודכן בהמשך',
    },
  ];

  return (
    <Card data-testid="event-identity-hero" className={cn(tokens.card.accent, className)}>
      <CardContent className="space-y-4 p-5 sm:p-5">
        {badges ? <div className="flex flex-wrap gap-2">{badges}</div> : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(270px,0.88fr)]">
          <div className="space-y-2.5">
            <div className="space-y-2">
              <p className={cn(tokens.typography.eyebrow, 'text-foreground/65')}>{eyebrow}</p>
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
