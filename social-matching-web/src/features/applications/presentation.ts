import type { StatusBadgeTone } from '@/lib/design-tokens';
import type { EventRegistrationRow } from '@/features/applications/types';
import {
  canReapplyToEvent,
  formatApplicationStatusDetailed,
  formatLifecycleDateTime,
  isAwaitingParticipantResponse,
  isConfirmedParticipation,
  isOfferExpired,
} from '@/features/applications/status';

/** Maps DB registration status to badge severity — straw-man from foundation ticket F-6. */
export function resolveApplicationBadgeTone(status: EventRegistrationRow['status']): StatusBadgeTone {
  switch (status) {
    case 'confirmed':
    case 'approved':
    case 'attended':
      return 'success';
    case 'awaiting_response':
    case 'waitlist':
      return 'warning';
    case 'rejected':
    case 'cancelled':
    case 'no_show':
      return 'danger';
    case 'pending':
      return 'default';
  }
}

export type ApplicationPanelContent = {
  title: string;
  body: string;
  footer?: string;
};

export type ApplicationLifecycleRowContent = {
  summary: string;
  deadlineLine?: string;
};

type ApplicationLifecycleContentInput = Pick<EventRegistrationRow, 'status' | 'expires_at'>;

export function resolveApplicationLifecycleRowContent(
  application: ApplicationLifecycleContentInput,
): ApplicationLifecycleRowContent {
  if (isAwaitingParticipantResponse(application.status)) {
    if (isOfferExpired(application)) {
      return {
        summary: 'חלון התגובה למקום הזמני נסגר.',
        deadlineLine: application.expires_at
          ? `המועד שעבר: ${formatLifecycleDateTime(application.expires_at)}`
          : 'המועד לתגובה כבר עבר.',
      };
    }

    return {
      summary: 'נשמר עבורך מקום זמני. כדי לשמור עליו צריך לאשר בזמן.',
      deadlineLine: application.expires_at
        ? `מועד אחרון לתגובה: ${formatLifecycleDateTime(application.expires_at)}`
        : 'מועד אחרון לתגובה: לא צוין',
    };
  }

  if (isConfirmedParticipation(application.status)) {
    return { summary: 'המקום שלך למפגש הזה כבר שמור.' };
  }

  if (canReapplyToEvent(application.status)) {
    return {
      summary: `${formatApplicationStatusDetailed(application.status)} אפשר להגיש שוב אם המפגש עדיין פתוח.`,
    };
  }

  if (application.status === 'pending') {
    return { summary: 'ההגשה שלך נשמרה ונמצאת כרגע בבדיקה.' };
  }

  return {
    summary: formatApplicationStatusDetailed(application.status),
  };
}

export function resolveApplicationPanelContent(
  application: EventRegistrationRow,
): ApplicationPanelContent {
  if (isAwaitingParticipantResponse(application.status)) {
    if (isOfferExpired(application)) {
      return {
        title: 'חלון התגובה למקום הזמני נסגר',
        body: 'המקום הזמני כבר לא ממתין לתגובה.',
        footer: `המועד שעבר: ${formatLifecycleDateTime(application.expires_at)}`,
      };
    }

    return {
      title: 'נשמר עבורך מקום זמני',
      body: 'כדי לשמור על המקום צריך לאשר את ההרשמה עד המועד שמופיע למטה.',
      footer: application.expires_at
        ? `מועד אחרון לתגובה: ${formatLifecycleDateTime(application.expires_at)}`
        : 'לא צוין מועד אחרון',
    };
  }

  if (isConfirmedParticipation(application.status)) {
    return {
      title: 'המקום שלך במפגש נשמר',
      body: formatApplicationStatusDetailed(application.status),
    };
  }

  if (canReapplyToEvent(application.status)) {
    return {
      title: 'הייתה לך הגשה קודמת למפגש הזה',
      body: `${formatApplicationStatusDetailed(application.status)}. אם המפגש עדיין פתוח, אפשר להגיש שוב.`,
    };
  }

  if (application.status === 'attended' || application.status === 'no_show') {
    return {
      title: 'המפגש כבר הסתיים',
      body: formatApplicationStatusDetailed(application.status),
    };
  }

  if (application.status === 'waitlist') {
    return {
      title: 'ההגשה ברשימת המתנה',
      body: formatApplicationStatusDetailed(application.status),
    };
  }

  if (application.status === 'pending') {
    return {
      title: 'ההגשה שלך נשלחה',
      body: formatApplicationStatusDetailed(application.status),
    };
  }

  return {
    title: 'כבר קיימת הגשה למפגש הזה',
    body: formatApplicationStatusDetailed(application.status),
  };
}
