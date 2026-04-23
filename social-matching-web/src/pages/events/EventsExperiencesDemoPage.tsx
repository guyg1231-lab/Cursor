import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EventAttendeeCircles } from '@/features/events/components/EventAttendeeCircles';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/design-tokens';

type DemoEvent = {
  title: string;
  vibe: string;
  when: string;
  where: string;
  socialDetail: string;
  attendees: number;
  capacity: string;
  mood: string;
  hostNote: string;
  emoji: string;
  tintClassName: string;
};

const DEMO_EVENTS: DemoEvent[] = [
  {
    title: 'פיקניק בפארק',
    vibe: 'שמיכה גדולה, פירות קיץ ושיחה פתוחה עם אנשים שבאים בנחת.',
    when: 'שישי, 16:30',
    where: 'פארק הירקון',
    socialDetail: 'האווירה כבר מתחילה להתרכך',
    attendees: 8,
    capacity: 'עד 12 משתתפים',
    mood: 'אחר צהריים רגוע',
    hostNote: 'מפגש פתוח עם שמיכה, משחקים קטנים ונשנושים שמופיעים מעצמם.',
    emoji: '🧺',
    tintClassName: 'from-[#edf6cf] via-[#f8f5e8] to-[#dceac9]',
  },
  {
    title: 'קבוצת כדורעף חופים',
    vibe: 'משחק קליל ליד המים, עם אנרגיה טובה והחלפות בין סבבים.',
    when: 'שבת, 09:00',
    where: 'חוף גורדון',
    socialDetail: 'כבר יש גרעין שמרים את הקצב',
    attendees: 10,
    capacity: 'עד 14 משתתפים',
    mood: 'בוקר פעיל',
    hostNote: 'למי שאוהב להתחיל את היום עם תנועה, ים וקבוצה עם אנרגיה טובה.',
    emoji: '🏐',
    tintClassName: 'from-[#d8efff] via-[#f7f6ed] to-[#f5d8b6]',
  },
  {
    title: 'קבוצת הליכה בטיילת',
    vibe: 'מסלול נעים עם עצירות לשיחה, קפה קטן ונוף פתוח לים.',
    when: 'שלישי, 18:45',
    where: 'טיילת תל אביב',
    socialDetail: 'הקבוצה כבר מרגישה מתואמת',
    attendees: 6,
    capacity: 'עד 10 משתתפים',
    mood: 'הליכה שקיעתית',
    hostNote: 'מתאים למי שמעדיף היכרות דרך תנועה איטית ושיחה בדרך.',
    emoji: '🚶',
    tintClassName: 'from-[#d9e4ff] via-[#fbf7ee] to-[#f3d7c2]',
  },
  {
    title: 'קפה בכיכר',
    vibe: 'שולחן קטן בחוץ, שיחה קלה ופתיחות נעימה למפגש ראשון.',
    when: 'רביעי, 17:30',
    where: 'כיכר ביאליק',
    socialDetail: 'נבנית קבוצה קטנה ומדויקת',
    attendees: 5,
    capacity: 'עד 8 משתתפים',
    mood: 'מפגש קצר באמצע שבוע',
    hostNote: 'שולחן קטן, שיחה נעימה ואפשרות להכיר בלי ערב ארוך.',
    emoji: '☕',
    tintClassName: 'from-[#f2e4d1] via-[#fbf8f2] to-[#ebe5ff]',
  },
  {
    title: 'מפגש מינגלינג בבית הצעירים',
    vibe: 'ערב חברתי פתוח עם מעגלי היכרות, יין קליל וקצב לא מתאמץ.',
    when: 'חמישי, 20:00',
    where: 'בית הצעירים',
    socialDetail: 'כבר רואים אנשים שמביאים אנרגיה חמה',
    attendees: 14,
    capacity: 'עד 20 משתתפים',
    mood: 'ערב חברתי פתוח',
    hostNote: 'מעגלים קצרים, מוזיקה רכה ותחושה של ערב שנכנסים אליו בקלות.',
    emoji: '🥂',
    tintClassName: 'from-[#ede2ff] via-[#fff8ee] to-[#f9d9d6]',
  },
  {
    title: 'ערב סרט והרצאה בסינמטק',
    vibe: 'הקרנה עם הקדמה קצרה ושיחה טובה אחרי, למי שאוהב תרבות עם עומק.',
    when: 'שני, 19:30',
    where: 'סינמטק תל אביב',
    socialDetail: 'יש כבר קהל שמגיע בשביל התוכן',
    attendees: 11,
    capacity: 'עד 16 משתתפים',
    mood: 'תרבות ושיחה',
    hostNote: 'למי שאוהב ערבים עם תוכן, הקשבה ושיחה טובה אחרי ההקרנה.',
    emoji: '🎬',
    tintClassName: 'from-[#dde3fb] via-[#fbfaf5] to-[#e7ddd1]',
  },
];

function DemoSection({
  title,
  subtitle,
  description,
  gridClassName,
  shelfClassName,
  density,
  testId,
}: {
  title: string;
  subtitle: string;
  description: string;
  gridClassName: string;
  shelfClassName?: string;
  density: 'balanced' | 'tight';
  testId: string;
}) {
  return (
    <section className="space-y-4">
      <div className="mx-auto flex max-w-[1380px] flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className={tokens.typography.eyebrow}>{subtitle}</p>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">{title}</h2>
            <span className="rounded-full border border-border/70 bg-card/88 px-3 py-1 text-[11px] font-medium text-foreground/72 shadow-sm">
              {density === 'balanced' ? 'יותר נושם' : 'יותר מהודק'}
            </span>
          </div>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-foreground/72">{description}</p>
      </div>

      <div className="relative left-1/2 w-screen max-w-[1740px] -translate-x-1/2 px-4 sm:px-6 xl:px-10">
        <div
          data-testid={testId}
          className={cn(
            'mx-auto grid items-start gap-4 rounded-[36px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--card)/0.95)_0%,hsl(var(--background)/0.92)_100%)] p-4 shadow-[0_28px_60px_-40px_hsl(var(--foreground)/0.24)]',
            gridClassName,
            shelfClassName,
          )}
        >
          {DEMO_EVENTS.map((event) => (
            <ExperienceDemoCard key={`${density}-${event.title}`} event={event} density={density} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ExperienceDemoCard({ event, density }: { event: DemoEvent; density: 'balanced' | 'tight' }) {
  const isTight = density === 'tight';

  return (
    <Card
      data-testid="experience-demo-card"
      className={cn(
        'group flex h-full min-w-0 flex-col overflow-hidden rounded-[28px] border border-border/65 bg-card/98 shadow-[0_24px_42px_-32px_hsl(var(--foreground)/0.26),0_12px_20px_-18px_hsl(var(--foreground)/0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_52px_-30px_hsl(var(--foreground)/0.28),0_16px_28px_-20px_hsl(var(--foreground)/0.12)]',
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden border-b border-border/55 bg-gradient-to-br',
          event.tintClassName,
          isTight ? 'px-3 pb-3 pt-3' : 'px-4 pb-4 pt-4',
        )}
      >
        <div className={cn('absolute inset-x-6 top-0 rounded-full bg-white/55 blur-2xl', isTight ? 'h-14' : 'h-20')} />
        <div className={cn('relative flex flex-col justify-between', isTight ? 'min-h-[118px]' : 'min-h-[138px]')}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge label={event.mood} tone="muted" />
                {!isTight ? <StatusBadge label={event.capacity} tone="warning" /> : null}
              </div>
              <p className={cn('max-w-[18ch] text-foreground/78', isTight ? 'text-[12px] leading-5' : 'text-xs leading-5')}>
                {event.hostNote}
              </p>
            </div>
            <div
              className={cn(
                'flex shrink-0 items-center justify-center rounded-[22px] border border-white/65 bg-white/82 shadow-[0_12px_20px_-16px_hsl(var(--foreground)/0.4)]',
                isTight ? 'h-12 w-12 text-2xl' : 'h-14 w-14 text-[1.9rem]',
              )}
            >
              <span aria-hidden="true">{event.emoji}</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/65 bg-white/84 px-3 py-1 text-[11px] font-medium text-foreground/78 shadow-sm">
              {event.where}
            </span>
            <span className="rounded-full border border-white/60 bg-white/68 px-3 py-1 text-[11px] text-foreground/74">
              {event.when}
            </span>
          </div>
        </div>
      </div>

      <CardContent className={cn('flex flex-1 flex-col', isTight ? 'space-y-3 p-3' : 'space-y-3.5 p-4')}>
        <div className="space-y-1.5">
          <h3
            className={cn(
              'font-semibold tracking-[-0.025em] text-foreground',
              isTight ? 'text-[1.02rem] leading-5' : 'text-[1.22rem] leading-6',
            )}
          >
            {event.title}
          </h3>
          <p className={cn('text-foreground/78', isTight ? 'text-[12px] leading-5' : 'text-sm leading-6')}>
            {event.vibe}
          </p>
        </div>

        {!isTight ? (
          <div className={cn(tokens.card.inner, 'space-y-2 p-3')}>
            <div className="grid grid-cols-2 gap-2 text-start">
              <div className="space-y-1">
                <p className={tokens.typography.eyebrow}>מתי</p>
                <p className="text-sm leading-5 text-foreground">{event.when}</p>
              </div>
              <div className="space-y-1">
                <p className={tokens.typography.eyebrow}>איפה</p>
                <p className="text-sm leading-5 text-foreground">{event.where}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-border/65 bg-background/75 px-2.5 py-1 text-[11px] font-medium text-foreground/72">
              {event.capacity}
            </span>
            <span className="rounded-full border border-border/55 bg-background/70 px-2.5 py-1 text-[11px] text-foreground/66">
              חדר קטן וחברתי
            </span>
          </div>
        )}

        <div className={cn('mt-auto space-y-2 border-t border-border/55', isTight ? 'pt-2.5' : 'pt-3')}>
          <EventAttendeeCircles
            count={event.attendees}
            label={`${event.attendees} כבר בפנים`}
            detail={event.socialDetail}
            density="compact"
          />
          <Button type="button" variant="primary" size={isTight ? 'sm' : 'default'} className="w-full">
            {isTight ? 'לצפייה' : 'לפרטי הערב'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function EventsExperiencesDemoPage() {
  return (
    <PageShell
      title="השוואת מדף אירועים"
      subtitle="שתי גרסאות לאותה משפחת גלישה: אחת מאוזנת עם 4 בשורה, ואחת מהודקת עם 6 בשורה, קרוב יותר לשפת המדף שבחרנו."
      heroAlign="center"
    >
      <div className="mx-auto w-full max-w-[1580px] space-y-10">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-center gap-2.5">
          <span className="rounded-full border border-border/70 bg-card/84 px-4 py-2 text-[12px] font-medium text-foreground/74 shadow-sm">
            6 אירועים אמיתיים להשוואה
          </span>
          <span className="rounded-full border border-border/70 bg-card/84 px-4 py-2 text-[12px] font-medium text-foreground/74 shadow-sm">
            עיגולי המשתתפים נשארים גלויים
          </span>
          <span className="rounded-full border border-border/70 bg-card/84 px-4 py-2 text-[12px] font-medium text-foreground/74 shadow-sm">
            עברית-ראשונה, חם, רגוע, פרימיום
          </span>
          <span className="rounded-full border border-border/70 bg-card/84 px-4 py-2 text-[12px] font-medium text-foreground/74 shadow-sm">
            4 מול 6 בשורה באותה משפחה
          </span>
        </div>

        <div className="mx-auto grid max-w-[1180px] gap-3 md:grid-cols-3">
          <div className={tokens.card.inner + ' p-4'}>
            <p className={tokens.typography.eyebrow}>מה בודקים</p>
            <p className="mt-1 text-sm leading-6 text-foreground/80">האם אותו עולם יכול להחזיק מדף שקט אבל צפוף, בלי להפוך ללוח אירועים מסחרי.</p>
          </div>
          <div className={tokens.card.inner + ' p-4'}>
            <p className={tokens.typography.eyebrow}>מה נשאר</p>
            <p className="mt-1 text-sm leading-6 text-foreground/80">שם, vibe, מיקום, זמן, הוכחה חברתית ו-CTA עגול נשארים מרכזיים בכל כרטיס.</p>
          </div>
          <div className={tokens.card.inner + ' p-4'}>
            <p className={tokens.typography.eyebrow}>מה משתנה</p>
            <p className="mt-1 text-sm leading-6 text-foreground/80">ב-6 בשורה ההיררכיה קצרה ומהירה יותר, עם תחושת מדף מהודקת יותר.</p>
          </div>
        </div>

        <DemoSection
          title="4 בשורה"
          subtitle="גרסה מאוזנת"
          description="גרסה צפופה אבל יותר נינוחה, עם כרטיסים מעט עשירים יותר ותחושת מדף פרימיום שמתאימה למי שרוצה להשוות בלי עומס."
          gridClassName="xl:grid-cols-4"
          shelfClassName="max-w-[1340px]"
          density="balanced"
          testId="experiences-demo-grid-4"
        />

        <DemoSection
          title="6 בשורה"
          subtitle="גרסה מהודקת"
          description="אותה משפחה, רק מהירה ומהודקת יותר: כרטיסים קצרים יותר, CTA קטן יותר, והצגה שמתקרבת יותר למדף צפוף בסגנון ההשראות."
          gridClassName="xl:grid-cols-6 md:grid-cols-3"
          shelfClassName="max-w-[1680px]"
          density="tight"
          testId="experiences-demo-grid-6"
        />

        <section className="mx-auto max-w-[1180px] space-y-4">
          <div className="space-y-1 text-center">
            <p className={tokens.typography.eyebrow}>מבט מובייל</p>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">fallback למובייל</h2>
            <p className="text-sm leading-6 text-foreground/72">אותו עולם יורד למסך צר דרך כרטיסים אופקיים, בלי לאבד את העיגולים, ה-vibe וה-CTA.</p>
          </div>
          <div
            data-testid="experiences-demo-mobile"
            className="rounded-[32px] border border-border/60 bg-card/72 p-3 shadow-[0_24px_48px_-34px_hsl(var(--foreground)/0.18)]"
          >
            <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {DEMO_EVENTS.slice(0, 3).map((event) => (
                <div key={`mobile-${event.title}`} className="min-w-[282px] max-w-[282px] shrink-0 sm:min-w-[300px] sm:max-w-[300px]">
                  <ExperienceDemoCard event={event} density="balanced" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
