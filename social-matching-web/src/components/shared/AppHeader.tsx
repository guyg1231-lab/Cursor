import { Link } from 'react-router-dom';
import { Logo } from '@/components/shared/Logo';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { Button } from '@/components/ui/button';
import { RouterLinkButton } from '@/components/ui/router-link-button';
import { cn } from '@/lib/utils';
import { useThemeMode } from '@/hooks/useTheme';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
interface AppHeaderProps {
  actions?: React.ReactNode;
  logoSize?: 'sm' | 'md';
  transparent?: boolean;
  fixed?: boolean;
  sticky?: boolean;
  variant?: 'default' | 'immersive';
  containerClass?: string;
  navHeight?: string;
  className?: string;
}

export function AppHeader({
  actions,
  logoSize = 'sm',
  transparent = false,
  fixed = false,
  sticky = true,
  variant = 'default',
  containerClass = 'container px-4',
  navHeight = 'h-[var(--app-header-height)]',
  className,
}: AppHeaderProps) {
  const { theme, toggleTheme } = useThemeMode();
  const { t } = useLanguage();
  const { user, isAdmin, signOut } = useAuth();

  const navLinkClassName = 'rounded-full px-3 text-muted-foreground hover:text-foreground';
  const trayClassName =
    'rounded-full border border-border/75 bg-card/94 px-2 py-1 shadow-[0_14px_30px_-24px_hsl(var(--foreground)/0.3),0_4px_10px_hsl(var(--foreground)/0.04)]';

  if (variant === 'immersive') {
    return (
      <header
        className={cn(
          'top-0 inset-x-0 z-50 will-change-transform transition-transform duration-200 ease-out',
          fixed ? 'fixed' : sticky ? 'sticky' : 'relative',
          'translate-y-0',
          transparent
            ? 'bg-background/80 backdrop-blur-md shadow-sm'
            : 'bg-background/65 backdrop-blur-md shadow-sm',
          className,
        )}
      >
        <nav className={cn('flex items-end justify-between border-b border-border/40 pb-2', navHeight, containerClass)}>
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground rounded-full p-2 btn-interactive-ghost hover:[&>img]:opacity-80"
            aria-label={t('navHome')}
          >
            <Logo size={logoSize} />
          </Link>

          {actions ? <div className="flex items-center gap-2">{actions}</div> : <div aria-hidden="true" className="h-10 w-10" />}
        </nav>
      </header>
    );
  }

  return (
    <header
      className={cn(
        'top-0 inset-x-0 z-50 will-change-transform transition-transform duration-200 ease-out',
        fixed ? 'fixed' : sticky ? 'sticky' : 'relative',
        'translate-y-0',
        'bg-background/80 backdrop-blur-md shadow-sm',
        className,
      )}
    >
      <nav className={cn('flex items-end justify-between border-b border-border/40 pb-2', navHeight, containerClass)}>
        <Link
          to="/"
          className="text-muted-foreground hover:text-foreground rounded-full p-2 btn-interactive-ghost hover:[&>img]:opacity-80"
          aria-label={t('navHome')}
        >
          <Logo size={logoSize} />
        </Link>

        <div className={cn('hidden md:flex items-center gap-1.5', trayClassName)}>
          <RouterLinkButton to="/events" variant="ghost" size="sm" className={navLinkClassName}>
            {t('navEvents')}
          </RouterLinkButton>
          <RouterLinkButton to="/questionnaire" variant="ghost" size="sm" className={navLinkClassName}>
            {t('navQuestionnaire')}
          </RouterLinkButton>
          <RouterLinkButton to="/dashboard" variant="ghost" size="sm" className={navLinkClassName}>
            {t('navDashboard')}
          </RouterLinkButton>
          {user ? (
            <RouterLinkButton to="/host/events" variant="ghost" size="sm" className={navLinkClassName}>
              {t('navHostRequest')}
            </RouterLinkButton>
          ) : null}
          {isAdmin ? (
            <RouterLinkButton to="/admin/events" variant="ghost" size="sm" className={navLinkClassName}>
              {t('navAdmin')}
            </RouterLinkButton>
          ) : null}
        </div>

        <div className={cn('flex items-center gap-1.5', trayClassName)}>
          {user ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => {
                void signOut();
              }}
            >
              {t('navSignOut')}
            </Button>
          ) : (
            <RouterLinkButton to="/auth" variant="ghost" size="sm" className={navLinkClassName}>
              {t('navSignIn')}
            </RouterLinkButton>
          )}
          {actions}
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          <LanguageToggle />
        </div>
      </nav>
    </header>
  );
}
