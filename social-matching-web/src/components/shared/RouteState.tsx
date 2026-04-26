import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { tokens } from '@/lib/design-tokens';

type RouteStateProps = {
  title: string;
  body: string;
  tone?: 'default' | 'danger';
};

type RouteStateCardProps = RouteStateProps & {
  action?: ReactNode;
};

type RouteLoadingStateProps = {
  title?: string;
  body?: string;
};

function RouteStateCard({ title, body, tone = 'default', action }: RouteStateCardProps) {
  return (
    <Card data-testid="participant-route-state" className={tokens.participant.routeState}>
      <CardContent
        className={`space-y-2 ${tokens.participant.panelInner} px-6 py-8 text-sm ${
          tone === 'danger' ? 'text-destructive' : 'text-muted-foreground'
        }`}
      >
        <p className="font-medium text-foreground">{title}</p>
        <p>{body}</p>
        {action ? <div className="pt-2">{action}</div> : null}
      </CardContent>
    </Card>
  );
}

export function RouteLoadingState({
  title,
  body,
}: RouteLoadingStateProps = {}) {
  const { t } = useLanguage();
  return (
    <Card data-testid="participant-route-loading" className={tokens.participant.routeState}>
      <CardContent className={`space-y-4 ${tokens.participant.panelInner} px-6 py-8`}>
        <div data-testid="route-loading-skeleton" className="space-y-3" aria-hidden="true">
          <div className="h-4 w-28 rounded-full bg-muted skeleton-shimmer" />
          <div className="h-8 w-56 rounded-xl bg-muted skeleton-shimmer" />
          <div className="h-3 w-full max-w-md rounded-full bg-muted/80 skeleton-shimmer" />
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{title ?? t('routeLoadingTitle')}</p>
          <p>{body ?? t('routeLoadingBody')}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function RouteEmptyState({ title, body }: RouteStateProps) {
  return <RouteStateCard title={title} body={body} />;
}

export function RouteUnavailableState({ title, body }: RouteStateProps) {
  return <RouteStateCard title={title} body={body} />;
}

export function RouteErrorState({ title, body }: RouteStateProps) {
  return <RouteStateCard title={title} body={body} tone="danger" />;
}

export function RouteNotFoundState({ title, body }: RouteStateProps) {
  return <RouteStateCard title={title} body={body} />;
}

export function RouteGatedState({ title, body, action }: RouteStateCardProps) {
  return <RouteStateCard title={title} body={body} action={action} />;
}

export function RouteSuccessState({ title, body }: RouteStateProps) {
  return <RouteStateCard title={title} body={body} />;
}
