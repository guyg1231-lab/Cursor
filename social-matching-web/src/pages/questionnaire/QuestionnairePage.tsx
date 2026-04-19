import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { RouteErrorState } from '@/components/shared/RouteState';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProfileBaseQuestionnaire } from '@/features/profile/ProfileBaseQuestionnaire';
import { tokens } from '@/lib/design-tokens';

export function QuestionnairePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [remoteLoadFailed, setRemoteLoadFailed] = useState(false);

  return (
    <PageShell title={t('questionnaireTitle')} subtitle={t('questionnaireSubtitle')}>
      <div className="space-y-6">
        {!user ? (
          <Card className={tokens.card.accent}>
            <CardHeader>
              <CardTitle>{t('questionnaireAnonymousBannerTitle')}</CardTitle>
              <CardDescription className="text-base text-foreground/90">
                {t('questionnaireAnonymousBannerBody')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="primary">
                <Link to="/auth">{t('questionnaireAnonymousBannerCta')}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>{t('questionnaireTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileBaseQuestionnaire
              onLoadError={(hasError) => {
                setRemoteLoadFailed(hasError);
              }}
            />
          </CardContent>
        </Card>

        {remoteLoadFailed ? (
          <RouteErrorState title={t('questionnaireLoadErrorTitle')} body={t('questionnaireLoadError')} />
        ) : null}
      </div>
    </PageShell>
  );
}
