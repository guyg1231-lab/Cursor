import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { RouteLoadingState } from '@/components/shared/RouteState';
import { EventNotFound } from '@/components/participant/EventNotFound';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { tokens } from '@/lib/design-tokens';
import { useAuth } from '@/contexts/AuthContext';
import { buildAuthPath } from '@/lib/authReturnTo';
import { getVisibleEventById } from '@/features/events/api';
import { formatEventAreaHint, formatEventCapacityLabel, formatEventDate } from '@/features/events/formatters';
import type { VisibleEvent } from '@/features/events/types';
import { getExistingApplication } from '@/features/applications/api';
import { waitForSupabaseSessionUser } from '@/lib/waitForSupabaseSession';
import type { EventRegistrationRow } from '@/features/applications/types';
import {
  canReapplyToEvent,
  isAwaitingParticipantResponse,
  isOfferExpired,
} from '@/features/applications/status';
import { ApplicationStatusPanel } from '@/features/applications/components/ApplicationStatusPanel';
import { resolveApplicationBadgeTone, resolveApplicationPanelContent } from '@/features/applications/presentation';

export function GatheringPage() {
  const { eventId } = useParams();
  const { user, isLoading: authLoading } = useAuth();

  const [event, setEvent] = useState<VisibleEvent | null>(null);
  const [registration, setRegistration] = useState<EventRegistrationRow | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let stale = false;

    async function load() {
      if (authLoading) return;
      if (!eventId) {
        setLoadError('לא נמצא מזהה מפגש.');
        setPageLoading(false);
        return;
      }

      setPageLoading(true);
      setLoadError(null);

      try {
        const visibleEvent = await getVisibleEventById(eventId);
        if (stale) return;

        setEvent(visibleEvent);

        if (visibleEvent && user) {
          const sessionReady = await waitForSupabaseSessionUser(user.id);
          if (stale) return;
          if (!sessionReady) {
            console.warn('[GatheringPage] Supabase session not synced; skipping registration load');
            setRegistration(null);
          } else {
            const existing = await getExistingApplication(visibleEvent.id, user.id);
            if (stale) return;
            setRegistration(existing);
          }
        } else {
          setRegistration(null);
        }
      } catch (e) {
        if (stale) return;
        console.error('[GatheringPage] load failed', e);
        setLoadError('לא הצלחנו לטעון את המפגש כרגע.');
      } finally {
        if (!stale) setPageLoading(false);
      }
    }

    void load();
    return () => {
      stale = true;
    };
  }, [authLoading, eventId, user]);

  const returnTo = eventId ? `/gathering/${eventId}` : null;

  if (pageLoading) {
    return (
      <PageShell title="מפגש" subtitle="טוענים את פרטי המפגש...">
        <RouteLoadingState title="טוענים..." body="אוספים כרגע את תמונת המפגש." />
      </PageShell>
    );
  }

  if (loadError) {
    return (
      <PageShell title="מפגש" subtitle="לא הצלחנו לטעון את המפגש כרגע.">
        <Card className={tokens.card.surface}>
          <CardContent className="py-10 text-sm text-destructive">{loadError}</CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!event) {
    return <EventNotFound />;
  }

  if (eventId && eventId !== event.id) {
    return <Navigate to={`/gathering/${event.id}`} replace />;
  }

  const trimmedDescription = event.description?.trim() || null;

  return (
    <PageShell
      title={event.title}
      subtitle="זהו מסך מעקב קצר מקישור ישיר. להגשה ולסטטוס המלא משתמשים במסלול האירוע הראשי."
    >
      <PageActionBar variant="participant">
        <Button asChild variant="primary">
          <Link to={`/events/${event.id}/apply`}>להגשה ולסטטוס</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={`/events/${event.id}`}>לפרטי המפגש</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/events">חזרה לאירועים</Link>
        </Button>
      </PageActionBar>
      <div className="grid gap-4 md:grid-cols-[1.08fr_0.92fr]">
        <Card data-testid="participant-surface-panel" className={tokens.card.surface}>
          <CardContent className="space-y-4 py-6 text-sm leading-7 text-muted-foreground">
            <div className={tokens.card.inner + ' space-y-2 p-4'}>
              <p className={tokens.typography.eyebrow}>קישור ישיר למפגש</p>
              {trimmedDescription ? <p className="text-foreground/85">{trimmedDescription}</p> : null}
              <p className="text-foreground/85">
                המידע המלא והפעולות נשמרים במסלול הראשי: פרטי אירוע ולאחר מכן עמוד ההגשה והסטטוס.
              </p>
            </div>

            <div className={tokens.card.inner + ' grid gap-3 p-4 sm:grid-cols-2'}>
              <div className="space-y-1">
                <p className={tokens.typography.eyebrow}>מתי</p>
                <p className="text-foreground">{formatEventDate(event.starts_at)}</p>
              </div>
              <div className="space-y-1">
                <p className={tokens.typography.eyebrow}>איפה בערך</p>
                <p className="text-foreground">{formatEventAreaHint(event)}</p>
              </div>
              <div className="space-y-1">
                <p className={tokens.typography.eyebrow}>קבוצה</p>
                <p className="text-foreground">{formatEventCapacityLabel(event)}</p>
              </div>
              <div className="space-y-1">
                <p className={tokens.typography.eyebrow}>חלון הגשה</p>
                <p className="text-foreground">
                  {event.registration_deadline ? `עד ${formatEventDate(event.registration_deadline)}` : 'פתוח כרגע'}
                </p>
              </div>
            </div>

            <BridgeStatusPanel
              user={!!user}
              event={event}
              registration={registration}
              applyHref={`/events/${event.id}/apply`}
              signInHref={buildAuthPath(returnTo)}
            />
          </CardContent>
        </Card>

        <Card data-testid="participant-surface-panel" className={tokens.card.surface}>
          <CardContent className="space-y-3 py-6 text-sm leading-7 text-muted-foreground">
            <p className={tokens.typography.eyebrow}>מה הכי נכון לעשות מכאן</p>
            <p>1. להגשה ראשונה ולסטטוס מלא נכנסים לעמוד ההגשה הראשי של האירוע.</p>
            <p>2. אם נשמר עבורך מקום זמני, התגובה עצמה מתבצעת במסלול הראשי.</p>
            <p>3. בעמוד הזה נשארת תמונת מצב קצרה למי שהגיע מקישור ישיר.</p>
            <div className="pt-2">
              <Button asChild variant="outline" className="w-full">
                <Link to={`/events/${event.id}`}>לפרטי המפגש</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function BridgeStatusPanel(props: {
  user: boolean;
  event: VisibleEvent;
  registration: EventRegistrationRow | null;
  applyHref: string;
  signInHref: string;
}) {
  const { user, event, registration, applyHref, signInHref } = props;

  if (!user) {
    return (
      <div className={tokens.card.inner + ' space-y-3 p-4'}>
        <p className="font-medium text-foreground">כדי לראות סטטוס אישי צריך כניסה לחשבון</p>
        <p>אחרי ההתחברות אפשר להמשיך ישירות לעמוד ההגשה והסטטוס הראשי של האירוע.</p>
        <Button asChild variant="primary">
          <Link to={signInHref}>להיכנס להגשה ולסטטוס</Link>
        </Button>
      </div>
    );
  }

  if (!registration) {
    if (!event.is_registration_open) {
      return (
        <div className={tokens.card.inner + ' space-y-3 p-4'}>
          <p className="font-medium text-foreground">אין כרגע הגשה פעילה למפגש הזה</p>
          <p>חלון ההגשה סגור כרגע. אפשר לעבור לפרטי המפגש ולהמשיך לעקוב משם.</p>
          <Button asChild variant="outline">
            <Link to={`/events/${event.id}`}>לפרטי המפגש</Link>
          </Button>
        </div>
      );
    }

    return (
      <div className={tokens.card.inner + ' space-y-3 p-4'}>
        <p className="font-medium text-foreground">להגשה ראשונה משתמשים במסלול הראשי</p>
        <p>כדי להתחיל, עברו לעמוד ההגשה והסטטוס של האירוע.</p>
        <Button asChild variant="primary">
          <Link to={applyHref}>להגשה ולסטטוס</Link>
        </Button>
      </div>
    );
  }

  const panel = resolveApplicationPanelContent(registration);
  const awaitingResponse = isAwaitingParticipantResponse(registration.status);
  const offerExpired = isOfferExpired(registration);
  const showApplyCta = awaitingResponse || canReapplyToEvent(registration.status);

  return (
    <div className="space-y-3">
      <StatusBadge label={panel.title} tone={resolveApplicationBadgeTone(registration.status)} />
      <ApplicationStatusPanel title={panel.title} body={panel.body} footer={panel.footer ? <p>{panel.footer}</p> : undefined} />
      {showApplyCta ? (
        <Button asChild variant={awaitingResponse && !offerExpired ? 'primary' : 'outline'}>
          <Link to={applyHref}>{awaitingResponse && !offerExpired ? 'למקום הזמני ולתגובה' : 'להגשה ולסטטוס'}</Link>
        </Button>
      ) : null}
    </div>
  );
}
