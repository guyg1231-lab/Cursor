import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { SectionDivider } from '@/components/shared/SectionDivider';
import { useLanguage } from '@/contexts/LanguageContext';
import { tokens } from '@/lib/design-tokens';

const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL?.trim();

export function LandingPage() {
  const { t } = useLanguage();

  return (
    <PageShell headerTransparent>
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-b from-background via-primary/5 to-background px-6 py-10 md:px-10 md:py-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 end-0 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-16 -start-6 h-44 w-44 rounded-full bg-accent/35 blur-3xl" />
        </div>
        <div className="relative mx-auto flex max-w-3xl flex-col items-start gap-5">
          <p className={tokens.typography.eyebrow}>{t('landingHeroBadge')}</p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
            <span className="block">{t('landingHeroHeadlineBefore')}</span>
            <span className="block text-primary">{t('landingHeroHeadlineHighlight')}</span>
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-foreground/85 md:text-base">
            {t('landingHeroBody')}
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild variant="primary">
              <Link to="/events">{t('landingHeroCtaPrimary')}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="#landing-how-it-works">{t('landingHeroCtaSecondary')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr] items-start">
        <Card className={tokens.card.accent}>
          <CardHeader className="space-y-3">
            <p className={tokens.typography.eyebrow}>{t('landingEyebrow')}</p>
            <CardTitle className="text-2xl md:text-3xl leading-tight">
              {t('landingHeroTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm md:text-base text-foreground/85 leading-relaxed">
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
          <Button asChild variant="outline">
            <Link to="/questionnaire">{t('landingCtaProfile')}</Link>
          </Button>
        </div>
      </section>

      <SectionDivider />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className={tokens.card.surface}>
          <CardHeader>
            <CardTitle className="text-lg">{t('landingCard1Title')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            {t('landingCard1Body')}
          </CardContent>
        </Card>

        <Card className={tokens.card.surface}>
          <CardHeader>
            <CardTitle className="text-lg">{t('landingCard2Title')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            {t('landingCard2Body')}
          </CardContent>
        </Card>

        <Card className={tokens.card.surface}>
          <CardHeader>
            <CardTitle className="text-lg">{t('landingCard3Title')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
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
