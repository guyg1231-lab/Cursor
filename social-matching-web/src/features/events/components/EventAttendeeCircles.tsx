import { cn } from '@/lib/utils';

const CIRCLE_SWATCHES = [
  'from-[#efb4b0] to-[#d98f88]',
  'from-[#cad5fc] to-[#7f94e0]',
  'from-[#d7e3c5] to-[#8ea273]',
  'from-[#f2d7b5] to-[#d5a36a]',
  'from-[#efc6dc] to-[#c58ab0]',
] as const;

export function EventAttendeeCircles({
  count,
  label,
  detail = 'החדר נבנה בקצב רגוע',
  energyLabel = 'אנרגיה חברתית',
  density = 'default',
  className,
}: {
  count: number;
  label?: string;
  detail?: string;
  energyLabel?: string;
  density?: 'default' | 'compact';
  className?: string;
}) {
  const visibleCount = Math.max(0, Math.min(count, 5));
  if (visibleCount === 0) return null;
  const overflowCount = Math.max(0, count - visibleCount);
  const isCompact = density === 'compact';

  return (
    <div
      data-testid="event-attendee-circles"
      className={cn(
        isCompact
          ? 'rounded-[20px] border border-primary/10 bg-primary/5 px-3 py-2 shadow-sm'
          : 'rounded-[24px] border border-primary/10 bg-primary/5 px-3 py-3 shadow-sm',
        className,
      )}
    >
      <div className={cn('flex items-center', isCompact ? 'gap-2.5' : 'gap-3')}>
        <div className="flex items-center">
          {Array.from({ length: visibleCount }).map((_, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={cn(
                '-ms-2 first:ms-0 rounded-full border-2 border-background bg-gradient-to-br shadow-sm',
                isCompact ? 'h-6 w-6' : 'h-7 w-7',
                CIRCLE_SWATCHES[index],
              )}
            />
          ))}
          {overflowCount > 0 ? (
            <span
              className={cn(
                '-ms-2 flex items-center justify-center rounded-full border-2 border-background bg-card px-1 text-[10px] font-semibold text-foreground shadow-sm',
                isCompact ? 'h-6 min-w-6' : 'h-7 min-w-7',
              )}
            >
              +{overflowCount}
            </span>
          ) : null}
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className={cn('font-medium text-foreground', isCompact ? 'text-[13px] leading-5' : 'text-sm')}>
            {label ?? `${count} כבר בפנים`}
          </p>
          <p className={cn('text-muted-foreground', isCompact ? 'text-[10px] leading-4' : 'text-[11px] leading-5')}>
            {detail}
          </p>
        </div>
      </div>
      {!isCompact ? (
        <div className="mt-2 flex items-center justify-end border-t border-primary/10 pt-2">
          <span className="rounded-full border border-primary/15 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-foreground/75">
            {energyLabel}
          </span>
        </div>
      ) : null}
    </div>
  );
}
