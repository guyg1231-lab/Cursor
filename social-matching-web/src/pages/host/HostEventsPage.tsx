import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { tokens } from '@/lib/design-tokens';
import { useAuth } from '@/contexts/AuthContext';
import { getQuestionnaireReadyState } from '@/features/applications/api';
import {
  createEventDraft,
  listHostOverviewEvents,
  submitEventRequest,
  updateEventDraft,
} from '@/features/host-events/api';
import type { HostEventRequest, HostEventRequestDraftInput, HostOverviewEvent } from '@/features/host-events/types';
import { formatEventDate, fromDateTimeLocalValue, toDateTimeLocalValue } from '@/features/events/formatters';

const EMPTY_DRAFT: HostEventRequestDraftInput = {
  title: '',
  description: '',
  city: 'תל אביב',
  venue_hint: '',
  starts_at: '',
  registration_deadline: '',
  max_capacity: '8',
};

function buildFormFromRequest(request: HostEventRequest): HostEventRequestDraftInput {
  return {
    title: request.title,
    description: request.description ?? '',
    city: request.city,
    venue_hint: request.venue_hint ?? '',
    starts_at: toDateTimeLocalValue(request.starts_at),
    registration_deadline: toDateTimeLocalValue(request.registration_deadline),
    max_capacity: request.max_capacity ? String(request.max_capacity) : '8',
  };
}

function getHostEventLabel(event: HostOverviewEvent) {
  if (event.status === 'draft') return 'טיוטה';
  if (event.status === 'submitted_for_review') return 'ממתין לבדיקה מנהלית';
  if (event.status === 'rejected') return 'נדחה';
  if (event.status === 'active') return 'פתוח לרישום';
  if (event.status === 'closed') return 'סגור למאצ׳ינג';
  if (event.status === 'completed') return 'הושלם';
  return event.status;
}

function getHostEventNextStep(event: HostOverviewEvent) {
  if (event.status === 'draft') {
    return 'הטיוטה נשמרת פרטית. השלב הבא הוא לעבור על הפרטים, לחדד את המפגש, ואז לשלוח לבדיקה.';
  }

  if (event.status === 'submitted_for_review') {
    return 'הבקשה כבר ממתינה למנהל/ת. כרגע לא צריך לעשות פעולה נוספת מתוך האזור הזה.';
  }

  if (event.status === 'rejected') {
    return 'הבקשה לא פורסמה. כרגע הסטטוס נשמר לצפייה בלבד, ועדיין אין מסלול תיקון או הגשה מחדש.';
  }

  if (event.status === 'active') {
    return 'האירוע פתוח לרישום. בשלב הזה אפשר לעקוב אחרי תמונת ההרשמות ברמה כוללת בלבד, בלי שליטה בבחירת משתתפים.';
  }

  if (event.status === 'closed') {
    return 'ההרשמה כבר נסגרה. מכאן התהליך ממשיך לבדיקת התאמה, הקצאות, והצעות מקום זמניות לפי תהליך המערכת.';
  }

  if (event.status === 'completed') {
    return 'האירוע הושלם. המסך הזה נשאר כתיעוד של מחזור החיים ושל תמונת ההרשמות שהייתה לאירוע.';
  }

  return 'האירוע הזה נשמר במערכת כחלק מבסיס הראות למארח/ת.';
}

function validateDraft(values: HostEventRequestDraftInput) {
  if (!values.title.trim()) return 'צריך לתת כותרת לבקשת האירוע.';
  if (!values.city.trim()) return 'צריך לבחור עיר או אזור.';
  if (!values.starts_at) return 'צריך לבחור מועד לאירוע.';

  const maxCapacity = Number(values.max_capacity);
  if (!Number.isInteger(maxCapacity) || maxCapacity < 5 || maxCapacity > 8) {
    return 'בקיבולת הראשונית של המערכת אפשר לבחור בין 5 ל-8 משתתפים.';
  }

  if (values.registration_deadline) {
    const startsAt = new Date(values.starts_at).getTime();
    const deadline = new Date(values.registration_deadline).getTime();
    if (Number.isNaN(deadline) || Number.isNaN(startsAt) || deadline >= startsAt) {
      return 'דדליין ההגשה צריך להיות לפני תחילת האירוע.';
    }
  }

  return null;
}

const fieldClassName =
  'w-full rounded-3xl border border-border bg-background/40 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15';

export function HostEventsPage() {
  return <HostEventsPageContent defaultToNewDraft={false} />;
}

export function EventProposalPage() {
  return <HostEventsPageContent defaultToNewDraft />;
}

function HostEventsPageContent({ defaultToNewDraft }: { defaultToNewDraft: boolean }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<HostOverviewEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEligibilityLoading, setIsEligibilityLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [activeEditorId, setActiveEditorId] = useState('');
  const [formValues, setFormValues] = useState<HostEventRequestDraftInput>(EMPTY_DRAFT);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRequest = useMemo(
    () => events.find((request) => request.id === activeEditorId) ?? null,
    [activeEditorId, events],
  );
  const canEditSelectedRequest = activeEditorId === 'new' || selectedRequest?.status === 'draft';
  const requestEvents = useMemo(
    () => events.filter((event) => event.created_by_user_id === user?.id && !event.host_user_id),
    [events, user?.id],
  );
  const hostedEvents = useMemo(
    () => events.filter((event) => event.host_user_id === user?.id),
    [events, user?.id],
  );

  function pickInitialEditorId(nextRequests: HostOverviewEvent[]) {
    const firstDraft = nextRequests.find((request) => request.status === 'draft');
    return firstDraft?.id ?? nextRequests[0]?.id ?? 'new';
  }

  async function refreshRequests(userId: string) {
    const nextRequests = await listHostOverviewEvents(userId);
    setEvents(nextRequests);
    setActiveEditorId((current) => {
      if (current === 'new') return 'new';
      if (current && nextRequests.some((request) => request.id === current)) return current;

      return pickInitialEditorId(nextRequests);
    });
  }

  useEffect(() => {
    let active = true;

    async function load() {
      if (!user) return;

      setIsLoading(true);
      setIsEligibilityLoading(true);
      setLoadError(null);

      try {
        const [readyState, nextRequests] = await Promise.all([
          getQuestionnaireReadyState(user.id),
          listHostOverviewEvents(user.id),
        ]);

        if (!active) return;
        setIsReady(readyState.ready);
        setEvents(nextRequests);
        setActiveEditorId((current) => current || (defaultToNewDraft ? 'new' : pickInitialEditorId(nextRequests)));
      } catch {
        if (!active) return;
        setLoadError('לא הצלחנו לטעון כרגע את אזור בקשות האירועים.');
      } finally {
        if (!active) return;
        setIsLoading(false);
        setIsEligibilityLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [defaultToNewDraft, user]);

  useEffect(() => {
    if (!activeEditorId) return;

    if (activeEditorId === 'new') {
      setFormValues(EMPTY_DRAFT);
      return;
    }

    if (selectedRequest) {
      setFormValues(buildFormFromRequest(selectedRequest));
    }
  }, [activeEditorId, selectedRequest]);

  async function handleSaveDraft() {
    if (!user) return;

    const validationError = validateDraft(formValues);
    if (validationError) {
      setActionError(validationError);
      setActionMessage(null);
      return;
    }

    setIsSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const payload = {
        ...formValues,
        starts_at: fromDateTimeLocalValue(formValues.starts_at),
        registration_deadline: fromDateTimeLocalValue(formValues.registration_deadline),
      };

      const request = selectedRequest && selectedRequest.status === 'draft'
        ? await updateEventDraft(selectedRequest.id, user.id, payload)
        : await createEventDraft(user.id, payload);

      await refreshRequests(user.id);
      setActiveEditorId(request.id);
      setActionMessage('הטיוטה נשמרה באזור הפרטי שלך.');
    } catch {
      setActionError('לא הצלחנו לשמור את הטיוטה כרגע.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmitForReview() {
    if (!user) return;

    const validationError = validateDraft(formValues);
    if (validationError) {
      setActionError(validationError);
      setActionMessage(null);
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const payload = {
        ...formValues,
        starts_at: fromDateTimeLocalValue(formValues.starts_at),
        registration_deadline: fromDateTimeLocalValue(formValues.registration_deadline),
      };

      const draft = selectedRequest && selectedRequest.status === 'draft'
        ? await updateEventDraft(selectedRequest.id, user.id, payload)
        : await createEventDraft(user.id, payload);

      const submitted = await submitEventRequest(draft.id, user.id);
      await refreshRequests(user.id);
      setActiveEditorId(submitted.id);
      setActionMessage('בקשת האירוע נשלחה לבדיקה מנהלית.');
    } catch {
      setActionError('לא הצלחנו לשלוח את הבקשה לבדיקה כרגע.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell
      title="בקשת אירוע"
      subtitle="כאן אפשר לבנות טיוטת אירוע פרטית, לשמור אותה לעצמך, ורק כשמרגיש מוכן לשלוח אותה לבדיקה מנהלית."
    >
      {isLoading || isEligibilityLoading ? (
        <Card className={tokens.card.surface}>
          <CardContent className="py-10 text-sm text-muted-foreground">טוענים את אזור בקשות האירועים...</CardContent>
        </Card>
      ) : loadError ? (
        <Card className={tokens.card.surface}>
          <CardContent className="py-10 text-sm text-destructive">{loadError}</CardContent>
        </Card>
      ) : !isReady ? (
        <Card className={tokens.card.surface}>
          <CardHeader>
            <CardTitle className="text-xl">עוד רגע אפשר לפתוח בקשת אירוע</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>בשלב הזה רק משתמשים עם פרופיל ושאלון מוכנים יכולים לפתוח טיוטת אירוע חדשה.</p>
            <Button asChild variant="primary">
              <Link to="/questionnaire">להשלמת השאלון</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <Card className={tokens.card.surface}>
              <CardHeader>
                <CardTitle className="text-xl">בקשות אירוע</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>הטיוטות כאן פרטיות. רק אחרי שליחה לבדיקה הן יופיעו בצד המנהלי.</p>
                <Button
                  type="button"
                  variant={activeEditorId === 'new' ? 'default' : 'outline'}
                  onClick={() => {
                    setActiveEditorId('new');
                    setActionError(null);
                    setActionMessage(null);
                  }}
                >
                  טיוטה חדשה
                </Button>
              </CardContent>
            </Card>

            {requestEvents.length === 0 ? (
              <Card className={tokens.card.surface}>
                <CardContent className="py-8 text-sm text-muted-foreground">
                  עדיין לא פתחת בקשת אירוע. אפשר להתחיל מטיוטה חדשה.
                </CardContent>
              </Card>
            ) : (
              requestEvents.map((request) => (
                <Card
                  key={request.id}
                  className={activeEditorId === request.id ? tokens.card.accent : tokens.card.surface}
                >
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-xl">{request.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{getHostEventLabel(request)}</p>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                    <p>מתי: {formatEventDate(request.starts_at)}</p>
                    <p>עיר: {request.city}</p>
                    <p>{getHostEventNextStep(request)}</p>
                    <Button
                      type="button"
                      variant={activeEditorId === request.id ? 'default' : 'outline'}
                      onClick={() => {
                        setActiveEditorId(request.id);
                        setActionError(null);
                        setActionMessage(null);
                      }}
                    >
                      {request.status === 'draft' ? 'לעריכת הטיוטה' : 'לצפייה בבקשה'}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}

            <Card className={tokens.card.surface}>
              <CardHeader>
                <CardTitle className="text-xl">אירועים שאת/ה מארח/ת</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>כאן מוצגת תמונת מצב כוללת בלבד. אין כאן שמות משתתפים או שליטה בבחירתם.</p>
              </CardContent>
            </Card>

            {hostedEvents.length === 0 ? (
              <Card className={tokens.card.surface}>
                <CardContent className="py-8 text-sm text-muted-foreground">
                  עדיין אין אירועים מאושרים שבהם הוגדרת כמארח/ת.
                </CardContent>
              </Card>
            ) : (
              hostedEvents.map((event) => (
                <Card key={event.id} className={tokens.card.surface}>
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-xl">{event.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{getHostEventLabel(event)}</p>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <div className={tokens.card.inner + ' p-4 space-y-2'}>
                      <p>מתי: {formatEventDate(event.starts_at)}</p>
                      <p>עיר: {event.city}</p>
                      <p>דדליין לרישום: {event.registration_deadline ? formatEventDate(event.registration_deadline) : 'לא צוין'}</p>
                    </div>

                    <p>{getHostEventNextStep(event)}</p>

                    {event.status === 'active' && event.is_published === true ? (
                      <div
                        className={tokens.card.inner + ' p-4 space-y-3'}
                        data-testid={`host-share-block-${event.id}`}
                      >
                        <p className="font-medium text-foreground">המפגש שלך אושר. זה הקישור לשיתוף:</p>
                        <p
                          dir="ltr"
                          className="break-all rounded-2xl border border-border bg-background/60 px-3 py-2 font-mono text-sm text-foreground"
                        >
                          {`${window.location.origin}/gathering/${event.id}`}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="primary"
                            onClick={() => {
                              void navigator.clipboard.writeText(
                                `${window.location.origin}/gathering/${event.id}`,
                              );
                            }}
                          >
                            העתקת הקישור
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(`/gathering/${event.id}`)}
                          >
                            פתיחת הקישור
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className={tokens.card.inner + ' p-4 space-y-1'}>
                        <p className="font-medium text-foreground">סה״כ הגשות פעילות</p>
                        <p className="text-2xl text-foreground">{event.registration_summary?.total_applied_like ?? 0}</p>
                      </div>
                      <div className={tokens.card.inner + ' p-4 space-y-1'}>
                        <p className="font-medium text-foreground">מקום זמני ממתין לתגובה</p>
                        <p className="text-2xl text-foreground">{event.registration_summary?.awaiting_response ?? 0}</p>
                      </div>
                      <div className={tokens.card.inner + ' p-4 space-y-1'}>
                        <p className="font-medium text-foreground">מקומות שמורים</p>
                        <p className="text-2xl text-foreground">{event.registration_summary?.confirmed_like ?? 0}</p>
                      </div>
                      <div className={tokens.card.inner + ' p-4 space-y-1'}>
                        <p className="font-medium text-foreground">רשימת המתנה</p>
                        <p className="text-2xl text-foreground">{event.registration_summary?.waitlisted ?? 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <Card className={tokens.card.accent}>
            <CardHeader>
              <CardTitle className="text-2xl">
                {activeEditorId === 'new' ? 'טיוטת אירוע חדשה' : selectedRequest?.title ?? 'בקשת אירוע'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-foreground/85">
              {selectedRequest && !canEditSelectedRequest ? (
                <div className="rounded-3xl border border-primary/10 bg-background/30 p-4 text-sm text-muted-foreground">
                  {selectedRequest.status === 'submitted_for_review'
                    ? 'בקשה שנשלחה לבדיקה נשארת כרגע לקריאה בלבד. אדמין יראה אותה בנפרד מאירועים שכבר פורסמו.'
                    : selectedRequest.status === 'rejected'
                      ? 'בקשה שנדחתה נשארת לקריאה בלבד כדי שהסטטוס שלה יהיה ברור גם למגיש/ה.'
                    : selectedRequest.host_user_id
                      ? 'אירוע מאושר מוצג כאן לקריאה בלבד. תמונת המצב הכוללת שלו מופיעה בעמודת האירועים החיים.'
                    : 'בשלב הזה רק טיוטות פרטיות ניתנות לעריכה מתוך האזור הזה.'}
                </div>
              ) : null}

              <label className="block space-y-2">
                <span className="font-medium text-foreground">כותרת האירוע</span>
                <input
                  className={fieldClassName}
                  value={formValues.title}
                  disabled={!canEditSelectedRequest || isSaving || isSubmitting}
                  onChange={(event) => setFormValues((current) => ({ ...current, title: event.target.value }))}
                />
              </label>

              <label className="block space-y-2">
                <span className="font-medium text-foreground">תיאור קצר</span>
                <textarea
                  className={fieldClassName + ' min-h-32 resize-y'}
                  value={formValues.description}
                  disabled={!canEditSelectedRequest || isSaving || isSubmitting}
                  onChange={(event) => setFormValues((current) => ({ ...current, description: event.target.value }))}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="font-medium text-foreground">עיר / אזור</span>
                  <input
                    className={fieldClassName}
                    value={formValues.city}
                    disabled={!canEditSelectedRequest || isSaving || isSubmitting}
                    onChange={(event) => setFormValues((current) => ({ ...current, city: event.target.value }))}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="font-medium text-foreground">קיבולת רצויה</span>
                  <input
                    type="number"
                    min={5}
                    max={8}
                    className={fieldClassName}
                    value={formValues.max_capacity}
                    disabled={!canEditSelectedRequest || isSaving || isSubmitting}
                    onChange={(event) => setFormValues((current) => ({ ...current, max_capacity: event.target.value }))}
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="font-medium text-foreground">רמז למיקום</span>
                <input
                  className={fieldClassName}
                  value={formValues.venue_hint}
                  disabled={!canEditSelectedRequest || isSaving || isSubmitting}
                  onChange={(event) => setFormValues((current) => ({ ...current, venue_hint: event.target.value }))}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="font-medium text-foreground">מועד האירוע</span>
                  <input
                    type="datetime-local"
                    className={fieldClassName}
                    value={formValues.starts_at}
                    disabled={!canEditSelectedRequest || isSaving || isSubmitting}
                    onChange={(event) => setFormValues((current) => ({ ...current, starts_at: event.target.value }))}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="font-medium text-foreground">דדליין להגשה</span>
                  <input
                    type="datetime-local"
                    className={fieldClassName}
                    value={formValues.registration_deadline}
                    disabled={!canEditSelectedRequest || isSaving || isSubmitting}
                    onChange={(event) =>
                      setFormValues((current) => ({ ...current, registration_deadline: event.target.value }))
                    }
                  />
                </label>
              </div>

              <div className={tokens.card.inner + ' p-4 space-y-2 text-sm text-muted-foreground'}>
                <p>בבלוק הזה המערכת שומרת טיוטה פרטית, ואז מעבירה אותה לסטטוס "נשלח לבדיקת מנהל".</p>
                <p>אחרי אישור מנהל, האירוע מתפרסם דרך החוזה הקיים `active + is_published`, והמארח/ת הראשי/ת נקבע/ת לפי יוצר/ת הבקשה.</p>
              </div>

              {actionMessage ? <p className="text-sm text-primary">{actionMessage}</p> : null}
              {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}

              {canEditSelectedRequest ? (
                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="outline" disabled={isSaving || isSubmitting} onClick={() => void handleSaveDraft()}>
                    {isSaving ? 'שומרים...' : 'שמירת טיוטה'}
                  </Button>
                  <Button type="button" variant="primary" disabled={isSaving || isSubmitting} onClick={() => void handleSubmitForReview()}>
                    {isSubmitting ? 'שולחים לבדיקה...' : 'שליחה לבדיקה מנהלית'}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
