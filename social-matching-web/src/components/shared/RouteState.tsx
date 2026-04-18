import { Card, CardContent } from '@/components/ui/card';
import { tokens } from '@/lib/design-tokens';

type RouteStateProps = {
  title: string;
  body: string;
  tone?: 'default' | 'danger';
};

function RouteStateCard({ title, body, tone = 'default' }: RouteStateProps) {
  return (
    <Card className={tokens.card.surface}>
      <CardContent
        className={`space-y-2 py-8 text-sm ${
          tone === 'danger' ? 'text-destructive' : 'text-muted-foreground'
        }`}
      >
        <p className="font-medium text-foreground">{title}</p>
        <p>{body}</p>
      </CardContent>
    </Card>
  );
}

export function RouteLoadingState({ title = 'Loading…' }: { title?: string } = {}) {
  return <RouteStateCard title={title} body="Please wait while this page loads." />;
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

export function RouteGatedState({ title, body }: RouteStateProps) {
  return <RouteStateCard title={title} body={body} />;
}

export function RouteSuccessState({ title, body }: RouteStateProps) {
  return <RouteStateCard title={title} body={body} />;
}
