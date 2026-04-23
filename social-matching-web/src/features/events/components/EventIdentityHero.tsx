import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EventAttendeeCircles } from '@/features/events/components/EventAttendeeCircles';
import {
  formatEventAreaHint,
  formatEventAtmosphereSnippet,
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
  const atmosphere = formatEventAtmosphereSnippet(event.description, 140);
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
      <CardContent className="space-y-5 p-5 sm:p-6">
        {badges ? <div className="flex flex-wrap gap-2">{badges}</div> : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)]">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className={cn(tokens.typography.eyebrow, 'text-foreground/65')}>{eyebrow}</p>
              <h2 className="text-2xl font-semibold leading-[2.125rem] tracking-[-0.015em] text-foreground sm:text-3xl sm:leading-[2.5rem]">
                {event.title}
              </h2>
              <p className="text-sm leading-6 text-foreground/80 sm:text-base sm:leading-7">{subtitle}</p>
            </div>

            {atmosphere ? (
              <div className={cn(tokens.card.inner, 'space-y-2 p-4 text-start')}>
                <p className={tokens.typography.eyebrow}>האווירה בקצרה</p>
                <p className="text-sm leading-7 text-foreground/85">{atmosphere}</p>
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            {event.social_signal ? (
              <EventAttendeeCircles
                count={event.social_signal.attendee_count}
                label={socialLabel}
                detail={socialDetail}
              />
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-[22px] border border-primary/10 bg-background/86 px-3 py-3 text-center shadow-[0_10px_22px_-18px_hsl(var(--foreground)/0.25)]"
                >
                  <p className={tokens.typography.eyebrow}>{fact.label}</p>
                  <p className="mt-1 text-sm leading-6 text-foreground">{fact.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
