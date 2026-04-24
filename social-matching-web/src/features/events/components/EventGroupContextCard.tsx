import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EventAttendeeCircles } from '@/features/events/components/EventAttendeeCircles';
import { formatEventCapacityLabel } from '@/features/events/formatters';
import { getEventPresentation } from '@/features/events/presentation';
import type { VisibleEvent } from '@/features/events/types';
import { tokens } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

export function EventGroupContextCard({
  event,
  className,
}: {
  event: VisibleEvent;
  className?: string;
}) {
  const presentation = getEventPresentation(event);
  const attendeeCount = event.social_signal?.attendee_count ?? 0;
  const groupLabel = attendeeCount > 0 ? `${attendeeCount} כבר בפנים` : 'הקבוצה עדיין נבנית';
  const groupDetail =
    attendeeCount > 0
      ? 'אנשים כבר התחילו להיכנס לחדר הזה, והצורה שלו מתחילה להתבהר.'
      : 'עוד מוקדם לראות פנים, אבל הכיוון והגודל כבר ברורים.';

  const highlights = [
    {
      label: 'קצב',
      value: presentation.moodLabel,
    },
    {
      label: 'גודל',
      value: formatEventCapacityLabel(event),
    },
    {
      label: 'התחלה',
      value: attendeeCount > 0 ? 'כבר נבנית' : 'עדיין נפתחת',
    },
  ];

  return (
    <Card data-testid="event-group-context" className={cn(tokens.card.surface, className)}>
      <CardHeader className="space-y-2">
        <p className={tokens.typography.eyebrow}>איך הקבוצה נראית</p>
        <CardTitle className="text-xl font-semibold tracking-[-0.015em]">החדר הזה כבר מתחיל לקבל צורה</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
        <p className="text-foreground/85">
          זה לא רק מספר אנשים. זו קבוצה קטנה שנבנית סביב הקצב, הגודל, והאווירה של המפגש הזה.
        </p>

        <EventAttendeeCircles
          count={attendeeCount}
          label={groupLabel}
          detail={groupDetail}
          density="compact"
        />

        <div className="grid gap-2 sm:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.label} className={tokens.card.inner + ' rounded-[18px] p-3 text-center'}>
              <p className={tokens.typography.eyebrow}>{item.label}</p>
              <p className="mt-1 text-[13px] leading-5 text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
