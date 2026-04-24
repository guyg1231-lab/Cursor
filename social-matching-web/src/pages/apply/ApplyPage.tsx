import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { PageShell } from '@/components/shared/PageShell';
import { RouteErrorState } from '@/components/shared/RouteState';
import { SectionDivider } from '@/components/shared/SectionDivider';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EventNotFound } from '@/components/participant/EventNotFound';
import { safeLocalStorage } from '@/lib/safeStorage';
import { waitForSupabaseSessionUser } from '@/lib/waitForSupabaseSession';
import { tokens } from '@/lib/design-tokens';
import { useAuth } from '@/contexts/AuthContext';
import {
  ApplicationConfirmError,
  ApplicationSubmitError,
  confirmRegistrationResponse,
  createApplication,
  declineRegistrationResponse,
  getExistingApplication,
  getQuestionnaireReadyState,
  parsePersistedApplicationAnswers,
} from '@/features/applications/api';
import {
  canConfirmTemporarySpot,
  canReapplyToEvent,
  formatApplicationStatusDetailed,
  formatApplicationStatusShort,
  formatLifecycleDateTime,
  isAwaitingParticipantResponse,
  isConfirmedParticipation,
  isOfferExpired,
} from '@/features/applications/status';
import { ApplicationStatusPanel } from '@/features/applications/components/ApplicationStatusPanel';
import { PostEventFeedbackCard } from '@/features/applications/components/PostEventFeedbackCard';
import { resolveApplicationBadgeTone, resolveApplicationPanelContent } from '@/features/applications/presentation';
import { getVisibleEventById } from '@/features/events/api';
import { EventIdentityHero } from '@/features/events/components/EventIdentityHero';
import { EventGroupContextCard } from '@/features/events/components/EventGroupContextCard';
import type {
  EventRegistrationRow,
  MatchingResponseRow,
  PersistedApplicationAnswers,
} from '@/features/applications/types';
import type { VisibleEvent } from '@/features/events/types';

const WHAT_YOU_BRING_OPTIONS = [
  { value: 'openness', label: 'פתיחות' },
  { value: 'curiosity', label: 'סקרנות' },
  { value: 'good_energy', label: 'אנרגיה טובה' },
  { value: 'listening', label: 'הקשבה ונוכחות' },
] as const;

const WHAT_YOU_BRING_LABELS: Record<string, string> = Object.fromEntries(
  WHAT_YOU_BRING_OPTIONS.map((opt) => [opt.value, opt.label]),
);

function keyFor(eventId: string | undefined) {
  return `social-matching-apply-draft:${eventId ?? 'unknown'}`;
}

function SubmittedAnswersSummary({
  answers,
  title,
  subtitle,
}: {
  answers: PersistedApplicationAnswers;
  title: string;
  subtitle?: string;
}) {
  const desiredOutcomeLabels: Record<string, string> = {
    meet_new_people: 'להכיר אנשים חדשים',
    meaningful_conversation: 'שיחה טובה ומשמעותית',
    easygoing_experience: 'חוויה נעימה וקלילה',
    inspiration: 'השראה / פתיחת אופקים',
  };

  return (
    <Card className={tokens.card.surface}>
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-[-0.015em]">{title}</CardTitle>
        {subtitle ? <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p> : null}
      </CardHeader>
        <CardContent className="space-y-4 text-sm text-foreground/85 leading-7">
        <div className={tokens.card.inner + ' p-4 space-y-3'}>
          <div className="space-y-1">
            <p className="font-medium text-foreground">למה דווקא המפגש הזה?</p>
            <p>{answers.why_this_event}</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">מה רצית לקבל מהמפגש?</p>
            <p>{desiredOutcomeLabels[answers.desired_outcome] ?? answers.desired_outcome}</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">מה רצית להביא לקבוצה?</p>
            <p>{WHAT_YOU_BRING_LABELS[answers.what_you_bring] ?? answers.what_you_bring}</p>
          </div>
          {answers.host_note ? (
            <div className="space-y-1">
              <p className="font-medium text-foreground">הערה למארחים</p>
              <p>{answers.host_note}</p>
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl border border-primary/10 bg-background/30 p-4 text-sm text-muted-foreground space-y-1">
          <p>נשמר בתאריך: {new Date(answers.submitted_at).toLocaleString('he-IL')}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ApplyEventIdentityCard({
  event,
  subtitle,
}: {
  event: VisibleEvent;
  subtitle: string;
}) {
  return (
    <EventIdentityHero
      event={event}
      eyebrow="הכוונה למפגש הזה"
      subtitle={subtitle}
      socialLabel={
        event.social_signal?.attendee_count
          ? `${event.social_signal.attendee_count} כבר מתחילים לבנות את החדר הזה`
          : undefined
      }
      socialDetail="החדר נבנה סביב המפגש הזה"
    />
  );
}

export function ApplyPage() {
  const { eventId } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const storageKey = useMemo(() => keyFor(eventId), [eventId]);

  const [event, setEvent] = useState<VisibleEvent | null>(null);
  const [existingApplication, setExistingApplication] = useState<EventRegistrationRow | null>(null);
  const [questionnaireReady, setQuestionnaireReady] = useState(false);
  const [questionnaireResponse, setQuestionnaireResponse] = useState<
    Pick<MatchingResponseRow, 'birth_date' | 'social_link'> | null
  >(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isConfirmingSpot, setIsConfirmingSpot] = useState(false);
  const [isDecliningSpot, setIsDecliningSpot] = useState(false);

  const [whyThisEvent, setWhyThisEvent] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [whatYouBring, setWhatYouBring] = useState('');
  const [hostNote, setHostNote] = useState('');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);

  useEffect(() => {
    try {
      const raw = safeLocalStorage.getItem(storageKey);
      if (!raw) {
        setHasLocalDraft(false);
        return;
      }
      setHasLocalDraft(true);
      const parsed = JSON.parse(raw) as {
        whyThisEvent?: string;
        desiredOutcome?: string;
        whatYouBring?: string;
        hostNote?: string;
      };
      setWhyThisEvent(parsed.whyThisEvent ?? '');
      setDesiredOutcome(parsed.desiredOutcome ?? '');
      setWhatYouBring(parsed.whatYouBring ?? '');
      setHostNote(parsed.hostNote ?? '');
    } catch {
      // ignore local draft parse failures
      setHasLocalDraft(false);
    }
  }, [storageKey]);

  useEffect(() => {
    if (hasLocalDraft || !existingApplication) return;

    const answers = parsePersistedApplicationAnswers(existingApplication.application_answers);
    if (!answers) return;

    setWhyThisEvent(answers.why_this_event);
    setDesiredOutcome(answers.desired_outcome);
    setWhatYouBring(answers.what_you_bring);
    setHostNote(answers.host_note ?? '');
  }, [existingApplication, hasLocalDraft]);

  useEffect(() => {
    let stale = false;

    async function load() {
      if (authLoading) return;
      if (!eventId) {
        setError('לא נמצא מזהה מפגש.');
        setPageLoading(false);
        return;
      }

      setPageLoading(true);
      setError(null);

      try {
        const visibleEvent = await getVisibleEventById(eventId);
        if (stale) return;

        if (!visibleEvent) {
          setEvent(null);
          setExistingApplication(null);
          return;
        }

        setEvent(visibleEvent);

        if (!user) {
          setQuestionnaireReady(false);
          setQuestionnaireResponse(null);
          setExistingApplication(null);
          return;
        }

        const sessionReady = await waitForSupabaseSessionUser(user.id);
        if (stale) return;

        if (!sessionReady) {
          console.warn('[ApplyPage] Supabase session not synced after auth; skipping protected loads');
          setQuestionnaireReady(false);
          setQuestionnaireResponse(null);
          setExistingApplication(null);
        } else {
          const [readyState, existing] = await Promise.all([
            getQuestionnaireReadyState(user.id),
            getExistingApplication(visibleEvent.id, user.id),
          ]);

          if (stale) return;
          setQuestionnaireReady(readyState.ready);
          setQuestionnaireResponse(readyState.response);
          setExistingApplication(existing);
        }
      } catch (e) {
        if (stale) return;
        console.error('[ApplyPage] load failed', e);
        setError(
          import.meta.env.DEV && e instanceof Error && e.message
            ? `לא הצלחנו לטעון את פרטי ההגשה כרגע. (${e.message})`
            : 'לא הצלחנו לטעון את פרטי ההגשה כרגע.',
        );
      } finally {
        if (!stale) setPageLoading(false);
      }
    }

    void load();
    return () => {
      stale = true;
    };
  }, [authLoading, eventId, user]);

  const saveDraft = () => {
    safeLocalStorage.setItem(
      storageKey,
      JSON.stringify({
        whyThisEvent,
        desiredOutcome,
        whatYouBring,
        hostNote,
      }),
    );
    setSavedMessage('הטיוטה נשמרה מקומית, אפשר לחזור אליה בהמשך.');
    window.setTimeout(() => setSavedMessage(null), 2000);
  };

  const canSubmit =
    !!user &&
    !!event &&
    event.is_registration_open &&
    questionnaireReady &&
    (!existingApplication || canReapplyToEvent(existingApplication.status)) &&
    whyThisEvent.trim().length >= 10 &&
    desiredOutcome.trim().length > 0 &&
    whatYouBring.trim().length > 0;

  const persistedApplicationAnswers = existingApplication
    ? parsePersistedApplicationAnswers(existingApplication.application_answers)
    : null;
  const awaitingResponse = existingApplication ? isAwaitingParticipantResponse(existingApplication.status) : false;
  const offerExpired = existingApplication ? isOfferExpired(existingApplication) : false;
  const canConfirmSpot = existingApplication ? canConfirmTemporarySpot(existingApplication) : false;
  const confirmedParticipation = existingApplication ? isConfirmedParticipation(existingApplication.status) : false;
  const completedEventFeedbackStatus =
    existingApplication?.status === 'attended' || existingApplication?.status === 'no_show'
      ? existingApplication.status
      : null;
  const fieldShellClassName = tokens.card.inner + ' space-y-2.5 p-4';
  const textInputClassName =
    'w-full rounded-[22px] border border-border/70 bg-card/94 px-4 py-3 text-sm text-foreground shadow-[inset_0_1px_0_hsl(var(--card)),0_8px_18px_-16px_hsl(var(--foreground)/0.18)] outline-none transition focus:border-primary/35 focus:ring-2 focus:ring-primary/10';

  async function handleSubmit() {
    if (!user || !event || !canSubmit) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const applicationAnswers: PersistedApplicationAnswers = {
        why_this_event: whyThisEvent.trim(),
        desired_outcome: desiredOutcome,
        what_you_bring: whatYouBring,
        host_note: hostNote.trim() || null,
        submitted_at: new Date().toISOString(),
      };

      const result = await createApplication({
        event,
        userId: user.id,
        questionnaireResponse,
        applicationAnswers,
      });

      safeLocalStorage.setItem(
        storageKey,
        JSON.stringify({
          whyThisEvent,
          desiredOutcome,
          whatYouBring,
          hostNote,
          submittedAt: new Date().toISOString(),
          registrationId: result.registration.id,
        }),
      );

      setExistingApplication(result.registration);
      setSavedMessage(
        result.mode === 're_registered'
          ? 'ההגשה הקודמת נפתחה מחדש ונשלחה שוב בהצלחה.'
          : 'ההגשה נשמרה ונשלחה בהצלחה.',
      );
      window.setTimeout(() => setSavedMessage(null), 2500);
    } catch (error) {
      if (error instanceof ApplicationSubmitError) {
        switch (error.reason) {
          case 'event_full':
            setSubmitError('המפגש כבר מלא כרגע, ולכן אי אפשר להגיש אליו עכשיו.');
            return;
          case 'event_closed':
            setSubmitError('ההגשות למפגש הזה כבר סגורות כרגע.');
            return;
          case 'event_started':
            setSubmitError('המפגש כבר התחיל ולכן אי אפשר להגיש אליו עכשיו.');
            return;
          case 'already_applied':
            setSubmitError('כבר קיימת הגשה פעילה למפגש הזה, ולכן לא נפתחה הגשה חדשה.');
            return;
          case 'unauthenticated':
            setSubmitError('פג תוקף החיבור שלך. צריך להתחבר מחדש כדי להמשיך.');
            return;
          default:
            break;
        }
      }

      setSubmitError('לא הצלחנו לשמור את ההגשה כרגע. אפשר לנסות שוב בעוד רגע.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmTemporarySpot() {
    if (!existingApplication || !event || !user || !canConfirmSpot) return;

    setIsConfirmingSpot(true);
    setConfirmError(null);

    try {
      const updatedRegistration = await confirmRegistrationResponse({
        registrationId: existingApplication.id,
        eventId: event.id,
        userId: user.id,
      });

      setExistingApplication(updatedRegistration);
      setSavedMessage('המקום הזמני אושר ונשמר עבורך.');
      window.setTimeout(() => setSavedMessage(null), 2500);
    } catch (error) {
      if (error instanceof ApplicationConfirmError) {
        switch (error.reason) {
          case 'offer_expired':
            setConfirmError('חלון התגובה כבר נסגר, ולכן אי אפשר לאשר את המקום הזמני הזה.');
            return;
          case 'not_awaiting_response':
            setConfirmError('כרגע אין מקום זמני שמחכה לתגובה, ולכן אין מה לאשר כאן.');
            return;
          case 'unauthenticated':
            setConfirmError('פג תוקף החיבור שלך. צריך להתחבר מחדש כדי להמשיך.');
            return;
          case 'forbidden':
            setConfirmError('אי אפשר לאשר את ההרשמה הזאת מהחשבון הנוכחי.');
            return;
          default:
            break;
        }
      }

      setConfirmError('לא הצלחנו לשמור את התגובה שלך כרגע. אפשר לנסות שוב בעוד רגע.');
    } finally {
      setIsConfirmingSpot(false);
    }
  }

  async function handleDeclineTemporarySpot() {
    if (!existingApplication || !event || !user || !canConfirmSpot) return;

    setIsDecliningSpot(true);
    setConfirmError(null);

    try {
      const updatedRegistration = await declineRegistrationResponse({
        registrationId: existingApplication.id,
        eventId: event.id,
        userId: user.id,
      });

      setExistingApplication(updatedRegistration);
      setSavedMessage('הפעם זה לא יצא, ועדכנו את הסטטוס בהתאם.');
      window.setTimeout(() => setSavedMessage(null), 2500);
    } catch (error) {
      if (error instanceof ApplicationConfirmError) {
        switch (error.reason) {
          case 'offer_expired':
            setConfirmError('חלון התגובה כבר נסגר, ולכן אי אפשר לדחות את המקום הזמני הזה.');
            return;
          case 'not_awaiting_response':
            setConfirmError('כרגע אין מקום זמני שמחכה לתגובה, ולכן אין מה לדחות כאן.');
            return;
          case 'unauthenticated':
            setConfirmError('פג תוקף החיבור שלך. צריך להתחבר מחדש כדי להמשיך.');
            return;
          case 'forbidden':
            setConfirmError('אי אפשר לעדכן את ההרשמה הזאת מהחשבון הנוכחי.');
            return;
          default:
            break;
        }
      }

      setConfirmError('לא הצלחנו לשמור את התגובה שלך כרגע. אפשר לנסות שוב בעוד רגע.');
    } finally {
      setIsDecliningSpot(false);
    }
  }

  if (pageLoading) {
    return (
      <PageShell title="הגשה למפגש" subtitle="טוענים את הכוונה למפגש הזה...">
        <Card className={tokens.card.surface}>
          <CardContent className="py-10 text-sm text-muted-foreground">טוענים...</CardContent>
        </Card>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="הגשה למפגש" subtitle="לא הצלחנו לטעון את הכוונה למפגש כרגע.">
        <RouteErrorState title="לא הצלחנו לטעון את פרטי ההגשה" body={error} />
      </PageShell>
    );
  }

  if (!event) {
    return <EventNotFound />;
  }

  if (eventId && eventId !== event.id) {
    return <Navigate to={`/events/${event.id}/apply`} replace />;
  }

  if (!user) {
    return (
      <PageShell
        title="כדי לשלוח כוונה למפגש צריך להתחבר"
        subtitle="העמוד הזה מרכז את הכוונה והסטטוס של המפגש הזה, ולכן צריך להתחבר כדי להמשיך."
      >
        <div className="space-y-4">
          <ApplyEventIdentityCard
            event={event}
            subtitle="כאן שולחים כוונה למפגש עצמו, ואפשר לחזור בדיוק לאותה נקודה אחרי התחברות."
          />
          <PageActionBar variant="participant">
            <Button asChild variant="outline">
              <Link to="/events">חזרה למפגשים</Link>
            </Button>
            <Button asChild variant="primary">
              <Link to="/auth">להתחברות כדי להמשיך</Link>
            </Button>
          </PageActionBar>
          <Card data-testid="participant-surface-panel" className={tokens.card.surface}>
            <CardContent className="space-y-4 py-8 text-sm text-muted-foreground">
              <p>אחרי התחברות אפשר לחזור לעמוד הזה ולהמשיך בדיוק מאותה נקודה.</p>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  if (awaitingResponse && existingApplication) {
    const panel = resolveApplicationPanelContent(existingApplication);
    return (
      <PageShell
        title="סטטוס הכוונה למפגש – מקום זמני"
        subtitle={
          offerExpired
            ? 'המקום הזמני כבר לא מחכה לתגובה, אבל נציג כאן בבירור מה קרה.'
            : 'כדי לשמור על המקום, צריך להגיב עד המועד שמופיע כאן.'
        }
      >
        <div className="space-y-4">
          <ApplyEventIdentityCard
            event={event}
            subtitle={
              offerExpired
                ? 'המקום הזמני כבר לא מחכה לתגובה, אבל ההקשר של המפגש נשאר כאן ברור ומסודר.'
                : 'כאן מגיבים למקום הזמני שנשמר עבורך, בלי לאבד את ההקשר של המפגש הזה.'
            }
          />
          <EventGroupContextCard event={event} />
          <PageActionBar variant="participant">
            {!offerExpired ? (
              <Button variant="primary" disabled={!canConfirmSpot || isConfirmingSpot} onClick={() => void handleConfirmTemporarySpot()}>
                {isConfirmingSpot ? 'שומר/ת...' : 'אישור המקום הזמני'}
              </Button>
            ) : null}
            {!offerExpired ? (
              <Button
                variant="outline"
                disabled={!canConfirmSpot || isDecliningSpot || isConfirmingSpot}
                onClick={() => void handleDeclineTemporarySpot()}
              >
                {isDecliningSpot ? 'מעדכן/ת...' : 'לא אוכל להגיע'}
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link to={`/events/${event.id}`}>חזרה לפרטי המפגש</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/dashboard">לאזור האישי</Link>
            </Button>
          </PageActionBar>
          <ApplicationStatusPanel
            title={panel.title}
            body={panel.body}
            footer={panel.footer ? <p>{panel.footer}</p> : undefined}
          />
          <Card data-testid="participant-surface-panel" className={tokens.card.surface}>
            <CardContent className="space-y-4 text-sm text-muted-foreground pt-6">
              <div className={tokens.card.inner + ' p-4 space-y-2'}>
                <p><strong className="text-foreground">מפגש:</strong> {event.title}</p>
                <p><strong className="text-foreground">הוצע בתאריך:</strong> {formatLifecycleDateTime(existingApplication.offered_at)}</p>
                <p><strong className="text-foreground">יש להגיב עד:</strong> {formatLifecycleDateTime(existingApplication.expires_at)}</p>
              </div>

              {savedMessage ? <p className="text-primary">{savedMessage}</p> : null}
              {confirmError ? <p className="text-destructive">{confirmError}</p> : null}
            </CardContent>
          </Card>

          {persistedApplicationAnswers ? (
            <SubmittedAnswersSummary
              answers={persistedApplicationAnswers}
              title="ההגשה שנשמרה עבורך"
              subtitle="אלה הפרטים שנשמרו עם ההרשמה למפגש הזה, כדי שתוכל או תוכלי לראות בדיוק למה התגובה מתייחסת."
            />
          ) : null}
        </div>
      </PageShell>
    );
  }

  if (existingApplication && !canReapplyToEvent(existingApplication.status)) {
    const blockingPanel = resolveApplicationPanelContent(existingApplication);
    return (
      <PageShell
        title="סטטוס ההגשה למפגש"
        subtitle={
          confirmedParticipation
            ? 'לא צריך לשלוח שוב את הכוונה למפגש הזה. זהו הסטטוס העדכני שלך.'
            : 'לא נפתח שוב טופס חדש לאותו מפגש. במקום זה נציג את הסטטוס הקיים שלך.'
        }
      >
        <div className="space-y-4">
          <ApplyEventIdentityCard
            event={event}
            subtitle="זהו הסטטוס העדכני של ההגשה למפגש הזה, יחד עם פרטי המפגש שנשמרו כהקשר."
          />
          <EventGroupContextCard event={event} />
          <PageActionBar variant="participant">
            <Button asChild variant="outline">
              <Link to={`/events/${event.id}`}>חזרה לפרטי המפגש</Link>
            </Button>
            <Button asChild variant="primary">
              <Link to="/events">לכל המפגשים</Link>
            </Button>
          </PageActionBar>
          <ApplicationStatusPanel
            title={blockingPanel.title}
            body={blockingPanel.body}
            footer={blockingPanel.footer ? <p>{blockingPanel.footer}</p> : undefined}
          />
          {completedEventFeedbackStatus && user ? (
            <PostEventFeedbackCard
              eventId={event.id}
              userId={user.id}
              completedStatus={completedEventFeedbackStatus}
            />
          ) : null}
          <Card data-testid="participant-surface-panel" className={tokens.card.surface}>
            <CardContent className="space-y-3 py-6 text-sm text-muted-foreground">
              {savedMessage ? <p className="text-primary">{savedMessage}</p> : null}
              <p>ברגע שיהיה שינוי בסטטוס, זה יופיע כאן ובהמשך גם בדשבורד.</p>
            </CardContent>
          </Card>

          {persistedApplicationAnswers ? (
            <SubmittedAnswersSummary
              answers={persistedApplicationAnswers}
              title="הפרטים ששמרנו מההגשה שלך"
              subtitle="זהו הסיכום שנשמר על ההגשה עצמה, כדי שתוכלי או תוכל לראות מה בדיוק נשלח."
            />
          ) : null}
        </div>
      </PageShell>
    );
  }

  if (!event.is_registration_open) {
    return (
      <PageShell title="ההגשות למפגש הזה סגורות" subtitle="המפגש עדיין פומבי, אבל כרגע לא פתוח לכוונות חדשות.">
        <div className="space-y-4">
          <ApplyEventIdentityCard
            event={event}
            subtitle="ההגשה סגורה כרגע, אבל פרטי המפגש נשארים כאן כדי שתהיה תמונה מלאה וברורה."
          />
          <PageActionBar variant="participant">
            <Button asChild variant="outline">
              <Link to="/events">חזרה לכל המפגשים</Link>
            </Button>
          </PageActionBar>
          <ApplicationStatusPanel
            title="ההגשות למפגש הזה סגורות כרגע"
            body="אפשר לחזור לרשימת המפגשים ולבדוק אם יש מפגש אחר שפתוח להגשה."
          />
        </div>
      </PageShell>
    );
  }

  if (!questionnaireReady) {
    return (
      <PageShell title="הגשה למפגש" subtitle="כדי לשמור את הכוונה למפגש הזה נכון, צריך קודם להשלים את הבסיס האישי.">
        <div className="space-y-4">
          <ApplyEventIdentityCard
            event={event}
            subtitle="לפני ששולחים כוונה למפגש, נשמור כאן את פרטי המפגש עצמו כדי שההמשך יישאר ברור ורגוע."
          />
          <EventGroupContextCard event={event} />
          <PageActionBar variant="participant">
            <Button asChild variant="primary">
              <Link to="/questionnaire">להשלמת הפרופיל</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={`/events/${event.id}`}>חזרה לפרטי המפגש</Link>
            </Button>
          </PageActionBar>
          <ApplicationStatusPanel
            title="צריך להשלים קודם את הבסיס האישי"
            body="כדי שנוכל לשמור את הכוונה למפגש נכון, צריך להשלים קודם את הבסיס האישי."
          />
          <Card data-testid="participant-surface-panel" className={tokens.card.surface}>
            <CardContent className="space-y-4 py-8 text-sm text-muted-foreground">
              <p>ברגע שהבסיס האישי יושלם, אפשר לחזור לכאן ולהמשיך בדיוק עם הכוונה למפגש הזה.</p>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="הגשה למפגש"
      subtitle="זה העמוד שבו מנסחים כוונה למפגש, חוזרים לסטטוס, ומגיבים אם בהמשך ייפתח מקום זמני."
    >
      <PageActionBar variant="participant">
        <Button asChild variant="outline">
          <Link to={`/events/${event.id}`}>חזרה לפרטי המפגש</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/dashboard">לאזור האישי</Link>
        </Button>
      </PageActionBar>
      <ApplyEventIdentityCard
        event={event}
        subtitle="זהו עמוד הכוונה והסטטוס של המפגש הזה. כל שינוי יופיע כאן וגם באזור האישי, בלי לאבד את ההקשר של המפגש."
      />
      <EventGroupContextCard event={event} />

      <Card data-testid="participant-surface-panel" className={tokens.card.accent}>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-[-0.015em]">לפני שמנסחים כוונה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-foreground/85 leading-7">
          {/**
           * Intentional asymmetry with EventDetailPage: the reapply-eligible state there
           * renders ApplicationStatusPanel via resolveApplicationPanelContent, while here
           * we use inline prose + StatusBadge (rendered below, outside this card). This
           * page also renders the actual application form a few sections down; a full
           * panel competes with the form the user is filling in. If future
           * work requires symmetry, extract a shared ReapplyHeader (badge + prose) —
           * do not adopt ApplicationStatusPanel here without a UX review.
           */}
          <div className={tokens.card.inner + ' space-y-2 p-4'}>
            <p className={tokens.typography.eyebrow}>מה קורה במסך הזה</p>
            <p>זהו עמוד הכוונה והסטטוס למפגש הזה. כל עדכון עתידי יופיע כאן וגם באזור האישי.</p>
          </div>
          <div className={tokens.card.inner + ' space-y-2 p-4'}>
            <p className={tokens.typography.eyebrow}>אחרי השליחה</p>
            <p>
              ההגשה שלך תישמר למפגש הזה, ואם בהמשך יישמר עבורך מקום זמני נחזיר אותך למסך הזה כדי
              להגיב אליו בזמן.
            </p>
          </div>
          {existingApplication && canReapplyToEvent(existingApplication.status) ? (
            <div className={tokens.card.inner + ' space-y-2 p-4'}>
              <p className={tokens.typography.eyebrow}>הגשה קודמת</p>
              <p>
                הייתה לך כבר כוונה קודמת למפגש הזה במצב "{formatApplicationStatusDetailed(existingApplication.status)}".
                שליחה עכשיו תפתח אותה מחדש כהגשה ממתינה.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {persistedApplicationAnswers ? (
        <>
          <SectionDivider />
          <SubmittedAnswersSummary
            answers={persistedApplicationAnswers}
            title="הכוונה הקודמת שלך"
            subtitle="אלה הפרטים האחרונים שנשמרו על הכוונה למפגש הזה. אם תרצה או תרצי להגיש מחדש, הטופס למטה יתחיל מהמידע הזה אלא אם קיימת טיוטה מקומית חדשה יותר."
          />
        </>
      ) : null}

      <SectionDivider />

      {existingApplication && canReapplyToEvent(existingApplication.status) ? (
        <div className="mb-3">
          <StatusBadge
            label={formatApplicationStatusShort(existingApplication.status)}
            tone={resolveApplicationBadgeTone(existingApplication.status)}
          />
        </div>
      ) : null}

      <Card data-testid="participant-surface-panel" className={tokens.card.surface}>
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-[-0.015em]">פרטי הכוונה למפגש</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)]">
            <div className={fieldShellClassName + ' text-start text-sm text-foreground/80'}>
              <p className={tokens.typography.eyebrow}>איך זה מרגיש</p>
              <p>
                זהו טופס קצר וממוקד למפגש הזה. המטרה היא להבין מה מחבר אותך דווקא לחדר הזה, בלי להפוך
                את זה למסך כבד.
              </p>
            </div>
            <div className={fieldShellClassName + ' text-start text-sm text-foreground/80'}>
              <p className={tokens.typography.eyebrow}>תהליך</p>
              <p>
                הכוונה נשמרת עכשיו, ובהמשך הסטטוס שלך יתעדכן כאן ובאזור האישי. אם ייפתח מקום זמני, נחזור למסך
                הזה עם צעד ברור להמשך.
              </p>
            </div>
          </div>

          <div className={fieldShellClassName}>
            <label className="text-sm font-medium text-foreground">למה דווקא המפגש הזה מעניין אותך?</label>
            <textarea
              value={whyThisEvent}
              onChange={(e) => setWhyThisEvent(e.target.value)}
              className={textInputClassName + ' min-h-[124px] resize-y'}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className={fieldShellClassName}>
              <label className="text-sm font-medium text-foreground">מה היית רוצה לקבל מהמפגש הזה?</label>
              <select
                value={desiredOutcome}
                onChange={(e) => setDesiredOutcome(e.target.value)}
                className={textInputClassName}
              >
                <option value="">בחר/י תשובה אחת</option>
                <option value="meet_new_people">להכיר אנשים חדשים</option>
                <option value="meaningful_conversation">שיחה טובה ומשמעותית</option>
                <option value="easygoing_experience">חוויה נעימה וקלילה</option>
                <option value="inspiration">השראה / פתיחת אופקים</option>
              </select>
            </div>

            <div className={fieldShellClassName}>
              <label className="text-sm font-medium text-foreground">מה היית רוצה להביא לחדר הזה?</label>
              <select
                value={whatYouBring}
                onChange={(e) => setWhatYouBring(e.target.value)}
                className={textInputClassName}
              >
                <option value="">בחר/י תשובה אחת</option>
                {WHAT_YOU_BRING_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={fieldShellClassName}>
            <label className="text-sm font-medium text-foreground">יש משהו שחשוב למארגן של המפגש הזה לדעת?</label>
            <textarea
              value={hostNote}
              onChange={(e) => setHostNote(e.target.value)}
              className={textInputClassName + ' min-h-[108px] resize-y'}
            />
          </div>

          {savedMessage ? <p className="text-sm text-primary">{savedMessage}</p> : null}
          {submitError ? <RouteErrorState title="לא הצלחנו לשמור את ההגשה" body={submitError} /> : null}

          <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="secondary" className="w-full sm:w-auto" onClick={saveDraft} disabled={isSubmitting}>
              שמירת טיוטה
            </Button>
            <Button
              variant="primary"
              className="w-full sm:w-auto sm:min-w-[172px]"
              disabled={!canSubmit || isSubmitting}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting ? 'שולח/ת...' : 'שליחת הגשה'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
