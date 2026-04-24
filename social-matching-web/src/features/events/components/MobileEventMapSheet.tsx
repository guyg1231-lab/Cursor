import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EventAttendeeCircles } from '@/features/events/components/EventAttendeeCircles';
import {
  formatEventAreaHint,
  formatEventAtmosphereSnippet,
  formatEventCapacityLabel,
  formatMobileEventWindowLabel,
} from '@/features/events/formatters';
import type { VisibleEvent } from '@/features/events/types';

export function MobileEventMapSheet({ event }: { event: VisibleEvent }) {
  const atmosphere = formatEventAtmosphereSnippet(event.description, 84);
  const areaHint = formatEventAreaHint(event);

  return (
    <section className="space-y-3 md:hidden">
      <div className="relative overflow-hidden rounded-[32px] border border-border/60 bg-[linear-gradient(140deg,#f0e1d2,#eae6de_58%,#e9ecff)] px-4 pb-20 pt-5 shadow-soft-lg">
        <div className="absolute inset-x-6 top-8 h-4 rounded-full bg-white/55 blur-sm" />
        <div className="absolute inset-x-10 top-16 h-3 rotate-[18deg] rounded-full bg-white/70" />
        <div className="absolute start-14 top-28 h-4 w-40 -rotate-[12deg] rounded-full bg-white/60" />
        <div className="absolute end-10 top-24 h-14 w-14 rounded-full bg-primary/12 blur-xl" />
        <span className="absolute end-12 top-10 h-4 w-4 rounded-[50%_50%_50%_0] rotate-[-45deg] bg-primary shadow-md" />
        <div className="relative flex justify-between gap-3">
          <div className="rounded-full border border-white/70 bg-white/78 px-3 py-1 text-xs text-foreground/70 shadow-sm">
            {event.city}
          </div>
          <div className="rounded-full border border-white/70 bg-white/78 px-3 py-1 text-xs text-foreground/70 shadow-sm">
            {event.is_registration_open ? 'פתוח להגשה' : 'סגור להגשה'}
          </div>
        </div>
      </div>

      <div className="-mt-16 rounded-[30px] border border-border/60 bg-card/92 p-4 shadow-soft-lg backdrop-blur-md">
        <p className="text-center text-xs tracking-[0.02em] text-muted-foreground">{areaHint}</p>
        <h2 className="mt-2 text-center text-[24px] leading-[34px] font-semibold tracking-[-0.015em] text-foreground">
          {event.title}
        </h2>
        <p className="mt-1 text-center text-sm leading-6 text-muted-foreground">
          {formatMobileEventWindowLabel(event)}
        </p>
        {atmosphere ? (
          <p className="mt-3 text-center text-sm leading-6 text-foreground/78">{atmosphere}</p>
        ) : null}
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-[22px] border border-primary/10 bg-background/70 px-3 py-3 shadow-sm">
            <p className="text-xs tracking-[0.02em] text-muted-foreground">איפה בערך</p>
            <p className="mt-1 text-sm leading-6 text-foreground">{areaHint}</p>
          </div>
          <div className="rounded-[22px] border border-primary/10 bg-background/70 px-3 py-3 shadow-sm">
            <p className="text-xs tracking-[0.02em] text-muted-foreground">קבוצה</p>
            <p className="mt-1 text-sm leading-6 text-foreground">{formatEventCapacityLabel(event)}</p>
          </div>
        </div>
        {event.social_signal?.attendee_count ? (
          <EventAttendeeCircles
            count={event.social_signal.attendee_count}
            detail="החדר נבנה בקצב רגוע"
            className="mt-3"
          />
        ) : null}
        <Button asChild variant="primary" className="mt-4 w-full">
          <Link to={`/events/${event.id}`}>לפרטי המפגש</Link>
        </Button>
      </div>
    </section>
  );
}
