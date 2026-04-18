import type { EventRegistrationRow } from '@/features/applications/types';

export function canReapplyToEvent(status: EventRegistrationRow['status']) {
  return status === 'cancelled' || status === 'rejected';
}

export function isApplicationBlocking(status: EventRegistrationRow['status']) {
  return !canReapplyToEvent(status);
}

export function isAwaitingParticipantResponse(status: EventRegistrationRow['status']) {
  return status === 'awaiting_response';
}

export function isConfirmedParticipation(status: EventRegistrationRow['status']) {
  return status === 'confirmed' || status === 'approved';
}

export function isOfferExpired(registration: Pick<EventRegistrationRow, 'status' | 'expires_at'>) {
  if (!isAwaitingParticipantResponse(registration.status)) return false;
  if (!registration.expires_at) return false;

  return new Date(registration.expires_at).getTime() <= Date.now();
}

export function canConfirmTemporarySpot(registration: Pick<EventRegistrationRow, 'status' | 'expires_at'>) {
  return isAwaitingParticipantResponse(registration.status) && !isOfferExpired(registration);
}

export function canManuallyOfferTemporarySpot(registration: Pick<EventRegistrationRow, 'status' | 'expires_at'>) {
  if (isAwaitingParticipantResponse(registration.status)) return false;
  if (isConfirmedParticipation(registration.status)) return false;
  return registration.status === 'pending' || registration.status === 'waitlist';
}

export function formatLifecycleDateTime(value: string | null) {
  if (!value) return 'לא צוין';

  try {
    return new Intl.DateTimeFormat('he-IL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatApplicationStatusShort(status: EventRegistrationRow['status']) {
  switch (status) {
    case 'pending':
      return 'הגשה נשלחה';
    case 'awaiting_response':
      return 'מקום זמני ממתין לתגובה';
    case 'confirmed':
      return 'המקום שלך שמור';
    case 'approved':
      return 'המקום שלך שמור';
    case 'waitlist':
      return 'רשימת המתנה';
    case 'rejected':
      return 'לא נבחר/ת הפעם';
    case 'cancelled':
      return 'בוטל';
    case 'attended':
      return 'השתתף/ה';
    case 'no_show':
      return 'לא הגיע/ה';
    default:
      return status;
  }
}

export function formatApplicationStatusDetailed(status: EventRegistrationRow['status']) {
  switch (status) {
    case 'pending':
      return 'ההגשה שלך נשמרה ונמצאת כרגע בבדיקה.';
    case 'awaiting_response':
      return 'נשמר עבורך מקום זמני. צריך להגיב עד הדדליין כדי לשמור עליו.';
    case 'confirmed':
      return 'המקום שלך למפגש הזה כבר שמור.';
    case 'approved':
      return 'המקום שלך למפגש הזה כבר שמור.';
    case 'waitlist':
      return 'כרגע אין לך מקום שמור, אבל ההרשמה שלך עדיין נמצאת ברשימת ההמתנה.';
    case 'rejected':
      return 'הפעם לא נפתח עבורך מקום במפגש הזה.';
    case 'cancelled':
      return 'ההרשמה למפגש הזה בוטלה.';
    case 'attended':
      return 'השתתפת במפגש';
    case 'no_show':
      return 'סומן/ה כהיעדרות';
    default:
      return status;
  }
}
