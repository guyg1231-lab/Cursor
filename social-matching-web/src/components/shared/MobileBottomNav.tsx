import { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { CalendarDays, LayoutGrid, UserRound } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

type TabItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  isActive: (pathname: string) => boolean;
};

function isParticipantMobileNavRoute(pathname: string) {
  const exactAllowedRoutes = new Set(['/', '/auth', '/terms', '/privacy', '/events', '/questionnaire', '/dashboard']);
  if (exactAllowedRoutes.has(pathname)) return true;
  if (pathname.startsWith('/events/')) return true;
  if (pathname.startsWith('/gathering/')) return true;
  return false;
}

export function MobileBottomNav() {
  const location = useLocation();
  const { t } = useLanguage();

  const shouldRender = isParticipantMobileNavRoute(location.pathname);
  const tabs = useMemo<TabItem[]>(
    () => [
      {
        to: '/events',
        label: t('navEvents'),
        icon: <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />,
        isActive: (pathname) => pathname.startsWith('/events') || pathname.startsWith('/gathering/'),
      },
      {
        to: '/questionnaire',
        label: t('navQuestionnaire'),
        icon: <UserRound className="h-3.5 w-3.5" aria-hidden="true" />,
        isActive: (pathname) => pathname.startsWith('/questionnaire'),
      },
      {
        to: '/dashboard',
        label: t('navDashboard'),
        icon: <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />,
        isActive: (pathname) => pathname.startsWith('/dashboard'),
      },
    ],
    [t],
  );

  if (!shouldRender) return null;

  return (
    <div className="md:hidden">
      <div className="fixed inset-x-3 bottom-3 z-[55] rounded-full border border-border/70 bg-card/94 px-2 py-2 shadow-[0_18px_40px_-26px_hsl(var(--foreground)/0.34),0_6px_14px_hsl(var(--foreground)/0.06)] backdrop-blur-md">
        <div className="grid grid-cols-3 gap-1.5">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              aria-current={tab.isActive(location.pathname) ? 'page' : undefined}
              className={cn(
                'rounded-full border border-transparent px-2 py-1.5 text-center text-[11px] leading-none text-muted-foreground transition',
                tab.isActive(location.pathname) ? 'border-primary/25 bg-primary/12 text-foreground' : 'bg-background/72',
              )}
            >
              <span className="flex flex-col items-center gap-0.5">
                {tab.icon}
                <span>{tab.label}</span>
              </span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}
