import { Link } from 'react-router-dom';
import { Logo } from '@/components/shared/Logo';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useThemeMode } from '@/hooks/useTheme';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface AppHeaderProps {
  actions?: React.ReactNode;
  logoSize?: 'sm' | 'md';
  transparent?: boolean;
  fixed?: boolean;
  containerClass?: string;
  navHeight?: string;
  className?: string;
}

export function AppHeader({
  actions,
  logoSize = 'sm',
  transparent = false,
  fixed = false,
  containerClass = 'container px-4',
  navHeight = 'h-16',
  className,
}: AppHeaderProps) {
  const { theme, toggleTheme } = useThemeMode();
  const { t } = useLanguage();
  const { user, isAdmin, signOut } = useAuth();

  return (
    <header
      className={cn(
        'top-0 inset-x-0 z-50 transition-all duration-200 ease-out',
        fixed ? 'fixed' : 'sticky',
        transparent ? 'bg-transparent' : 'bg-background/80 backdrop-blur-md border-b border-border/50',
        className,
      )}
    >
      <nav className={cn('flex items-center justify-between', navHeight, containerClass)}>
        <Link
          to="/"
          className="text-muted-foreground hover:text-foreground rounded-full p-2 btn-interactive-ghost hover:[&>img]:opacity-80"
          aria-label={t('navHome')}
        >
          <Logo size={logoSize} />
        </Link>

        <div className="hidden md:flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground">
            <Link to="/events">{t('navEvents')}</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground">
            <Link to="/questionnaire">{t('navQuestionnaire')}</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground">
            <Link to="/dashboard">{t('navDashboard')}</Link>
          </Button>
          {user ? (
            <Button asChild variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground">
              <Link to="/host/events">{t('navHostRequest')}</Link>
            </Button>
          ) : null}
          {isAdmin ? (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full text-muted-foreground hover:text-foreground"
            >
              <Link to="/admin/events">{t('navAdmin')}</Link>
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
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
            <Button asChild variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground">
              <Link to="/auth">{t('navSignIn')}</Link>
            </Button>
          )}
          {actions}
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          <LanguageToggle />
        </div>
      </nav>
    </header>
  );
}
