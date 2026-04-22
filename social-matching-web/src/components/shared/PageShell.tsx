import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { FloatingCircles } from '@/components/shared/FloatingCircles';
import { AppHeader } from '@/components/shared/AppHeader';
import { tokens } from '@/lib/design-tokens';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'minimal';
  title?: string;
  subtitle?: string;
  heroAlign?: 'start' | 'center';
  headerTransparent?: boolean;
  headerActions?: React.ReactNode;
}

export function PageShell({
  children,
  className,
  variant = 'gradient',
  title,
  subtitle,
  heroAlign = 'start',
  headerTransparent = false,
  headerActions,
}: PageShellProps) {
  const { isRTL, t } = useLanguage();
  const mode = variant === 'default' ? 'gradient' : variant;
  const heroAlignClassName = heroAlign === 'center' ? 'text-center mx-auto' : 'text-start';

  return (
    <div
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
                'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--accent-lavender) / 0.3) 50%, hsl(var(--background)) 100%)',
              backgroundAttachment: 'fixed',
            }
          : undefined
      }
    >
      <a href="#main-content" className="skip-link">
        {t('skipToContent')}
      </a>

      {mode === 'gradient' && (
        <>
          <FloatingCircles />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 50% 30%, hsl(var(--primary) / 0.08), transparent 70%)',
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

      <div className="relative z-10">
        <AppHeader transparent={headerTransparent} actions={headerActions} />
        <main id="main-content" className="container py-10 md:py-14 space-y-6">
          {title || subtitle ? (
            <div className={cn('space-y-2 max-w-3xl', heroAlignClassName)}>
              {title ? <h1 className={tokens.typography.hero}>{title}</h1> : null}
              {subtitle ? <p className="text-base md:text-lg leading-8 text-foreground/80">{subtitle}</p> : null}
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
