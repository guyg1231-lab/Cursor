import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { PageShell } from '@/components/shared/PageShell';
import { RouteErrorState } from '@/components/shared/RouteState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { tokens } from '@/lib/design-tokens';
import { getVisibleEventById } from '@/features/events/api';
import {
  formatEventCapacityLabel,
  formatEventDate,
  formatVisibleEventRegistrationState,
} from '@/features/events/formatters';
import type { VisibleEvent } from '@/features/events/types';
import { useAuth } from '@/contexts/AuthContext';
import { getExistingApplication } from '@/features/applications/api';
import type { EventRegistrationRow } from '@/features/applications/types';
import {
  canReapplyToEvent,
  formatApplicationStatusShort,
  isAwaitingParticipantResponse,
  isOfferExpired,
} from '@/features/applications/status';
import { ApplicationStatusPanel } from '@/features/applications/components/ApplicationStatusPanel';
import { resolveApplicationBadgeTone, resolveApplicationPanelContent } from '@/features/applications/presentation';
import { EventNotFound } from '@/components/participant/EventNotFound';
import { EventIdentityHero } from '@/features/events/components/EventIdentityHero';
import { waitForSupabaseSessionUser } from '@/lib/waitForSupabaseSession';

export function EventDetailPage() {
  const { eventId } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const [event, setEvent] = useState<VisibleEvent | null>(null);
  const [application, setApplication] = useState<EventRegistrationRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stale = false;

    async function load() {
      if (authLoading) return;
      if (!eventId) {
        setError('לא נמצא מזהה מפגש.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const visibleEvent = await getVisibleEventById(eventId);
        if (stale) return;

        if (!visibleEvent) {
          setEvent(null);
          setApplication(null);
          return;
        }

        setEvent(visibleEvent);

        if (user) {
          const sessionReady = await waitForSupabaseSessionUser(user.id);
          if (stale) return;
          if (!sessionReady) {
            console.warn('[EventDetailPage] Supabase session not synced; showing event without registration row');
            setApplication(null);
          } else {
            try {
              const existing = await getExistingApplication(visibleEvent.id, user.id);
              if (stale) return;
              setApplication(existing);
            } catch (applicationError) {
              if (stale) return;
              // Event details are the primary content; do not fail the page when the optional
              // per-user registration lookup has a transient RLS/session/network issue.
              console.error('[EventDetailPage] registration lookup failed', applicationError);
              setApplication(null);
            }
          }
        } else {
          setApplication(null);
        }
      } catch (e) {
        if (stale) return;
        console.error('[EventDetailPage] load failed', e);
        setError('לא הצלחנו לטעון את פרטי המפגש כרגע.');
      } finally {
        if (!stale) setIsLoading(false);
      }
    }

    void load();
    return () => {
      stale = true;
    };
  }, [authLoading, eventId, user]);

  if (isLoading) {
    return (
      <PageShell title="פרטי מפגש" subtitle="טוענים את פרטי המפגש...">
        <Card className={tokens.card.surface}>
          <CardContent className="py-10 text-sm text-muted-foreground">טוענים פרטים...</CardContent>
        </Card>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="פרטי מפגש" subtitle="לא הצלחנו לטעון את הפרטים כרגע.">
        <RouteErrorState title="לא הצלחנו לטעון את פרטי המפגש" body={error} />
      </PageShell>
    );
  }

  if (!event) {
    return <EventNotFound />;
  }

  if (eventId && eventId !== event.id) {
    return <Navigate to={`/events/${event.id}`} replace />;
  }

  const hasApplication = !!application;
  const awaitingResponse = application ? isAwaitingParticipantResponse(application.status) : false;
  const offerExpired = application ? isOfferExpired(application) : false;
  const applicationPanelContent = application ? resolveApplicationPanelContent(application) : null;
  const registrationState = formatVisibleEventRegistrationState(event);
  const capacityLabel = formatEventCapacityLabel(event);
  const detailSubtitle = event.is_registration_open
    ? 'כל הפרטים כדי להבין את אופי המפגש והאם הוא מתאים לך.'
    : 'ההרשמה סגורה כרגע, אבל כל הפרטים נשארים כאן כדי לאפשר החלטה שקטה וברורה.';
  const shellSubtitle = event.is_registration_open
    ? 'כאן רואים את האווירה, האזור והשלבים הבאים במקום אחד ברור.'
    : 'גם אחרי סגירת ההגשה, העמוד נשאר פתוח כדי לשמור על תמונה מלאה.';

  return (
    <PageShell title="פרטי המפגש" subtitle={shellSubtitle}>
      <PageActionBar variant="participant">
        <Button asChild variant="outline">
          <Link to="/events">חזרה לכל המפגשים</Link>
        </Button>
        {awaitingResponse ? (
          <Button asChild variant={offerExpired ? 'outline' : 'primary'}>
            <Link to={`/events/${event.id}/apply`}>
              {offerExpired ? 'לצפייה בסטטוס ההרשמה' : 'לתגובה על מקום זמני'}
            </Link>
          </Button>
        ) : hasApplication && !canReapplyToEvent(application!.status) ? (
          <Button asChild variant="outline">
            <Link to={`/events/${event.id}/apply`}>להרשמה וסטטוס</Link>
          </Button>
        ) : event.is_registration_open ? (
          <Button asChild variant="primary">
            <Link to={`/events/${event.id}/apply`}>להרשמה וסטטוס</Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link to="/events">חזרה למפגשים</Link>
          </Button>
        )}
      </PageActionBar>

      <div className="grid gap-4 md:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-4">
          <EventIdentityHero
            event={event}
            eyebrow="המפגש שפתוח לפניך"
            subtitle={detailSubtitle}
            socialDetail="הקבוצה מתחילה להיווצר"
            badges={
              <>
                <StatusBadge label={registrationState.label} tone={registrationState.tone} />
                <StatusBadge label={capacityLabel} tone="muted" />
              </>
            }
          />

          {application && applicationPanelContent ? (
            <div className="space-y-2">
              <StatusBadge
                label={formatApplicationStatusShort(application.status)}
                tone={resolveApplicationBadgeTone(application.status)}
              />
              <ApplicationStatusPanel
                title={applicationPanelContent.title}
                body={applicationPanelContent.body}
                footer={applicationPanelContent.footer ? <p>{applicationPanelContent.footer}</p> : undefined}
              />
            </div>
          ) : !event.is_registration_open ? (
            <Card data-testid="participant-surface-panel" className={tokens.card.surface}>
              <CardContent className="space-y-2 py-6 text-sm leading-7 text-muted-foreground">
                <p className="font-medium text-foreground">ההגשות למפגש הזה אינן פתוחות כרגע.</p>
                <p>העמוד נשאר פתוח כדי לאפשר הבנה רגועה של המפגש גם אחרי שהחלון נסגר.</p>
              </CardContent>
            </Card>
          ) : null}

          {event.description ? (
            <Card data-testid="participant-surface-panel" className={tokens.card.surface}>
              <CardHeader>
                <CardTitle className="text-xl font-semibold tracking-[-0.015em]">איך המפגש הזה מרגיש?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
                <div className={tokens.card.inner + ' space-y-2 p-4'}>
                  <p className="text-foreground/85">{event.description}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={tokens.card.inner + ' space-y-2 p-4'}>
                    <p className={tokens.typography.eyebrow}>מה קורה אחרי ההגשה</p>
                    <p>הסטטוס שלך נשמר למפגש הזה, ואם ייפתח עבורך מקום זמני נחזור לכאן עם צעד ברור להמשך.</p>
                  </div>
                  <div className={tokens.card.inner + ' space-y-2 p-4'}>
                    <p className={tokens.typography.eyebrow}>איך מחליטים</p>
                    <p>לפני אישור מקום סופי עוברים על כל הגשה באופן אנושי, כדי לשמור על מעגל מדויק ונעים.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card data-testid="participant-surface-panel" className={tokens.card.surface}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-[-0.015em]">מה חשוב לדעת?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
              <div className={tokens.card.inner + ' space-y-2 p-4'}>
                <p className={tokens.typography.eyebrow}>חלון ההגשה</p>
                {event.is_registration_open ? (
                  <>
                    <p className="font-medium text-foreground">
                      {event.registration_deadline
                        ? `ההגשה פתוחה כרגע עד ${formatEventDate(event.registration_deadline)}.`
                        : 'ההרשמה פתוחה כרגע.'}
                    </p>
                    <p>זה עדיין מסלול אישי וממוקד, לא הרשמה אוטומטית ולא מערכת המונית.</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-foreground">
                      ההרשמה סגורה כרגע, אבל אפשר עדיין להבין אם המפגש הזה מתאים לך.
                    </p>
                    <p>העמוד נשאר פתוח כדי לתת תמונה מלאה במקום דף מת או לא ברור.</p>
                  </>
                )}
              </div>
              <div className={tokens.card.inner + ' space-y-2 p-4'}>
                <p className={tokens.typography.eyebrow}>מיקום ופרטיות</p>
                <p>הכתובת המדויקת נשלחת רק אחרי שיש התאמה, כדי לשמור על תחושת אינטימיות ובטיחות.</p>
              </div>
              <div className={tokens.card.inner + ' space-y-2 p-4'}>
                <p className={tokens.typography.eyebrow}>מי עובר על ההגשות</p>
                <p>לפני אישור מקום סופי בודקים כל הגשה בצורה אנושית, ולא רק טכנית.</p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="participant-surface-panel" className={tokens.card.surface}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-[-0.015em]">מה קורה אחרי שמגישים?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                'שומרים את ההגשה שלך למפגש הספציפי הזה.',
                'בודקים התאמה באופן אנושי, כדי שהמעגל יישאר מדויק ונעים.',
                'אם נפתח עבורך מקום זמני, יופיע כאן דדליין ברור לתגובה.',
                'אחרי אישור התגובה, המקום שלך נשמר סופית למפגש.',
              ].map((step, index) => (
                <div key={step} className="flex items-start gap-3 rounded-[24px] border border-border/60 bg-background/60 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-7 text-muted-foreground">{step}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
