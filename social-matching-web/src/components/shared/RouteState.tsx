import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className={tokens.card.surface}>
      <CardContent
        className={`space-y-2 py-8 text-sm ${
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
  title = 'טוענים…',
  body = 'המערכת טוענת את הדף, רק רגע.',
}: RouteLoadingStateProps = {}) {
  return <RouteStateCard title={title} body={body} />;
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
