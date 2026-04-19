import type { EventRegistrationRow } from '@/features/applications/types';
import {
  canReapplyToEvent,
  formatApplicationStatusDetailed,
  formatLifecycleDateTime,
  isAwaitingParticipantResponse,
  isConfirmedParticipation,
  isOfferExpired,
} from '@/features/applications/status';

export type ApplicationPanelContent = {
  title: string;
  body: string;
  footer?: string;
};

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
