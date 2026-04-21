import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { EventNotFound } from '@/components/participant/EventNotFound';
import { tokens } from '@/lib/design-tokens';
import { useAuth } from '@/contexts/AuthContext';
import { buildAuthPath } from '@/lib/authReturnTo';
import { getVisibleEventById } from '@/features/events/api';
import { formatEventDate } from '@/features/events/formatters';
import type { VisibleEvent } from '@/features/events/types';
import {
  getExistingApplication,
} from '@/features/applications/api';
import type { EventRegistrationRow } from '@/features/applications/types';
import {
  formatApplicationStatusShort,
  formatLifecycleDateTime,
  isOfferExpired,
} from '@/features/applications/status';

export function GatheringPage() {
  const { eventId } = useParams();
  const { user, isLoading: authLoading } = useAuth();

  const [event, setEvent] = useState<VisibleEvent | null>(null);
  const [registration, setRegistration] = useState<EventRegistrationRow | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

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
        if (!active) return;

        setEvent(visibleEvent);

        if (visibleEvent && user) {
          const existing = await getExistingApplication(visibleEvent.id, user.id);
          if (!active) return;
          setRegistration(existing);
        } else if (active) {
          setRegistration(null);
        }
      } catch {
        if (!active) return;
        setLoadError('לא הצלחנו לטעון את המפגש כרגע.');
      } finally {
        if (active) setPageLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [authLoading, eventId, user]);

  const returnTo = eventId ? `/gathering/${eventId}` : null;

  if (pageLoading) {
    return (
      <PageShell title="מפגש" subtitle="טוענים את פרטי המפגש...">
        <Card className={tokens.card.surface}>
          <CardContent className="py-10 text-sm text-muted-foreground">טוענים...</CardContent>
        </Card>
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

  const trimmedDescription = event.description?.trim() || null;

  return (
    <PageShell
      title={event.title}
      subtitle="כאן רואים מה קורה אחרי ההגשה, ומה הצעד הבא אם נשמר עבורך מקום או סטטוס מעודכן."
    >
      <PageActionBar>
        <Button asChild variant="primary">
          <Link to={`/events/${event.id}/apply`}>להגשה ולסטטוס</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={`/events/${event.id}`}>לפרטי המפגש</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/dashboard">לאזור האישי</Link>
        </Button>
      </PageActionBar>
      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <Card className={tokens.card.accent}>
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl md:text-3xl leading-tight">{event.title}</CardTitle>
            {trimmedDescription ? (
              <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-line">
                {trimmedDescription}
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-5 text-sm text-foreground/85 leading-relaxed">
            <div className={tokens.card.inner + ' p-4 space-y-2'}>
              <p><strong className="text-foreground">מתי:</strong> {formatEventDate(event.starts_at)}</p>
              <p><strong className="text-foreground">עיר:</strong> {event.city}</p>
              <p><strong className="text-foreground">רמז למיקום:</strong> {event.venue_hint ?? 'יישלח בהמשך'}</p>
              <p><strong className="text-foreground">קיבולת:</strong> {event.max_capacity ?? 'קבוצה קטנה'}</p>
              <p>
                <strong className="text-foreground">דדליין להגשה:</strong>{' '}
                {event.registration_deadline ? formatEventDate(event.registration_deadline) : 'אין כרגע'}
              </p>
            </div>

            <div className="pt-4 border-t border-border/40">
              <StatusPanel
                user={!!user}
                event={event}
                registration={registration}
                applyHref={`/events/${event.id}/apply`}
                signInHref={buildAuthPath(returnTo)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className={tokens.card.surface}>
          <CardHeader>
            <CardTitle className="text-xl">מתי משתמשים בעמוד הזה?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>1. להגשה ראשונה או לצפייה מלאה בסטטוס משתמשים בעמוד ההגשה הראשי.</p>
            <p>2. כאן אפשר לחזור כדי לראות מה קרה אחרי ההגשה ולענות אם נשמר עבורך מקום זמני.</p>
            <p>3. פרטי המפגש נשארים זמינים גם מכאן, בלי לפתוח מסלול הגשה נוסף.</p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function StatusPanel(props: {
  user: boolean;
  event: VisibleEvent;
  registration: EventRegistrationRow | null;
  applyHref: string;
  signInHref: string;
}) {
  const { user, event, registration, applyHref, signInHref } = props;

  if (!user) {
    return (
      <div className="rounded-3xl border border-primary/10 bg-background/30 p-4 text-sm space-y-3">
        <p className="font-medium text-foreground">כדי לראות סטטוס או להגיב צריך להיכנס לחשבון</p>
        <p className="text-muted-foreground">
          ההגשה הראשונה מתבצעת בעמוד ההגשה הראשי. אחרי ההתחברות נחזיר אותך למסך הזה אם הגעת לכאן כדי לבדוק סטטוס.
        </p>
        <Button asChild variant="primary">
          <Link to={signInHref}>להיכנס להגשה ולסטטוס</Link>
        </Button>
      </div>
    );
  }

  if (!registration) {
    if (!event.is_registration_open) {
      return (
        <div className="rounded-3xl border border-border bg-background/30 p-4 text-sm text-muted-foreground space-y-3">
          <p className="font-medium text-foreground">אין כרגע הגשה שמחוברת למפגש הזה</p>
          <p>ההגשות למפגש הזה אינן פתוחות כרגע, ולכן אין מה לנהל מכאן בשלב הזה.</p>
          <Button asChild variant="outline">
            <Link to={`/events/${event.id}`}>לפרטי המפגש</Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="rounded-3xl border border-primary/10 bg-background/30 p-4 text-sm space-y-3">
        <p className="font-medium text-foreground">להגשה ראשונה משתמשים בעמוד ההגשה הראשי</p>
        <p className="text-muted-foreground">
          כאן חוזרים אחרי שהוגשה בקשה, או כשצריך להגיב על מקום זמני. כדי להתחיל את ההגשה למפגש הזה, עברו לעמוד ההגשה והסטטוס.
        </p>
        <Button asChild variant="primary">
          <Link to={applyHref}>להגשה ולסטטוס</Link>
        </Button>
      </div>
    );
  }

  const status = registration.status;

  if (status === 'pending') {
    return (
      <div className="rounded-3xl border border-primary/10 bg-background/30 p-4 text-sm space-y-2">
        <p className="font-medium text-foreground">הבקשה שלך נשמרה</p>
        <p className="text-muted-foreground">
          נחזור אליך כשיש מקום במפגש הזה. אין מה לעשות כרגע מהצד שלך.
        </p>
      </div>
    );
  }

  if (status === 'awaiting_response') {
    const expired = isOfferExpired(registration);
    return (
      <div className="rounded-3xl border border-primary/20 bg-background/30 p-4 text-sm space-y-3">
        <p className="font-medium text-foreground">
          {expired ? 'חלון התגובה נסגר' : 'נשמר עבורך מקום במפגש'}
        </p>
        <p className="text-muted-foreground">
          {expired
            ? `הדדליין לתגובה עבר${registration.expires_at ? ` ב-${formatLifecycleDateTime(registration.expires_at)}` : ''}.`
            : `צריך להגיב עד ${formatLifecycleDateTime(registration.expires_at)}.`}
        </p>
        <p className="text-muted-foreground">התגובה עצמה מתבצעת בעמוד ההגשה והסטטוס הראשי.</p>
        <Button asChild variant="primary">
          <Link to={applyHref}>להגשה ולסטטוס</Link>
        </Button>
      </div>
    );
  }

  if (status === 'confirmed' || status === 'approved') {
    return (
      <div className="rounded-3xl border border-primary/10 bg-background/30 p-4 text-sm space-y-2">
        <p className="font-medium text-foreground">המקום שלך במפגש שמור</p>
        <p className="text-muted-foreground">
          נתראה ב-{formatEventDate(event.starts_at)}. נשלח פרטי מיקום סופיים לפני המפגש.
        </p>
      </div>
    );
  }

  if (status === 'attended') {
    return (
      <div className="rounded-3xl border border-primary/10 bg-background/30 p-4 text-sm space-y-2">
        <p className="font-medium text-foreground">תודה שהצטרפת למפגש</p>
        <p className="text-muted-foreground">ההשתתפות שלך נרשמה.</p>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="rounded-3xl border border-border bg-background/30 p-4 text-sm space-y-2">
        <p className="font-medium text-foreground">הפעם זה לא יצא</p>
        <p className="text-muted-foreground">לא נמצא לך מקום במפגש הזה. נשמח לראות אותך במפגש אחר.</p>
      </div>
    );
  }

  const submittedAnswers = parseAnswers(registration.application_answers);
  return (
    <div className="rounded-3xl border border-border bg-background/30 p-4 text-sm space-y-2">
      <p className="font-medium text-foreground">הסטטוס הנוכחי שלך: {formatApplicationStatusShort(status)}</p>
      {submittedAnswers ? (
        <p className="text-muted-foreground">
          הגשת ב-{new Date(submittedAnswers.submitted_at).toLocaleString('he-IL')}.
        </p>
      ) : null}
    </div>
  );
}

function parseAnswers(value: unknown): { submitted_at: string } | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.submitted_at !== 'string') return null;
  return { submitted_at: record.submitted_at };
}
