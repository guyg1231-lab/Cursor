import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/shared/PageShell';
import { RouteEmptyState, RouteErrorState } from '@/components/shared/RouteState';
import { tokens } from '@/lib/design-tokens';
import { useAuth } from '@/contexts/AuthContext';
import { getQuestionnaireReadyState } from '@/features/applications/api';
import { ApplicationLifecycleList } from '@/features/applications/components/ApplicationLifecycleList';
import { listDashboardApplications } from '@/features/events/query';
import { ProfileReadinessCard } from '@/features/profile/components/ProfileReadinessCard';
import { QuestionnaireReadinessPanel } from '@/features/profile/components/QuestionnaireReadinessPanel';

type DashboardApplication = Awaited<ReturnType<typeof listDashboardApplications>>[number];

export function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [applications, setApplications] = useState<DashboardApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applicationsLoadError, setApplicationsLoadError] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [readinessLoading, setReadinessLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!user) {
        setReadinessLoading(true);
        return;
      }
      setIsLoading(true);
      setReadinessLoading(true);
      setApplicationsLoadError(false);

      try {
        const [appsSettled, readySettled] = await Promise.allSettled([
          listDashboardApplications(user.id),
          getQuestionnaireReadyState(user.id),
        ]);
        if (!active) return;

        if (appsSettled.status === 'fulfilled') {
          setApplications(appsSettled.value ?? []);
        } else {
          setApplicationsLoadError(true);
        }

        if (readySettled.status === 'fulfilled') {
          setProfileReady(readySettled.value.ready);
        } else {
          setProfileReady(false);
        }
      } finally {
        if (active) {
          setIsLoading(false);
          setReadinessLoading(false);
        }
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
        <div className="md:col-span-2">
          <QuestionnaireReadinessPanel body="כאן יופיע הסטטוס של הפרופיל, ההגשות שלך, והשלב הבא בכל מפגש." />
        </div>
        <ProfileReadinessCard ready={profileReady} isLoading={authLoading || !user || readinessLoading} />
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
            ) : applicationsLoadError ? (
              <RouteErrorState title="שגיאה בטעינת ההגשות" body="נסו לרענן את הדף או לחזור מאוחר יותר." />
            ) : applications.length === 0 ? (
              <div className="space-y-3">
                <RouteEmptyState
                  title="אין עדיין הגשות"
                  body="כשתגישו למפגש פתוח, הסטטוס והצעדים הבאים יופיעו כאן."
                />
                <Button asChild variant="primary">
                  <Link to="/events">למפגשים פתוחים</Link>
                </Button>
              </div>
            ) : (
              <ApplicationLifecycleList applications={applications} />
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
