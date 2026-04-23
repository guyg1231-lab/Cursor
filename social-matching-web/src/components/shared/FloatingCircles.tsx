import { cn } from '@/lib/utils';

interface FloatingCirclesProps {
  className?: string;
  variant?: 'default' | 'muted';
}

export function FloatingCircles({ className, variant = 'default' }: FloatingCirclesProps) {
  const opacityModifier = variant === 'muted' ? 0.5 : 1;

  return (
    <div className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)} aria-hidden="true">
      <div
        className="absolute rounded-full animate-float"
        style={{
          width: '260px',
          height: '260px',
          background: 'hsl(var(--accent-lavender))',
          top: '10%',
          left: '-6%',
          filter: 'blur(64px)',
          opacity: 0.12 * opacityModifier,
        }}
      />
      <div
        className="absolute rounded-full animate-float-delayed"
        style={{
          width: '180px',
          height: '180px',
          background: 'hsl(var(--accent-sky))',
          top: '14%',
          right: '-3%',
          filter: 'blur(56px)',
          opacity: 0.1 * opacityModifier,
        }}
      />
      <div
        className="absolute rounded-full animate-float"
        style={{
          width: '140px',
          height: '140px',
          background: 'hsl(var(--accent-periwinkle))',
          bottom: '10%',
          left: '12%',
          filter: 'blur(48px)',
          opacity: 0.08 * opacityModifier,
        }}
      />
      <div
        className="absolute rounded-full animate-float-delayed hidden md:block"
        style={{
          width: '120px',
          height: '120px',
          background: 'hsl(var(--primary) / 0.12)',
          top: '34%',
          right: '18%',
          filter: 'blur(44px)',
          opacity: 0.12 * opacityModifier,
        }}
      />
    </div>
  );
}
