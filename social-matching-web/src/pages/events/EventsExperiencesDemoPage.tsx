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
  gridClassName,
  shelfClassName,
  sectionClassName,
  density,
  emphasis,
  testId,
}: {
  title: string;
  subtitle: string;
  gridClassName: string;
  shelfClassName?: string;
  sectionClassName?: string;
  density: 'balanced' | 'editorial';
  emphasis?: 'selected' | 'explore';
  testId: string;
}) {
  return (
    <section className={cn('space-y-3', sectionClassName)}>
      <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className={tokens.typography.eyebrow}>{subtitle}</p>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">{title}</h2>
          <span className="rounded-full border border-border/70 bg-card/88 px-3 py-1 text-[11px] font-medium text-foreground/72 shadow-sm">
            {density === 'balanced' ? 'צפוף מאוזן' : 'editorial רגוע'}
          </span>
          {emphasis === 'selected' ? (
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary shadow-sm">
              נבחר להמשך
            </span>
          ) : null}
          {emphasis === 'explore' ? (
            <span className="rounded-full border border-border/70 bg-background/90 px-3 py-1 text-[11px] font-medium text-foreground/72 shadow-sm">
              כיוון רגוע
            </span>
          ) : null}
        </div>
      </div>

      <div className="mx-auto w-full px-4 sm:px-6 xl:px-8">
        <div
          data-testid={testId}
          className={cn(
            'mx-auto grid items-stretch gap-4 rounded-[36px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--card)/0.95)_0%,hsl(var(--background)/0.92)_100%)] p-4 shadow-[0_28px_60px_-40px_hsl(var(--foreground)/0.24)]',
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

function ExperienceDemoCard({ event, density }: { event: DemoEvent; density: 'balanced' | 'editorial' }) {
  const isEditorial = density === 'editorial';

  return (
    <Card
      data-testid="experience-demo-card"
      className={cn(
        'group flex h-full min-w-0 flex-col overflow-hidden border border-border/65 bg-card/98 transition duration-300 hover:-translate-y-0.5',
        isEditorial
          ? 'rounded-[32px] shadow-[0_28px_52px_-34px_hsl(var(--foreground)/0.22),0_14px_24px_-18px_hsl(var(--foreground)/0.08)] hover:shadow-[0_34px_60px_-32px_hsl(var(--foreground)/0.24),0_18px_30px_-20px_hsl(var(--foreground)/0.1)]'
          : 'rounded-[28px] shadow-[0_24px_42px_-32px_hsl(var(--foreground)/0.26),0_12px_20px_-18px_hsl(var(--foreground)/0.08)] hover:shadow-[0_28px_52px_-30px_hsl(var(--foreground)/0.28),0_16px_28px_-20px_hsl(var(--foreground)/0.12)]',
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden border-b border-border/55 bg-gradient-to-br',
          event.tintClassName,
          isEditorial ? 'px-5 pb-5 pt-5' : 'px-4 pb-4 pt-4',
        )}
      >
        <div className={cn('absolute inset-x-6 top-0 rounded-full bg-white/55 blur-2xl', isEditorial ? 'h-24' : 'h-20')} />
        <div className={cn('relative flex flex-col justify-between', isEditorial ? 'min-h-[154px]' : 'min-h-[138px]')}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge label={event.mood} tone="muted" />
                <StatusBadge label={event.capacity} tone="warning" />
              </div>
              <p
                className={cn(
                  'overflow-hidden text-foreground/78',
                  isEditorial ? 'max-w-[28ch] min-h-[3.75rem] text-[13px] leading-6' : 'max-w-[18ch] min-h-[3.75rem] text-xs leading-5',
                )}
              >
                {event.hostNote}
              </p>
            </div>
            <div
              className={cn(
                'flex shrink-0 items-center justify-center rounded-[22px] border border-white/65 bg-white/82 shadow-[0_12px_20px_-16px_hsl(var(--foreground)/0.4)]',
                isEditorial ? 'h-16 w-16 text-[2rem]' : 'h-14 w-14 text-[1.9rem]',
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

      <CardContent className={cn('flex flex-1 flex-col', isEditorial ? 'space-y-4 p-5' : 'space-y-3.5 p-4')}>
        <div className="space-y-1.5">
          <h3
            className={cn(
              'font-semibold tracking-[-0.025em] text-foreground',
              isEditorial ? 'text-[1.45rem] leading-7' : 'text-[1.22rem] leading-6',
            )}
          >
            {event.title}
          </h3>
          <p
            className={cn(
              'overflow-hidden text-foreground/78',
              isEditorial ? 'min-h-[4.5rem] text-[15px] leading-7' : 'min-h-[5.25rem] text-sm leading-6',
            )}
          >
            {event.vibe}
          </p>
        </div>

        <div className={cn(tokens.card.inner, isEditorial ? 'space-y-2.5 p-4' : 'space-y-2 p-3')}>
          <div className="grid grid-cols-2 gap-2 text-start">
            <div className="space-y-1">
              <p className={tokens.typography.eyebrow}>מתי</p>
              <p className={cn('text-foreground', isEditorial ? 'text-[15px] leading-6' : 'text-sm leading-5')}>{event.when}</p>
            </div>
            <div className="space-y-1">
              <p className={tokens.typography.eyebrow}>איפה</p>
              <p className={cn('text-foreground', isEditorial ? 'text-[15px] leading-6' : 'text-sm leading-5')}>{event.where}</p>
            </div>
          </div>
        </div>

        {isEditorial ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border/60 bg-background/78 px-3 py-1 text-[12px] font-medium text-foreground/72">
              חדר קטן עם שיחה נינוחה
            </span>
            <span className="rounded-full border border-border/55 bg-background/72 px-3 py-1 text-[12px] text-foreground/68">
              מתאים לפתיחה רגועה
            </span>
          </div>
        ) : null}

        <div className={cn('mt-auto space-y-2 border-t border-border/55', isEditorial ? 'pt-3.5' : 'pt-3')}>
          <EventAttendeeCircles
            count={event.attendees}
            label={`${event.attendees} כבר בפנים`}
            detail={event.socialDetail}
            density="compact"
          />
          <Button type="button" variant="primary" size={isEditorial ? 'lg' : 'default'} className="w-full">
            {isEditorial ? 'לפתוח את הערב' : 'לפרטי הערב'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function EventsExperiencesDemoPage() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-[1580px] space-y-6 md:space-y-7">
        <div className="mx-auto flex max-w-[1380px] items-end justify-between gap-4">
          <div className="space-y-1">
            <p className={tokens.typography.eyebrow}>אירועים</p>
            <h1 className="text-[2rem] font-semibold leading-[1.02] tracking-[-0.04em] text-foreground md:text-[2.7rem]">
              אירועים
            </h1>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary">
              4 בשורה נבחר
            </span>
            <span className="rounded-full border border-border/70 bg-card/90 px-3 py-1.5 text-[11px] font-medium text-foreground/72">
              3 בשורה לבדיקה
            </span>
          </div>
        </div>

        <DemoSection
          title="4 בשורה"
          subtitle="גרסה מאוזנת"
          gridClassName="xl:grid-cols-4"
          shelfClassName="max-w-[1340px]"
          sectionClassName="hidden md:block"
          density="balanced"
          emphasis="selected"
          testId="experiences-demo-grid-4"
        />

        <DemoSection
          title="3 בשורה"
          subtitle="גרסה רגועה"
          gridClassName="xl:grid-cols-3"
          shelfClassName="max-w-[1320px]"
          sectionClassName="hidden md:block"
          density="editorial"
          emphasis="explore"
          testId="experiences-demo-grid-3"
        />

        <section className="mx-auto max-w-[1180px] space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <p className={tokens.typography.eyebrow}>מבט מובייל</p>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">fallback למובייל</h2>
            </div>
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
