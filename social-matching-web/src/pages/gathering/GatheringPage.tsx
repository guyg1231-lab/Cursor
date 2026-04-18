import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { tokens } from '@/lib/design-tokens';
import { useAuth } from '@/contexts/AuthContext';
import { buildAuthPath } from '@/lib/authReturnTo';
import { supabase } from '@/integrations/supabase/client';
import { getVisibleEventById } from '@/features/events/api';
import { formatEventDate } from '@/features/events/formatters';
import type { VisibleEvent } from '@/features/events/types';
import {
  ApplicationConfirmError,
  ApplicationSubmitError,
  confirmRegistrationResponse,
  createApplication,
  declineRegistrationResponse,
  getExistingApplication,
} from '@/features/applications/api';
import type {
  EventRegistrationRow,
  PersistedApplicationAnswers,
} from '@/features/applications/types';
import { formatLifecycleDateTime, isOfferExpired } from '@/features/applications/status';

export function GatheringPage() {
  const { eventId } = useParams();
  const { user, isLoading: authLoading } = useAuth();

  const [event, setEvent] = useState<VisibleEvent | null>(null);
  const [registration, setRegistration] = useState<EventRegistrationRow | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whyJoin, setWhyJoin] = useState('');

  const [actionError, setActionError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResponding, setIsResponding] = useState(false);

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
          const [existing, profileResult] = await Promise.all([
            getExistingApplication(visibleEvent.id, user.id),
            supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle(),
          ]);
          if (!active) return;
          setRegistration(existing);
          if (profileResult.data) {
            if (profileResult.data.full_name) setFullName(profileResult.data.full_name);
            if (profileResult.data.phone) setPhone(profileResult.data.phone);
          }
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
  const canSubmit =
    !!user &&
    !!event &&
    event.is_registration_open &&
    !registration &&
    fullName.trim().length > 0 &&
    phone.trim().length > 0 &&
    whyJoin.trim().length >= 10;

  async function handleSubmit() {
    if (!user || !event || !canSubmit) return;

    setIsSubmitting(true);
    setActionError(null);
    setInfoMessage(null);

    try {
      const trimmedFullName = fullName.trim();
      const trimmedPhone = phone.trim();
      const trimmedWhyJoin = whyJoin.trim();

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: trimmedFullName, phone: trimmedPhone })
        .eq('id', user.id);

      if (profileError) {
        setActionError('לא הצלחנו לשמור את פרטי הקשר. אפשר לנסות שוב בעוד רגע.');
        return;
      }

      const applicationAnswers: PersistedApplicationAnswers = {
        why_this_event: trimmedWhyJoin,
        desired_outcome: '—',
        what_you_bring: '—',
        host_note: null,
        understand_payment: true,
        commit_on_time: true,
        submitted_at: new Date().toISOString(),
      };

      const result = await createApplication({
        event,
        userId: user.id,
        applicationAnswers,
      });

      setRegistration(result.registration);
      setInfoMessage('ההגשה שלך נשמרה. נעדכן אותך ברגע שיש מקום.');
    } catch (error) {
      if (error instanceof ApplicationSubmitError) {
        switch (error.reason) {
          case 'unauthenticated':
            setActionError('פג תוקף החיבור שלך. צריך להיכנס מחדש.');
            break;
          case 'event_closed':
            setActionError('ההגשות למפגש הזה כבר סגורות.');
            break;
          case 'event_started':
            setActionError('המפגש כבר התחיל, לא ניתן להגיש עכשיו.');
            break;
          case 'event_full':
            setActionError('המפגש מלא כרגע.');
            break;
          case 'already_applied':
            setActionError('כבר קיימת הגשה פעילה למפגש הזה.');
            break;
          default:
            setActionError(
              /questionnaire not ready/i.test(error.message)
                ? 'צריך להשלים את הפרופיל לפני הגשה.'
                : 'לא הצלחנו לשמור את ההגשה כרגע.',
            );
        }
      } else {
        setActionError('לא הצלחנו לשמור את ההגשה כרגע.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAccept() {
    if (!user || !event || !registration) return;

    setIsResponding(true);
    setActionError(null);
    setInfoMessage(null);

    try {
      const updated = await confirmRegistrationResponse({
        registrationId: registration.id,
        eventId: event.id,
        userId: user.id,
      });
      setRegistration(updated);
      setInfoMessage('המקום שלך במפגש נשמר.');
    } catch (error) {
      if (error instanceof ApplicationConfirmError) {
        switch (error.reason) {
          case 'offer_expired':
            setActionError('חלון התגובה נסגר.');
            break;
          case 'not_awaiting_response':
            setActionError('אין כרגע מקום שמחכה לתגובה.');
            break;
          case 'unauthenticated':
            setActionError('פג תוקף החיבור שלך. צריך להיכנס מחדש.');
            break;
          case 'forbidden':
            setActionError('לא ניתן לאשר את ההרשמה הזאת מהחשבון הנוכחי.');
            break;
          default:
            setActionError('לא הצלחנו לשמור את התגובה כרגע.');
        }
      } else {
        setActionError('לא הצלחנו לשמור את התגובה כרגע.');
      }
    } finally {
      setIsResponding(false);
    }
  }

  async function handleDecline() {
    if (!user || !event || !registration) return;

    setIsResponding(true);
    setActionError(null);
    setInfoMessage(null);

    try {
      const updated = await declineRegistrationResponse({
        registrationId: registration.id,
        eventId: event.id,
        userId: user.id,
      });
      setRegistration(updated);
      setInfoMessage('רשמנו את הדחייה שלך. תודה שעדכנת אותנו.');
    } catch (error) {
      if (error instanceof ApplicationConfirmError) {
        switch (error.reason) {
          case 'offer_expired':
            setActionError('חלון התגובה נסגר.');
            break;
          case 'not_awaiting_response':
            setActionError('אין כרגע מקום שמחכה לתגובה.');
            break;
          case 'unauthenticated':
            setActionError('פג תוקף החיבור שלך. צריך להיכנס מחדש.');
            break;
          case 'forbidden':
            setActionError('לא ניתן לעדכן את ההרשמה הזאת מהחשבון הנוכחי.');
            break;
          default:
            setActionError('לא הצלחנו לשמור את התגובה כרגע.');
        }
      } else {
        setActionError('לא הצלחנו לשמור את התגובה כרגע.');
      }
    } finally {
      setIsResponding(false);
    }
  }

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
    return (
      <PageShell title="המפגש לא נמצא" subtitle="יכול להיות שהוא כבר לא פומבי, או שהקישור אינו תקין.">
        <Card className={tokens.card.surface}>
          <CardContent className="py-8 text-sm text-muted-foreground">
            לא מצאנו מפגש פומבי שמתאים לקישור הזה.
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const trimmedDescription = event.description?.trim() || null;

  return (
    <PageShell
      title={event.title}
      subtitle="תצוגת המפגש עם טופס הגשה מהיר. לפרטי המפגש המלאים עברו לעמוד הפרטים."
    >
      <PageActionBar>
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

            {infoMessage ? <p className="text-sm text-primary">{infoMessage}</p> : null}
            {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}

            <div className="pt-4 border-t border-border/40">
              <StatusPanel
                user={!!user}
                event={event}
                registration={registration}
                signInHref={buildAuthPath(returnTo)}
                fullName={fullName}
                phone={phone}
                whyJoin={whyJoin}
                onChangeFullName={setFullName}
                onChangePhone={setPhone}
                onChangeWhyJoin={setWhyJoin}
                canSubmit={canSubmit}
                isSubmitting={isSubmitting}
                isResponding={isResponding}
                onSubmit={handleSubmit}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            </div>
          </CardContent>
        </Card>

        <Card className={tokens.card.surface}>
          <CardHeader>
            <CardTitle className="text-xl">מה קורה אחרי שליחה?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>1. שליחת הבקשה שומרת את פרטיך. זו בקשה — לא אישור מיידי.</p>
            <p>2. אם נפתח לך מקום, נשלח הזמנה ואפשר יהיה לאשר או לדחות מהמסך הזה.</p>
            <p>3. עד שזה קורה — אין צורך לעשות דבר. נעדכן אותך.</p>
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
  signInHref: string;
  fullName: string;
  phone: string;
  whyJoin: string;
  onChangeFullName: (value: string) => void;
  onChangePhone: (value: string) => void;
  onChangeWhyJoin: (value: string) => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  isResponding: boolean;
  onSubmit: () => void;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const {
    user,
    event,
    registration,
    signInHref,
    fullName,
    phone,
    whyJoin,
    onChangeFullName,
    onChangePhone,
    onChangeWhyJoin,
    canSubmit,
    isSubmitting,
    isResponding,
    onSubmit,
    onAccept,
    onDecline,
  } = props;

  if (!user) {
    return (
      <div className="rounded-3xl border border-primary/10 bg-background/30 p-4 text-sm space-y-3">
        <p className="font-medium text-foreground">כדי להגיש בקשה צריך להיכנס לחשבון</p>
        <p className="text-muted-foreground">נשלח קוד חד פעמי למייל, ואחרי האימות נחזיר אותך למסך הזה.</p>
        <Button asChild variant="primary">
          <Link to={signInHref}>להיכנס ולהגיש בקשה</Link>
        </Button>
      </div>
    );
  }

  if (!registration) {
    if (!event.is_registration_open) {
      return (
        <div className="rounded-3xl border border-border bg-background/30 p-4 text-sm text-muted-foreground">
          ההגשות למפגש הזה אינן פתוחות כרגע.
        </div>
      );
    }

    return (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="gathering-full-name">שם מלא</label>
          <input
            id="gathering-full-name"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => onChangeFullName(e.target.value)}
            className="w-full rounded-full border border-input bg-background px-4 py-3 text-sm outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="gathering-phone">טלפון</label>
          <input
            id="gathering-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => onChangePhone(e.target.value)}
            className="w-full rounded-full border border-input bg-background px-4 py-3 text-sm outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="gathering-why-join">למה להצטרף למפגש הזה?</label>
          <textarea
            id="gathering-why-join"
            value={whyJoin}
            onChange={(e) => onChangeWhyJoin(e.target.value)}
            className="min-h-[120px] w-full rounded-3xl border border-input bg-background px-4 py-3 text-sm outline-none"
            placeholder="לפחות 10 תווים"
          />
        </div>

        <Button type="submit" variant="primary" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? 'שולחים...' : 'שליחת בקשה'}
        </Button>
      </form>
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
        {!expired ? (
          <div className="flex flex-wrap gap-3 pt-1">
            <Button variant="primary" disabled={isResponding} onClick={onAccept}>
              {isResponding ? 'שומרים...' : 'אישור המקום'}
            </Button>
            <Button variant="outline" disabled={isResponding} onClick={onDecline}>
              {isResponding ? 'שומרים...' : 'לא אוכל להגיע'}
            </Button>
          </div>
        ) : null}
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
      <p className="font-medium text-foreground">הסטטוס הנוכחי שלך: {status}</p>
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
