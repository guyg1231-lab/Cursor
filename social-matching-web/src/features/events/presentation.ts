import type { EventRow, VisibleEvent } from '@/features/events/types';

export type EventPresentation = {
  key: EventPresentationKey;
  moodLabel: string;
  bandGradientClassName: string;
  symbolShellClassName: string;
  moodChipClassName: string;
  shelfAccentClassName: string;
};

export type EventPresentationKey =
  | 'picnic'
  | 'beach-volleyball'
  | 'promenade-walk'
  | 'coffee-square'
  | 'young-house'
  | 'cinemateque'
  | 'default';

type CuratedSeedEvent = {
  id: string;
  title: string;
  description: string;
  city: string;
  venueHint: string;
  maxCapacity: number;
  daysUntilStart: number;
  daysUntilDeadline: number;
  presentation: EventPresentation;
};

const CURATED_SEED_EVENTS: CuratedSeedEvent[] = [
  {
    id: 'seed-picnic-park',
    title: 'פיקניק בפארק',
    description: 'פיקניק שקיעה על הדשא עם היכרות ושיחה טובה.',
    city: 'תל אביב',
    venueHint: 'פארק הירקון',
    maxCapacity: 12,
    daysUntilStart: 9,
    daysUntilDeadline: 6,
    presentation: {
      key: 'picnic',
      moodLabel: 'אחר צהריים רגוע',
      bandGradientClassName: 'from-[#edf6cf] via-[#f8f5e8] to-[#dceac9]',
      symbolShellClassName: 'border-white/70 bg-white/84 text-[#64744f]',
      moodChipClassName: 'border-[#cddbb0]/70 bg-white/76 text-[#5b6c49]',
      shelfAccentClassName: 'from-[#edf6cf] via-[#f8f5e8] to-[#dceac9]',
    },
  },
  {
    id: 'seed-beach-volleyball',
    title: 'קבוצת כדורעף חופים',
    description: 'משחק כדורעף חופים והיכרות תוך כדי סבבים.',
    city: 'תל אביב',
    venueHint: 'חוף גורדון',
    maxCapacity: 14,
    daysUntilStart: 11,
    daysUntilDeadline: 8,
    presentation: {
      key: 'beach-volleyball',
      moodLabel: 'בוקר פעיל',
      bandGradientClassName: 'from-[#d8efff] via-[#f7f6ed] to-[#f5d8b6]',
      symbolShellClassName: 'border-white/70 bg-white/84 text-[#4a6f8b]',
      moodChipClassName: 'border-[#c8e2f1]/75 bg-white/76 text-[#486981]',
      shelfAccentClassName: 'from-[#d8efff] via-[#f7f6ed] to-[#f5d8b6]',
    },
  },
  {
    id: 'seed-promenade-walk',
    title: 'קבוצת הליכה בטיילת',
    description: 'הליכת ערב על הים עם עצירה לקפה ושיחה.',
    city: 'תל אביב',
    venueHint: 'טיילת תל אביב',
    maxCapacity: 10,
    daysUntilStart: 13,
    daysUntilDeadline: 10,
    presentation: {
      key: 'promenade-walk',
      moodLabel: 'הליכה שקיעתית',
      bandGradientClassName: 'from-[#d9e4ff] via-[#fbf7ee] to-[#f3d7c2]',
      symbolShellClassName: 'border-white/70 bg-white/84 text-[#5b6f96]',
      moodChipClassName: 'border-[#d8dfef]/75 bg-white/76 text-[#5b6885]',
      shelfAccentClassName: 'from-[#d9e4ff] via-[#fbf7ee] to-[#f3d7c2]',
    },
  },
  {
    id: 'seed-coffee-square',
    title: 'קפה בכיכר',
    description: 'קפה קצר בכיכר להיכרות נעימה בלי לחץ.',
    city: 'תל אביב',
    venueHint: 'כיכר ביאליק',
    maxCapacity: 8,
    daysUntilStart: 7,
    daysUntilDeadline: 5,
    presentation: {
      key: 'coffee-square',
      moodLabel: 'מפגש קצר באמצע שבוע',
      bandGradientClassName: 'from-[#f2e4d1] via-[#fbf8f2] to-[#ebe5ff]',
      symbolShellClassName: 'border-white/70 bg-white/84 text-[#86654e]',
      moodChipClassName: 'border-[#eadac8]/75 bg-white/76 text-[#7a6254]',
      shelfAccentClassName: 'from-[#f2e4d1] via-[#fbf8f2] to-[#ebe5ff]',
    },
  },
  {
    id: 'seed-young-house-mingle',
    title: 'מפגש מינגלינג בבית הצעירים',
    description: 'ערב חברתי פתוח עם מעגלי היכרות מתחלפים.',
    city: 'תל אביב',
    venueHint: 'בית הצעירים',
    maxCapacity: 20,
    daysUntilStart: 15,
    daysUntilDeadline: 11,
    presentation: {
      key: 'young-house',
      moodLabel: 'ערב חברתי פתוח',
      bandGradientClassName: 'from-[#ede2ff] via-[#fff8ee] to-[#f9d9d6]',
      symbolShellClassName: 'border-white/70 bg-white/84 text-[#845f7f]',
      moodChipClassName: 'border-[#e7daef]/75 bg-white/76 text-[#7e607b]',
      shelfAccentClassName: 'from-[#ede2ff] via-[#fff8ee] to-[#f9d9d6]',
    },
  },
  {
    id: 'seed-cinemateque-evening',
    title: 'ערב סרט והרצאה בסינמטק',
    description: 'סרט משותף ושיחה פתוחה אחרי ההקרנה.',
    city: 'תל אביב',
    venueHint: 'סינמטק תל אביב',
    maxCapacity: 16,
    daysUntilStart: 18,
    daysUntilDeadline: 14,
    presentation: {
      key: 'cinemateque',
      moodLabel: 'תרבות ושיחה',
      bandGradientClassName: 'from-[#dde3fb] via-[#fbfaf5] to-[#e7ddd1]',
      symbolShellClassName: 'border-white/70 bg-white/84 text-[#546480]',
      moodChipClassName: 'border-[#dae1ed]/75 bg-white/76 text-[#5a6578]',
      shelfAccentClassName: 'from-[#dde3fb] via-[#fbfaf5] to-[#e7ddd1]',
    },
  },
];

const DEFAULT_EVENT_PRESENTATION: EventPresentation = {
  key: 'default',
  moodLabel: 'מפגש רגוע',
  bandGradientClassName: 'from-[hsl(var(--background))] via-[hsl(var(--accent-lavender)/0.18)] to-[hsl(var(--accent-sky)/0.1)]',
  symbolShellClassName: 'border-white/70 bg-white/84 text-foreground/70',
  moodChipClassName: 'border-border/70 bg-white/76 text-foreground/72',
  shelfAccentClassName: 'from-[hsl(var(--background))] via-[hsl(var(--accent-lavender)/0.18)] to-[hsl(var(--accent-sky)/0.1)]',
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function buildCuratedInitialEvents(nowIso: () => string, isoDaysFromNow: (daysFromNow: number) => string): EventRow[] {
  return CURATED_SEED_EVENTS.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    city: event.city,
    starts_at: isoDaysFromNow(event.daysUntilStart),
    registration_deadline: isoDaysFromNow(event.daysUntilDeadline),
    venue_hint: event.venueHint,
    max_capacity: event.maxCapacity,
    status: 'active',
    is_published: true,
    created_at: nowIso(),
    updated_at: nowIso(),
    created_by_user_id: null,
    host_user_id: null,
    payment_required: false,
    presentation_key: event.presentation.key,
    price_cents: 0,
    currency: 'ILS',
  }));
}

export function getLegacyEventSlugToTitleMap() {
  return Object.fromEntries(CURATED_SEED_EVENTS.map((event) => [event.id, event.title])) as Record<string, string>;
}

type EventWithPresentation =
  | Pick<VisibleEvent, 'id' | 'title' | 'presentation_key'>
  | Pick<EventRow, 'id' | 'title' | 'presentation_key'>;

export function getEventPresentation(event: EventWithPresentation): EventPresentation {
  const presentationKey = (event.presentation_key || '').trim() as EventPresentationKey;
  if (presentationKey) {
    return getEventPresentationByKey(presentationKey);
  }

  const normalizedId = normalize(event.id);
  const normalizedTitle = normalize(event.title);
  const matched = CURATED_SEED_EVENTS.find(
    (candidate) => normalize(candidate.id) === normalizedId || normalize(candidate.title) === normalizedTitle,
  );

  return matched?.presentation ?? DEFAULT_EVENT_PRESENTATION;
}

export function getEventPresentationByKey(key: EventPresentationKey): EventPresentation {
  if (key === 'default') return DEFAULT_EVENT_PRESENTATION;
  const matched = CURATED_SEED_EVENTS.find((candidate) => candidate.presentation.key === key);
  return matched?.presentation ?? DEFAULT_EVENT_PRESENTATION;
}
