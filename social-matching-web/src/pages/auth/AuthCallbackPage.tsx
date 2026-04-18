import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { tokens } from '@/lib/design-tokens';
import { useAuth } from '@/contexts/AuthContext';
import { consumePostAuthReturnTo, parseSafeReturnTo, storePostAuthReturnTo } from '@/lib/authReturnTo';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading } = useAuth();

  const queryReturnTo = parseSafeReturnTo(searchParams.get('returnTo'));

  useEffect(() => {
    if (queryReturnTo) {
      storePostAuthReturnTo(queryReturnTo);
    }
  }, [queryReturnTo]);

  useEffect(() => {
    if (isLoading || !user) return;

    const destination = queryReturnTo ?? consumePostAuthReturnTo() ?? '/dashboard';
    navigate(destination, { replace: true });
  }, [isLoading, navigate, queryReturnTo, user]);

  if (isLoading || user) {
    return (
      <PageShell title="משלימים את ההתחברות" subtitle="עוד רגע נחזיר אותך להמשך בדיוק מהמקום שבו עצרת.">
        <Card className={tokens.card.surface}>
          <CardContent className="py-10 text-sm text-muted-foreground">מאמתים את הסשן ומכינים את ההמשך...</CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell title="לא הצלחנו להשלים את ההתחברות" subtitle="יכול להיות שפג תוקף הקוד או שהאימות לא הושלם עדיין.">
      <Card className={tokens.card.surface}>
        <CardHeader>
          <CardTitle className="text-xl">אפשר לנסות שוב</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>אם הקוד לא עבד או שפג תוקפו, אפשר לבקש קוד חדש ולחזור לאותו יעד.</p>
          <div className="flex gap-3">
            <Button asChild variant="primary">
              <Link to={queryReturnTo ? `/auth?returnTo=${encodeURIComponent(queryReturnTo)}` : '/auth'}>לחזרה למסך ההתחברות</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/events">למפגשים</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
