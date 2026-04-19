import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { tokens } from '@/lib/design-tokens';

const CONTRACT_STATE_LABEL: Record<'real' | 'mixed' | 'stubbed', string> = {
  real: 'ממשק פעיל',
  mixed: 'ממשק חלקי',
  stubbed: 'ממשק זמני',
};

export function PlaceholderPanel({
  title,
  body,
  contractState,
}: {
  title: string;
  body: string;
  contractState: 'real' | 'mixed' | 'stubbed';
}) {
  return (
    <Card className={tokens.card.surface}>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xl">{title}</CardTitle>
          <StatusBadge
            label={CONTRACT_STATE_LABEL[contractState]}
            tone={contractState === 'stubbed' ? 'muted' : 'default'}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>הדף הזה מצומצם כרגע בכוונה.</p>
        <p>{body}</p>
      </CardContent>
    </Card>
  );
}
