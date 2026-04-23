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
      <div className="relative overflow-hidden rounded-[28px] px-4 pb-16 pt-5 sm:px-6 sm:pb-20 sm:pt-6">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#f2e5d7_0%,#ecefff_52%,#fffdfa_100%)]" />
        <div className="absolute inset-x-6 top-8 h-4 rounded-full bg-white/60 blur-sm" />
        <div className="absolute end-8 top-10 h-20 w-20 rounded-full bg-primary/12 blur-2xl" />
        <div className="absolute start-10 top-24 h-5 w-44 rotate-[18deg] rounded-full bg-white/70" />
        <div className="absolute end-16 top-24 h-5 w-32 -rotate-[20deg] rounded-full bg-white/60" />
        <span className="absolute start-10 top-10 h-4 w-4 rounded-[50%_50%_50%_0] rotate-[-45deg] bg-primary shadow-md" />

        <div className="relative space-y-5">
          {badges ? <div className="flex flex-wrap justify-center gap-2 sm:justify-start">{badges}</div> : null}
          <div className="space-y-3 text-center sm:text-start">
            <p className={cn(tokens.typography.eyebrow, 'text-foreground/65')}>{eyebrow}</p>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold leading-[2.125rem] tracking-[-0.015em] text-foreground sm:text-3xl sm:leading-[2.5rem]">
                {event.title}
              </h2>
              <p className="text-sm leading-6 text-foreground/80 sm:text-base sm:leading-7">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="relative -mt-10 space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
        <div className={cn(tokens.participant.panel, 'space-y-4 p-4')}>
          {event.social_signal ? (
            <EventAttendeeCircles
              count={event.social_signal.attendee_count}
              label={socialLabel}
              detail={socialDetail}
              className="justify-center sm:justify-start"
            />
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="rounded-[22px] border border-primary/10 bg-background/70 px-3 py-3 text-center shadow-sm"
              >
                <p className={tokens.typography.eyebrow}>{fact.label}</p>
                <p className="mt-1 text-sm leading-6 text-foreground">{fact.value}</p>
              </div>
            ))}
          </div>

          {atmosphere ? (
            <div className={cn(tokens.card.inner, 'space-y-2 p-4 text-start')}>
              <p className={tokens.typography.eyebrow}>האווירה בקצרה</p>
              <p className="text-sm leading-7 text-foreground/85">{atmosphere}</p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
