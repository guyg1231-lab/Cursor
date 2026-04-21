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
  className,
}: {
  count: number;
  label?: string;
  className?: string;
}) {
  const visibleCount = Math.max(0, Math.min(count, 5));
  if (visibleCount === 0) return null;

  return (
    <div
      data-testid="event-attendee-circles"
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-primary/10 bg-primary/5 px-3 py-2',
        className,
      )}
    >
      <div className="flex items-center">
        {Array.from({ length: visibleCount }).map((_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={cn(
              '-ms-2 first:ms-0 h-7 w-7 rounded-full border-2 border-background bg-gradient-to-br shadow-sm',
              CIRCLE_SWATCHES[index],
            )}
          />
        ))}
      </div>
      <span className="text-xs text-foreground/80">{label ?? `${count} כבר בפנים`}</span>
    </div>
  );
}
