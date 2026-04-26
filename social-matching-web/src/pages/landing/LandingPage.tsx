import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RouteEmptyState, RouteErrorState, RouteLoadingState } from '@/components/shared/RouteState';
import { PageShell } from '@/components/shared/PageShell';
import { SectionDivider } from '@/components/shared/SectionDivider';
import { listVisibleEvents } from '@/features/events/api';
import { EventSummaryCard } from '@/features/events/components/EventSummaryCard';
import type { VisibleEvent } from '@/features/events/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { tokens } from '@/lib/design-tokens';

const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL?.trim();

export function LandingPage() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<VisibleEvent[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    let stale = false;

    async function loadLandingEvents() {
      setIsEventsLoading(true);
      setEventsError(null);

      try {
        const visibleEvents = await listVisibleEvents();
        if (stale) return;
        setEvents(visibleEvents.slice(0, 3));
      } catch {
        if (stale) return;
        setEventsError(t('landingEventsLoadErrorBody'));
      } finally {
        if (!stale) setIsEventsLoading(false);
      }
    }

    void loadLandingEvents();
    return () => {
      stale = true;
    };
  }, [t]);

  return (
    <PageShell headerTransparent>
      <section className="relative -mx-4 flex min-h-[60vh] items-center overflow-hidden px-4 pb-14 pt-20 sm:pb-16 sm:pt-24 md:-mx-8 md:min-h-[64vh] md:px-5 md:pb-20 md:pt-28 lg:min-h-[68vh] lg:pb-24 lg:pt-32">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 50% 30%, hsl(var(--primary) / 0.08), transparent 70%)',
            }}
          />
        </div>
        <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center md:max-w-3xl">
          <p className="mb-3 text-sm tracking-wide text-muted-foreground sm:mb-4">{t('landingIntroEyebrow')}</p>
          <div className="mb-3 flex items-center justify-center sm:mb-4">
            <Sparkles className="h-5 w-5 text-primary animate-sparkle-rotate" aria-hidden="true" />
          </div>
          <h1 className="mb-3 text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl md:mb-5 md:text-[2.85rem] lg:text-5xl">
            <span>{t('landingIntroTitleBefore')}</span>
            <span className="text-primary">{t('landingIntroTitleBrand')}</span>
          </h1>
          <p className="mb-8 max-w-2xl text-base leading-7 text-muted-foreground sm:mb-10 sm:text-[1.0625rem] md:mb-12 md:max-w-[42rem] md:text-lg md:leading-8">
            {t('landingIntroBody')}
          </p>
        </div>
      </section>

      <section className="relative -mx-4 overflow-hidden px-4 pb-14 pt-7 sm:pb-16 sm:pt-8 md:-mx-8 md:px-5 md:pb-20 md:pt-10 lg:pb-20 lg:pt-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-36 end-[-8rem] h-[20rem] w-[20rem] rounded-full bg-primary/6 blur-[110px]" />
          <div className="absolute -bottom-32 start-[-6rem] h-[16rem] w-[16rem] rounded-full bg-accent/10 blur-[95px]" />
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 50% 38% at 50% 32%, hsl(var(--primary) / 0.03), transparent 74%)',
            }}
          />
        </div>
        <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center md:max-w-3xl">
          <p className="mb-3 text-sm tracking-wide text-muted-foreground">{t('landingHeroBadge')}</p>
          <h2 className="mb-4 text-2xl font-bold leading-[1.12] tracking-tight text-foreground sm:text-3xl md:mb-5 md:text-[2.25rem] lg:text-4xl">
            <span className="block">{t('landingHeroHeadlineBefore')}</span>
            <span className="block text-primary">{t('landingHeroHeadlineHighlight')}</span>
          </h2>
          <p className="mb-3 max-w-2xl text-base leading-7 text-muted-foreground sm:text-[1.0625rem] md:max-w-[42rem] md:text-lg md:leading-8">
            {t('landingHeroBody')}
          </p>
        </div>
      </section>

      <section className="space-y-6 sm:space-y-6 md:space-y-7">
        <div className="flex flex-col items-start gap-3 border-b border-border pb-4 sm:pb-4 md:flex-row md:items-end md:justify-between md:gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem] md:text-3xl">
              {t('landingEventsTitle')}
            </h2>
            <p className="max-w-[36rem] text-sm leading-6 text-muted-foreground md:text-[0.95rem]">
              {t('landingEventsSubtitle')}
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="min-h-10 px-4">
            <Link to="/events/propose">{t('landingEventsProposeCta')}</Link>
          </Button>
        </div>

        <div className="min-h-[18rem] md:min-h-[20rem]">
          {isEventsLoading ? (
            <RouteLoadingState />
          ) : eventsError ? (
            <RouteErrorState title={t('landingEventsErrorTitle')} body={eventsError} />
          ) : events.length === 0 ? (
            <RouteEmptyState title={t('landingEventsEmptyTitle')} body={t('landingEventsEmptyBody')} />
          ) : (
            <div className="grid items-stretch gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {events.map((event) => (
                <EventSummaryCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid items-start gap-4 sm:gap-5 md:grid-cols-[1.2fr_0.8fr]">
        <Card className={tokens.card.accent}>
          <CardHeader className="space-y-3">
            <p className={tokens.typography.eyebrow}>{t('landingEyebrow')}</p>
            <CardTitle className="text-2xl md:text-3xl leading-tight">
              {t('landingHeroTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm leading-7 text-foreground/85 md:text-base md:leading-relaxed">
            <p>{t('landingHeroBody')}</p>
          </CardContent>
        </Card>

        <div id="landing-how-it-works" className="scroll-mt-24 space-y-3">
          <Card className={tokens.card.surface}>
            <CardHeader>
              <CardTitle className="text-xl">{t('landingHowItWorksTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-foreground/80">
              <div className="space-y-1">
                <p className="font-medium text-foreground">{t('landingStep1Title')}</p>
                <p>{t('landingStep1Body')}</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">{t('landingStep2Title')}</p>
                <p>{t('landingStep2Body')}</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">{t('landingStep3Title')}</p>
                <p>{t('landingStep3Body')}</p>
              </div>
            </CardContent>
          </Card>
          <Button asChild variant="outline" className="min-h-10 px-4">
            <Link to="/questionnaire">{t('landingCtaProfile')}</Link>
          </Button>
        </div>
      </section>

      <SectionDivider />

      <section className="grid gap-4 sm:gap-5 md:grid-cols-3">
        <Card className={tokens.card.surface}>
          <CardHeader>
            <CardTitle className="text-lg">{t('landingCard1Title')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-muted-foreground md:leading-relaxed">
            {t('landingCard1Body')}
          </CardContent>
        </Card>

        <Card className={tokens.card.surface}>
          <CardHeader>
            <CardTitle className="text-lg">{t('landingCard2Title')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-muted-foreground md:leading-relaxed">
            {t('landingCard2Body')}
          </CardContent>
        </Card>

        <Card className={tokens.card.surface}>
          <CardHeader>
            <CardTitle className="text-lg">{t('landingCard3Title')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-muted-foreground md:leading-relaxed">
            {t('landingCard3Body')}
          </CardContent>
        </Card>
      </section>

      <footer className="pt-8 border-t border-border/60 text-center text-xs text-muted-foreground">
        <nav
          className="flex flex-wrap justify-center gap-x-4 gap-y-1"
          aria-label={supportEmail ? t('legalNavWithSupport') : t('legalNavOnly')}
        >
          <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">
            {t('termsOfUse')}
          </Link>
          <span aria-hidden>·</span>
          <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
            {t('privacyPolicy')}
          </Link>
          {supportEmail ? (
            <>
              <span aria-hidden>·</span>
              <a
                href={`mailto:${supportEmail}`}
                className="underline underline-offset-2 hover:text-foreground"
              >
                {t('contactUs')}
              </a>
            </>
          ) : null}
        </nav>
      </footer>
    </PageShell>
  );
}
