import { Link } from 'react-router-dom';
import { PageShell } from '@/components/shared/PageShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { tokens } from '@/lib/design-tokens';

export function EventNotFound() {
  return (
    <PageShell
      title="המפגש לא נמצא"
      subtitle="יכול להיות שהוא כבר לא פומבי, או שהקישור אינו תקין."
    >
      <Card className={tokens.card.surface}>
        <CardContent className="space-y-4 py-8 text-sm text-muted-foreground">
          <p>לא מצאנו מפגש פומבי שמתאים לקישור הזה.</p>
          <Button asChild variant="outline">
            <Link to="/events">חזרה לכל המפגשים</Link>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
