import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EventAttendeeCircles } from '@/features/events/components/EventAttendeeCircles';
import { formatMobileEventWindowLabel } from '@/features/events/formatters';
import type { VisibleEvent } from '@/features/events/types';

export function MobileEventMapSheet({ event }: { event: VisibleEvent }) {
  return (
    <section className="space-y-3 md:hidden">
      <div className="relative overflow-hidden rounded-[28px] border border-border/60 bg-[linear-gradient(135deg,#efe2d3,#e5d8ca)] p-4 shadow-soft-lg">
        <div className="absolute inset-x-0 top-8 mx-auto h-4 w-56 rotate-[24deg] rounded-full bg-white/60" />
        <div className="absolute start-20 top-28 h-4 w-48 -rotate-[12deg] rounded-full bg-white/60" />
        <span className="absolute end-12 top-10 h-4 w-4 rounded-[50%_50%_50%_0] rotate-[-45deg] bg-primary shadow-md" />
      </div>

      <div className="-mt-12 rounded-[28px] border border-border/60 bg-card/90 p-4 shadow-soft-lg backdrop-blur-md">
        <p className="text-center text-xs tracking-[0.02em] text-muted-foreground">{event.venue_hint ?? event.city}</p>
        <h2 className="mt-2 text-center text-[24px] leading-[34px] font-semibold tracking-[-0.015em] text-foreground">
          {event.title}
        </h2>
        <p className="mt-1 text-center text-sm leading-6 text-muted-foreground">
          {formatMobileEventWindowLabel(event)}
        </p>
        {event.social_signal?.attendee_count ? (
          <EventAttendeeCircles count={event.social_signal.attendee_count} className="mt-3 justify-center" />
        ) : null}
        <Button asChild variant="primary" className="mt-4 w-full">
          <Link to={`/events/${event.id}`}>לפרטי המפגש</Link>
        </Button>
      </div>
    </section>
  );
}
