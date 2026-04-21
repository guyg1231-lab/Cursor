import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/shared/PageShell';
import { RouteEmptyState, RouteErrorState, RouteLoadingState } from '@/components/shared/RouteState';
import { tokens } from '@/lib/design-tokens';
import { useAuth } from '@/contexts/AuthContext';
import { getQuestionnaireReadyState } from '@/features/applications/api';
import { ApplicationLifecycleList } from '@/features/applications/components/ApplicationLifecycleList';
import { listDashboardApplications } from '@/features/events/query';
import { waitForSupabaseSessionUser } from '@/lib/waitForSupabaseSession';
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
    let stale = false;

    async function load() {
      if (authLoading) return;
      if (!user) {
        setReadinessLoading(false);
        setIsLoading(false);
        setApplications([]);
        return;
      }
      setIsLoading(true);
      setReadinessLoading(true);
      setApplicationsLoadError(false);

      try {
        const sessionOk = await waitForSupabaseSessionUser(user.id);
        if (stale) return;

        if (!sessionOk) {
          console.warn('[DashboardPage] Supabase session not synced after auth');
          setApplications([]);
          setApplicationsLoadError(true);
          setProfileReady(false);
        } else {
          const [appsSettled, readySettled] = await Promise.allSettled([
            listDashboardApplications(user.id),
            getQuestionnaireReadyState(user.id),
          ]);
          if (stale) return;

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
        }
      } finally {
        if (!stale) {
          setIsLoading(false);
          setReadinessLoading(false);
        }
      }
    }

    void load();
    return () => {
      stale = true;
    };
  }, [authLoading, user]);

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
            <CardTitle className="text-xl font-semibold tracking-[-0.015em]">סטטוס פרופיל</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground leading-7">
            <p>הפרופיל שלך נבנה כדי לעזור לנו להבין אותך טוב יותר לפני כל הגשה.</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link to="/questionnaire">לשאלון הפרופיל</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/events/propose">להציע מפגש חדש</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className={tokens.card.surface}>
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-[-0.015em]">ההגשות שלך</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-7">
            {isLoading ? (
              <RouteLoadingState title="טוענים הגשות..." body="אוספים את ההגשות והסטטוסים שלך." />
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
