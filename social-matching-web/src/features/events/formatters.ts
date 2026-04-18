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
