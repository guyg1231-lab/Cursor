import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { RouteErrorState } from '@/components/shared/RouteState';
import { SectionDivider } from '@/components/shared/SectionDivider';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { safeLocalStorage } from '@/lib/safeStorage';
import { tokens } from '@/lib/design-tokens';
import { useAuth } from '@/contexts/AuthContext';
import {
  ApplicationConfirmError,
  ApplicationSubmitError,
  confirmRegistrationResponse,
  createApplication,
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
import { resolveApplicationPanelContent } from '@/features/applications/presentation';
import { getVisibleEventById } from '@/features/events/api';
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
        <CardTitle className="text-xl">{title}</CardTitle>
        {subtitle ? <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p> : null}
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-foreground/85 leading-relaxed">
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
          <p>אישור תשלום לאחר קבלה: {answers.understand_payment ? 'אושר' : 'לא אושר'}</p>
          <p>התחייבות להגיע בזמן: {answers.commit_on_time ? 'אושרה' : 'לא אושרה'}</p>
          <p>נשמר בתאריך: {new Date(answers.submitted_at).toLocaleString('he-IL')}</p>
        </div>
      </CardContent>
    </Card>
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

  const [whyThisEvent, setWhyThisEvent] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [whatYouBring, setWhatYouBring] = useState('');
  const [hostNote, setHostNote] = useState('');
  const [understandPayment, setUnderstandPayment] = useState(false);
  const [commitOnTime, setCommitOnTime] = useState(false);
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
        understandPayment?: boolean;
        commitOnTime?: boolean;
      };
      setWhyThisEvent(parsed.whyThisEvent ?? '');
      setDesiredOutcome(parsed.desiredOutcome ?? '');
      setWhatYouBring(parsed.whatYouBring ?? '');
      setHostNote(parsed.hostNote ?? '');
      setUnderstandPayment(parsed.understandPayment ?? false);
      setCommitOnTime(parsed.commitOnTime ?? false);
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
    setUnderstandPayment(answers.understand_payment);
    setCommitOnTime(answers.commit_on_time);
  }, [existingApplication, hasLocalDraft]);

  useEffect(() => {
    let active = true;

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
        if (!active) return;

        if (!visibleEvent) {
          setEvent(null);
          setExistingApplication(null);
          setPageLoading(false);
          return;
        }

        setEvent(visibleEvent);

        if (!user) {
          setQuestionnaireReady(false);
          setQuestionnaireResponse(null);
          setExistingApplication(null);
          setPageLoading(false);
          return;
        }

        const [readyState, existing] = await Promise.all([
          getQuestionnaireReadyState(user.id),
          getExistingApplication(visibleEvent.id, user.id),
        ]);

        if (!active) return;
        setQuestionnaireReady(readyState.ready);
        setQuestionnaireResponse(readyState.response);
        setExistingApplication(existing);
      } catch {
        if (!active) return;
        setError('לא הצלחנו לטעון את פרטי ההגשה כרגע.');
      } finally {
        if (active) setPageLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
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
        understandPayment,
        commitOnTime,
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
    whatYouBring.trim().length > 0 &&
    understandPayment &&
    commitOnTime;

  const persistedApplicationAnswers = existingApplication
    ? parsePersistedApplicationAnswers(existingApplication.application_answers)
    : null;
  const awaitingResponse = existingApplication ? isAwaitingParticipantResponse(existingApplication.status) : false;
  const offerExpired = existingApplication ? isOfferExpired(existingApplication) : false;
  const canConfirmSpot = existingApplication ? canConfirmTemporarySpot(existingApplication) : false;
  const confirmedParticipation = existingApplication ? isConfirmedParticipation(existingApplication.status) : false;

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
        understand_payment: understandPayment,
        commit_on_time: commitOnTime,
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
          understandPayment,
          commitOnTime,
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

  if (pageLoading) {
    return (
      <PageShell title="הגשת מועמדות למפגש" subtitle="טוענים את פרטי ההגשה...">
        <Card className={tokens.card.surface}>
          <CardContent className="py-10 text-sm text-muted-foreground">טוענים...</CardContent>
        </Card>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="הגשת מועמדות למפגש" subtitle="לא הצלחנו לטעון את הדף כרגע.">
        <RouteErrorState title="לא הצלחנו לטעון את פרטי ההגשה" body={error} />
      </PageShell>
    );
  }

  if (!event) {
    return (
      <PageShell title="המפגש לא נמצא" subtitle="יכול להיות שהוא כבר לא פומבי או שהקישור אינו תקין.">
        <Card className={tokens.card.surface}>
          <CardContent className="space-y-4 py-8 text-sm text-muted-foreground">
            <p>לא מצאנו מפגש שאפשר להגיש אליו דרך הקישור הזה.</p>
            <Button asChild variant="outline">
              <Link to="/events">חזרה לכל המפגשים</Link>
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell title="כדי להגיש מועמדות צריך להתחבר" subtitle="ברגע שתהיה/י מחובר/ת נוכל לשמור את ההגשה שלך למפגש הזה.">
        <Card className={tokens.card.surface}>
          <CardContent className="space-y-4 py-8 text-sm text-muted-foreground">
            <p>כרגע האפליקציה החדשה עדיין לא כוללת מסך התחברות ייעודי. אפשר להתחבר בהמשך ולהמשיך מכאן.</p>
            <Button asChild variant="outline">
              <Link to="/events">חזרה למפגשים</Link>
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (awaitingResponse && existingApplication) {
    const panel = resolveApplicationPanelContent(existingApplication);
    return (
      <PageShell
        title="סטטוס ההרשמה – מקום זמני"
        subtitle={
          offerExpired
            ? 'המקום הזמני כבר לא מחכה לתגובה, אבל נציג כאן בבירור מה קרה.'
            : 'כדי לשמור על המקום, צריך להגיב עד הדדליין שמופיע כאן.'
        }
      >
        <div className="space-y-4">
          <ApplicationStatusPanel
            title={panel.title}
            body={panel.body}
            footer={panel.footer ? <p>{panel.footer}</p> : undefined}
          />
          <Card className={tokens.card.surface}>
            <CardContent className="space-y-4 text-sm text-muted-foreground pt-6">
              <div className={tokens.card.inner + ' p-4 space-y-2'}>
                <p><strong className="text-foreground">מפגש:</strong> {event.title}</p>
                <p><strong className="text-foreground">הוצע בתאריך:</strong> {formatLifecycleDateTime(existingApplication.offered_at)}</p>
                <p><strong className="text-foreground">יש להגיב עד:</strong> {formatLifecycleDateTime(existingApplication.expires_at)}</p>
              </div>

              {savedMessage ? <p className="text-primary">{savedMessage}</p> : null}
              {confirmError ? <p className="text-destructive">{confirmError}</p> : null}

              <div className="flex flex-wrap gap-3 pt-1">
                {!offerExpired ? (
                  <Button variant="primary" disabled={!canConfirmSpot || isConfirmingSpot} onClick={() => void handleConfirmTemporarySpot()}>
                    {isConfirmingSpot ? 'שומר/ת...' : 'אישור המקום הזמני'}
                  </Button>
                ) : null}
                <Button asChild variant="outline">
                  <Link to={`/events/${event.id}`}>חזרה לפרטי המפגש</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/dashboard">לאזור האישי</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {persistedApplicationAnswers ? (
            <SubmittedAnswersSummary
              answers={persistedApplicationAnswers}
              title="ההגשה שנשמרה עבורך"
              subtitle="אלה הפרטים שנשמרו עם ההרשמה למפגש הזה, כדי שתוכל או תוכלי לראות בדיוק על מה התגובה מתייחסת."
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
        title="סטטוס ההרשמה"
        subtitle={
          confirmedParticipation
            ? 'לא צריך לשלוח שוב טופס. זהו הסטטוס העדכני של ההרשמה שלך.'
            : 'לא נפתח שוב טופס חדש לאותו אירוע. במקום זה נציג את הסטטוס הקיים שלך.'
        }
      >
        <div className="space-y-4">
          <ApplicationStatusPanel
            title={blockingPanel.title}
            body={blockingPanel.body}
            footer={blockingPanel.footer ? <p>{blockingPanel.footer}</p> : undefined}
          />
          <Card className={tokens.card.surface}>
            <CardContent className="space-y-3 py-6 text-sm text-muted-foreground">
              {savedMessage ? <p className="text-primary">{savedMessage}</p> : null}
              <p>ברגע שיהיה שינוי בסטטוס, זה יופיע כאן ובהמשך גם בדשבורד.</p>
              <div className="flex gap-3 pt-2">
                <Button asChild variant="outline">
                  <Link to={`/events/${event.id}`}>חזרה לפרטי המפגש</Link>
                </Button>
                <Button asChild variant="primary">
                  <Link to="/events">לכל המפגשים</Link>
                </Button>
              </div>
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
      <PageShell title="ההגשות למפגש הזה סגורות" subtitle="המפגש עדיין פומבי, אבל כרגע לא פתוח להגשות חדשות.">
        <div className="space-y-4">
          <ApplicationStatusPanel
            title="ההגשות למפגש הזה סגורות כרגע"
            body="אפשר לחזור לרשימת המפגשים ולבדוק אם יש מפגש אחר שפתוח להגשה."
          />
          <Button asChild variant="outline">
            <Link to="/events">חזרה לכל המפגשים</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  if (!questionnaireReady) {
    return (
      <PageShell title="הגשה למפגש – פרופיל חסר" subtitle="כדי שנוכל להבין אותך טוב יותר ולשמור את ההגשה נכון, צריך להשלים קודם את שאלון הפרופיל.">
        <div className="space-y-4">
          <ApplicationStatusPanel
            title="צריך להשלים את השאלון לפני ההגשה"
            body="כדי שנוכל לשמור את ההגשה נכון, צריך להשלים קודם את שאלון הפרופיל."
          />
          <Card className={tokens.card.surface}>
            <CardContent className="space-y-4 py-8 text-sm text-muted-foreground">
              <div className="flex gap-3 pt-2">
                <Button asChild variant="primary">
                  <Link to="/questionnaire">להשלמת הפרופיל</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to={`/events/${event.id}`}>חזרה לפרטי המפגש</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="הגשה למפגש"
      subtitle="כאן רק עוזרים לנו להבין למה דווקא המפגש הזה מרגיש נכון עבורך — לא ממלאים הכול מחדש."
    >
      <Card className={tokens.card.accent}>
        <CardHeader>
          <CardTitle className="text-2xl">לפני שמתחילים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-foreground/85 leading-relaxed">
          {existingApplication && canReapplyToEvent(existingApplication.status) ? (
            <p>
              הייתה לך כבר הגשה קודמת למפגש הזה במצב "{formatApplicationStatusDetailed(existingApplication.status)}".
              שליחה עכשיו תפתח אותה מחדש כ-הגשה ממתינה.
            </p>
          ) : null}
          <p>
            אחרי ההגשה הסטטוס שלך יישמר למפגש הזה, ואם בהמשך יישמר עבורך מקום זמני נחזיר אותך למסך הזה כדי להגיב אליו בזמן.
          </p>
        </CardContent>
      </Card>

      {persistedApplicationAnswers ? (
        <>
          <SectionDivider />
          <SubmittedAnswersSummary
            answers={persistedApplicationAnswers}
            title="ההגשה הקודמת שלך"
            subtitle="אלה הפרטים האחרונים שנשמרו על ההגשה למפגש הזה. אם תרצה או תרצי להגיש מחדש, הטופס למטה יתחיל מהמידע הזה אלא אם קיימת טיוטה מקומית חדשה יותר."
          />
        </>
      ) : null}

      <SectionDivider />

      {existingApplication && canReapplyToEvent(existingApplication.status) ? (
        <div className="mb-3">
          <StatusBadge label={formatApplicationStatusShort(existingApplication.status)} />
        </div>
      ) : null}

      <Card className={tokens.card.surface}>
        <CardHeader>
          <CardTitle className="text-xl">פרטים על ההגשה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className={tokens.card.inner + ' p-4 space-y-2 text-sm text-foreground/80'}>
            <p><strong className="text-foreground">מפגש:</strong> {event.title}</p>
            <p><strong className="text-foreground">עיר:</strong> {event.city}</p>
            <p><strong className="text-foreground">תהליך:</strong> ההגשה נשמרת עכשיו, ובהמשך הסטטוס שלך יתעדכן כאן ובאזור האישי.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">למה דווקא המפגש הזה מעניין אותך?</label>
            <textarea
              value={whyThisEvent}
              onChange={(e) => setWhyThisEvent(e.target.value)}
              className="min-h-[120px] w-full rounded-3xl border border-input bg-background px-4 py-3 text-sm outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">מה היית רוצה לקבל מהמפגש הזה?</label>
            <select
              value={desiredOutcome}
              onChange={(e) => setDesiredOutcome(e.target.value)}
              className="w-full rounded-full border border-input bg-background px-4 py-3 text-sm outline-none"
            >
              <option value="">בחר/י תשובה אחת</option>
              <option value="meet_new_people">להכיר אנשים חדשים</option>
              <option value="meaningful_conversation">שיחה טובה ומשמעותית</option>
              <option value="easygoing_experience">חוויה נעימה וקלילה</option>
              <option value="inspiration">השראה / פתיחת אופקים</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">מה היית רוצה להביא לקבוצה?</label>
            <select
              value={whatYouBring}
              onChange={(e) => setWhatYouBring(e.target.value)}
              className="w-full rounded-full border border-input bg-background px-4 py-3 text-sm outline-none"
            >
              <option value="">בחר/י תשובה אחת</option>
              {WHAT_YOU_BRING_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">יש משהו שחשוב למארגן לדעת?</label>
            <textarea
              value={hostNote}
              onChange={(e) => setHostNote(e.target.value)}
              className="min-h-[100px] w-full rounded-3xl border border-input bg-background px-4 py-3 text-sm outline-none"
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-foreground">
            <input type="checkbox" checked={understandPayment} onChange={(e) => setUnderstandPayment(e.target.checked)} />
            אני מבין/ה שהתשלום יישלח רק אם אתקבל/י.
          </label>

          <label className="flex items-center gap-3 text-sm text-foreground">
            <input type="checkbox" checked={commitOnTime} onChange={(e) => setCommitOnTime(e.target.checked)} />
            אם אתקבל/י, אני מתחייב/ת לשלם בזמן כדי לשמור על המקום שלי.
          </label>

          {savedMessage ? <p className="text-sm text-primary">{savedMessage}</p> : null}
          {submitError ? <RouteErrorState title="לא הצלחנו לשמור את ההגשה" body={submitError} /> : null}

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={saveDraft} disabled={isSubmitting}>
              שמירת טיוטה
            </Button>
            <Button variant="primary" disabled={!canSubmit || isSubmitting} onClick={() => void handleSubmit()}>
              {isSubmitting ? 'שולח/ת...' : 'שליחת הגשה'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
