import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { tokens } from '@/lib/design-tokens';

export function ApplicationStatusPanel({
  title,
  body,
  footer,
}: {
  title: string;
  body: string;
  footer?: ReactNode;
}) {
  return (
    <Card className={tokens.card.surface}>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>{body}</p>
        {footer}
      </CardContent>
    </Card>
  );
}
