import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { FloatingCircles } from '@/components/shared/FloatingCircles';
import { AppHeader } from '@/components/shared/AppHeader';
import { MobileBottomNav } from '@/components/shared/MobileBottomNav';
import { tokens } from '@/lib/design-tokens';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'minimal';
  headerVariant?: 'default' | 'immersive';
  title?: string;
  subtitle?: string;
  heroAlign?: 'start' | 'center';
  headerTransparent?: boolean;
  headerSticky?: boolean;
  headerActions?: React.ReactNode;
}

export function PageShell({
  children,
  className,
  variant = 'gradient',
  headerVariant = 'default',
  title,
  subtitle,
  heroAlign = 'start',
  headerTransparent = false,
  headerSticky = true,
  headerActions,
}: PageShellProps) {
  const { isRTL, t } = useLanguage();
  const mode = variant === 'default' ? 'gradient' : variant;
  const heroAlignClassName = heroAlign === 'center' ? 'text-center mx-auto items-center' : 'text-start items-start';

  return (
    <div
      data-testid="participant-page-shell"
      className={cn(
        'min-h-screen relative overflow-x-hidden',
        mode === 'gradient' ? 'bg-[hsl(var(--background))]' : 'bg-[hsl(var(--background))]',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      style={
        mode === 'gradient'
          ? {
              background:
                'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--accent-sky) / 0.14) 18%, hsl(var(--background)) 54%, hsl(var(--accent-lavender) / 0.14) 100%)',
            }
          : undefined
      }
    >
      <a href="#main-content" className="skip-link">
        {t('skipToContent')}
      </a>

      {mode === 'gradient' && (
        <>
          <FloatingCircles variant="muted" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 52% 32% at 50% 14%, hsl(var(--primary) / 0.06), transparent 72%)',
            }}
          />
        </>
      )}

      {mode === 'minimal' && (
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background:
              'linear-gradient(180deg, hsl(var(--accent-lavender) / 0.18) 0%, hsl(var(--background) / 0.5) 100%)',
          }}
        />
      )}

      <div className={tokens.participant.shell.chrome}>
        <AppHeader
          variant={headerVariant}
          transparent={headerTransparent}
          fixed
          sticky={headerSticky}
          actions={headerActions}
        />
        <main id="main-content" className={cn(tokens.participant.shell.content, 'pt-16 pb-28 md:pb-10')}>
          {title || subtitle ? (
            <div
              data-testid="participant-page-hero"
              className={cn('flex flex-col', tokens.participant.shell.hero, heroAlignClassName)}
            >
              {title ? <h1 className={tokens.typography.hero}>{title}</h1> : null}
              {subtitle ? <p className="text-base md:text-lg leading-7 md:leading-8 text-foreground/78">{subtitle}</p> : null}
            </div>
          ) : null}
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
