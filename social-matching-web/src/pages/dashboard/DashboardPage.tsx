import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/shared/PageShell';
import { tokens } from '@/lib/design-tokens';
import { useAuth } from '@/contexts/AuthContext';
import type { EventRegistrationRow } from '@/features/applications/types';
import {
  formatApplicationStatusShort,
  formatLifecycleDateTime,
  isAwaitingParticipantResponse,
  isConfirmedParticipation,
  isOfferExpired,
} from '@/features/applications/status';
import { listDashboardApplications, type DashboardApplicationEventRecord } from '@/features/events/query';

interface DashboardApplication extends EventRegistrationRow {
  event: DashboardApplicationEventRecord | null;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<DashboardApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!user) return;
      setIsLoading(true);
      setError(null);

      try {
        const data = await listDashboardApplications(user.id);
        if (!active) return;
        setApplications((data ?? []) as DashboardApplication[]);
      } catch {
        if (!active) return;
        setError('לא הצלחנו לטעון כרגע את ההגשות שלך.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <PageShell
      title="האזור האישי שלך"
      subtitle="כאן יופיעו הסטטוס של הפרופיל, ההגשות שלך, ומה השלב הבא בכל מפגש שאליו הגשת מועמדות."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card className={tokens.card.surface}>
          <CardHeader>
            <CardTitle className="text-xl">סטטוס פרופיל</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>הפרופיל שלך נבנה כדי לעזור לנו להבין אותך טוב יותר לפני כל הגשה.</p>
            <Button asChild variant="outline">
              <Link to="/questionnaire">לשאלון הפרופיל</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className={tokens.card.surface}>
          <CardHeader>
            <CardTitle className="text-xl">ההגשות שלך</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            {isLoading ? (
              <p>טוענים הגשות...</p>
            ) : error ? (
              <p className="text-destructive">{error}</p>
            ) : applications.length === 0 ? (
              <div className="space-y-3">
                <p>עדיין לא שלחת הגשה למפגש.</p>
                <Button asChild variant="primary">
                  <Link to="/events">למפגשים פתוחים</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((application) => (
                  <div key={application.id} className="rounded-3xl border border-border bg-background/30 p-4">
                    <p className="font-medium text-foreground">{application.event?.title ?? 'מפגש'}</p>
                    <p className="text-muted-foreground">סטטוס: {formatApplicationStatusShort(application.status)}</p>
                    {isAwaitingParticipantResponse(application.status) ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {isOfferExpired(application)
                          ? `חלון התגובה למקום הזמני נסגר${application.expires_at ? ` ב-${formatLifecycleDateTime(application.expires_at)}` : ''}.`
                          : `נשמר עבורך מקום זמני. צריך להגיב עד ${formatLifecycleDateTime(application.expires_at)}.`}
                      </p>
                    ) : isConfirmedParticipation(application.status) ? (
                      <p className="mt-2 text-sm text-muted-foreground">המקום שלך למפגש הזה כבר שמור.</p>
                    ) : null}
                    {application.event ? (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {isAwaitingParticipantResponse(application.status) ? (
                          <Button asChild size="sm" variant={isOfferExpired(application) ? 'outline' : 'primary'}>
                            <Link to={`/events/${application.event.id}/apply`}>
                              {isOfferExpired(application) ? 'לצפייה בסטטוס' : 'לתגובה על המקום הזמני'}
                            </Link>
                          </Button>
                        ) : (
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/events/${application.event.id}`}>לפרטי המפגש</Link>
                          </Button>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
