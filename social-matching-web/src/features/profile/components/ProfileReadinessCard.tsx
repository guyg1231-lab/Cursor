import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { tokens } from '@/lib/design-tokens';

export function ProfileReadinessCard({ ready, isLoading }: { ready: boolean; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card className={tokens.card.surface}>
        <CardHeader>
          <CardTitle className="text-xl">מוכנות להגשה</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">טוען...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={tokens.card.surface}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <CardTitle className="text-xl">מוכנות להגשה</CardTitle>
        <StatusBadge label={ready ? 'מוכן להגשה' : 'לא מוכן להגשה'} tone={ready ? 'default' : 'muted'} />
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        {ready ? (
          <p>מוכנים להגיש למפגשים</p>
        ) : (
          <>
            <p>כדי להגיש למפגשים צריך להשלים את שאלון הפרופיל.</p>
            <Button asChild variant="primary">
              <Link to="/questionnaire">השלם את השאלון</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
