import type { VisibleEvent } from '@/features/events/types';
import type { StatusBadgeTone } from '@/components/shared/StatusBadge';

export function formatEventDate(value: string) {
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

export function formatEventStatus(status: string) {
  switch (status) {
    case 'draft':
      return 'טיוטה פרטית';
    case 'submitted_for_review':
      return 'נשלח לבדיקת מנהל';
    case 'rejected':
      return 'נדחה';
    case 'active':
      return 'אירוע פעיל';
    case 'closed':
      return 'סגור';
    case 'completed':
      return 'הסתיים';
    default:
      return status;
  }
}

export function formatVisibleEventRegistrationState(event: VisibleEvent): {
  label: string;
  tone: StatusBadgeTone;
} {
  if (event.is_registration_open) {
    if (event.registration_deadline) {
      return {
        label: `להגשה עד ${formatEventDate(event.registration_deadline)}`,
        tone: 'warning',
      };
    }
    return { label: 'פתוח להגשה', tone: 'default' };
  }

  if (event.status === 'completed') {
    return { label: 'המפגש כבר הסתיים', tone: 'muted' };
  }

  return { label: 'ההגשה סגורה כרגע', tone: 'muted' };
}

export function formatMobileEventWindowLabel(event: VisibleEvent) {
  const areaHint = event.venue_hint?.trim() ?? event.city;
  const dateLabel = formatEventDate(event.starts_at);

  if (event.is_registration_open) {
    return `${dateLabel} · ${areaHint}`;
  }

  return `${dateLabel} · ${areaHint} · ההגשה סגורה כרגע`;
}

export function toDateTimeLocalValue(value: string | null) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

export function fromDateTimeLocalValue(value: string) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString();
}
