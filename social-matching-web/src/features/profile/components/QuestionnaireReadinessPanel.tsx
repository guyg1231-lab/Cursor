import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { tokens } from '@/lib/design-tokens';

export function QuestionnaireReadinessPanel({
  body,
  footer,
}: {
  body: string;
  footer?: ReactNode;
}) {
  return (
    <Card className={tokens.card.surface}>
      <CardHeader>
        <CardTitle className="text-xl">לפני ההגשה הבאה</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>{body}</p>
        {footer}
      </CardContent>
    </Card>
  );
}
