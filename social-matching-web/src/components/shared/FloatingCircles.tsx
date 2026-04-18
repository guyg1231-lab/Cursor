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
          width: '320px',
          height: '320px',
          background: 'hsl(var(--accent-lavender))',
          top: '8%',
          left: '-8%',
          filter: 'blur(56px)',
          opacity: 0.22 * opacityModifier,
        }}
      />
      <div
        className="absolute rounded-full animate-float-delayed"
        style={{
          width: '220px',
          height: '220px',
          background: 'hsl(var(--accent-sky))',
          top: '18%',
          right: '-5%',
          filter: 'blur(48px)',
          opacity: 0.18 * opacityModifier,
        }}
      />
      <div
        className="absolute rounded-full animate-float"
        style={{
          width: '180px',
          height: '180px',
          background: 'hsl(var(--accent-periwinkle))',
          bottom: '12%',
          left: '10%',
          filter: 'blur(44px)',
          opacity: 0.16 * opacityModifier,
        }}
      />
      <div
        className="absolute rounded-full animate-float-delayed hidden md:block"
        style={{
          width: '140px',
          height: '140px',
          background: 'hsl(var(--primary) / 0.12)',
          top: '38%',
          right: '18%',
          filter: 'blur(40px)',
          opacity: 0.2 * opacityModifier,
        }}
      />
    </div>
  );
}
