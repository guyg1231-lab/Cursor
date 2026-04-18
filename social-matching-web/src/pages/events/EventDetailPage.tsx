import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { PageShell } from '@/components/shared/PageShell';
import { SectionDivider } from '@/components/shared/SectionDivider';
import { tokens } from '@/lib/design-tokens';
import { getVisibleEventById } from '@/features/events/api';
import { formatEventDate } from '@/features/events/formatters';
import type { VisibleEvent } from '@/features/events/types';
import { useAuth } from '@/contexts/AuthContext';
import { getExistingApplication } from '@/features/applications/api';
import type { EventRegistrationRow } from '@/features/applications/types';
import {
  canReapplyToEvent,
  formatApplicationStatusDetailed,
  formatLifecycleDateTime,
  isAwaitingParticipantResponse,
  isConfirmedParticipation,
  isOfferExpired,
} from '@/features/applications/status';

export function EventDetailPage() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<VisibleEvent | null>(null);
  const [application, setApplication] = useState<EventRegistrationRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!eventId) {
        setError('לא נמצא מזהה מפגש.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const visibleEvent = await getVisibleEventById(eventId);
        if (!active) return;

        if (!visibleEvent) {
          setEvent(null);
          setApplication(null);
          setIsLoading(false);
          return;
        }

        setEvent(visibleEvent);

        if (user) {
          const existing = await getExistingApplication(visibleEvent.id, user.id);
          if (!active) return;
          setApplication(existing);
        } else if (active) {
          setApplication(null);
        }
      } catch {
        if (!active) return;
        setError('לא הצלחנו לטעון את פרטי המפגש כרגע.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [eventId, user]);

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
        <Card className={tokens.card.surface}>
          <CardContent className="py-10 text-sm text-destructive">{error}</CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!event) {
    return (
      <PageShell title="המפגש לא נמצא" subtitle="יכול להיות שהוא כבר לא פומבי, או שהקישור אינו תקין.">
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

  const hasApplication = !!application;
  const awaitingResponse = application ? isAwaitingParticipantResponse(application.status) : false;
  const offerExpired = application ? isOfferExpired(application) : false;
  const confirmedParticipation = application ? isConfirmedParticipation(application.status) : false;

  return (
    <PageShell title={event.title} subtitle={event.description ?? 'מפגש קטן עם תהליך ברור יותר מרנדומליות.'}>
      <PageActionBar>
        <Button asChild variant="outline">
          <Link to="/events">חזרה לכל המפגשים</Link>
        </Button>
        {awaitingResponse ? (
          <Button asChild variant={offerExpired ? 'outline' : 'primary'}>
            <Link to={`/events/${event.id}/apply`}>
              {offerExpired ? 'לצפייה בסטטוס ההרשמה' : 'למקום הזמני ולתגובה'}
            </Link>
          </Button>
        ) : hasApplication && !canReapplyToEvent(application!.status) ? (
          <Button asChild variant="outline">
            <Link to={`/events/${event.id}/apply`}>לסטטוס ההרשמה</Link>
          </Button>
        ) : event.is_registration_open ? (
          <Button asChild variant="primary">
            <Link to={`/events/${event.id}/apply`}>
              {application ? 'להגיש שוב' : 'להגיש מועמדות'}
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link to="/events">חזרה למפגשים</Link>
          </Button>
        )}
      </PageActionBar>

      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <Card className={tokens.card.accent}>
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl leading-tight">{event.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-foreground/85 leading-relaxed">
            <div className={tokens.card.inner + ' p-4 space-y-2'}>
              <p><strong className="text-foreground">מתי:</strong> {formatEventDate(event.starts_at)}</p>
              <p><strong className="text-foreground">עיר:</strong> {event.city}</p>
              <p><strong className="text-foreground">רמז למיקום:</strong> {event.venue_hint ?? 'יישלח בהמשך אם צריך'}</p>
              <p><strong className="text-foreground">קיבולת:</strong> {event.max_capacity ?? 'קבוצה קטנה'}</p>
              <p><strong className="text-foreground">דדליין להגשה:</strong> {event.registration_deadline ? formatEventDate(event.registration_deadline) : 'אין כרגע'}</p>
            </div>

            <p>
              אחרי ההגשה נשמור את הסטטוס שלך למפגש הזה, ונעדכן אותך כאן אם יישמר עבורך מקום זמני שדורש תגובה.
            </p>

            {awaitingResponse ? (
              <div className="rounded-3xl border border-primary/20 bg-background/30 p-4 text-sm space-y-2">
                <p className="font-medium text-foreground">
                  {offerExpired ? 'חלון התגובה למקום הזמני נסגר' : 'נשמר עבורך מקום זמני'}
                </p>
                <p className="text-muted-foreground">
                  {offerExpired
                    ? `המקום הזמני שהיה שמור עבורך כבר לא מחכה לתגובה. הדדליין עבר${application?.expires_at ? ` ב-${formatLifecycleDateTime(application.expires_at)}` : ''}.`
                    : `כדי לשמור על המקום צריך להיכנס למסך ההרשמה ולאשר עד ${formatLifecycleDateTime(application?.expires_at ?? null)}.`}
                </p>
              </div>
            ) : confirmedParticipation ? (
              <div className="rounded-3xl border border-primary/10 bg-background/30 p-4 text-sm">
                <p className="font-medium text-foreground">המקום שלך למפגש הזה כבר שמור</p>
                <p className="text-muted-foreground">{formatApplicationStatusDetailed(application!.status)}</p>
              </div>
            ) : application && !canReapplyToEvent(application.status) ? (
              <div className="rounded-3xl border border-primary/10 bg-background/30 p-4 text-sm">
                <p className="font-medium text-foreground">כבר קיימת הגשה למפגש הזה</p>
                <p className="text-muted-foreground">{formatApplicationStatusDetailed(application.status)}</p>
              </div>
            ) : application ? (
              <div className="rounded-3xl border border-primary/10 bg-background/30 p-4 text-sm">
                <p className="font-medium text-foreground">הייתה לך הגשה קודמת למפגש הזה</p>
                <p className="text-muted-foreground">
                  {formatApplicationStatusDetailed(application.status)}. אם המפגש עדיין פתוח, אפשר להגיש שוב.
                </p>
              </div>
            ) : !event.is_registration_open ? (
              <div className="rounded-3xl border border-border bg-background/30 p-4 text-sm text-muted-foreground">
                ההגשות למפגש הזה אינן פתוחות כרגע.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className={tokens.card.surface}>
          <CardHeader>
            <CardTitle className="text-xl">מה חשוב לדעת?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>• במסך הזה מוצגים גם אירועים פומביים שעדיין פתוחים וגם אירועים פומביים שכבר נסגרו להגשה.</p>
            <p>• ההגשה עצמה נשמרת כעת ב-`event_registrations` כמצב ה-MVP הראשון.</p>
            <p>• זהו מודל מעבר לבלוק הזה — לא בהכרח המודל הסופי של הדומיין.</p>
          </CardContent>
        </Card>
      </div>

      <SectionDivider />

      <Card className={tokens.card.surface}>
        <CardHeader>
          <CardTitle className="text-xl">מה קורה אחרי שמגישים?</CardTitle>
        </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>1. שומרים את ההגשה שלך למפגש הספציפי.</p>
            <p>2. אם נפתח עבורך מקום זמני, יופיע כאן דדליין ברור לתגובה.</p>
            <p>3. אחרי אישור התגובה, המקום שלך נשמר סופית למפגש.</p>
          </CardContent>
        </Card>
      </PageShell>
  );
}
