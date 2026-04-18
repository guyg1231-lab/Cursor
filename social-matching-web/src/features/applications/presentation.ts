import type { EventRegistrationRow } from '@/features/applications/types';
import {
  formatLifecycleDateTime,
  isAwaitingParticipantResponse,
  isOfferExpired,
} from '@/features/applications/status';

export function resolveApplicationPanelContent(application: EventRegistrationRow): {
  title: string;
  body: string;
  footer?: string;
} {
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

  return { title: '', body: '' };
}
