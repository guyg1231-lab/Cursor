import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProfileBaseQuestionnaire } from '@/features/profile/ProfileBaseQuestionnaire';

export function QuestionnairePage() {
  const { t } = useLanguage();

  return (
    <PageShell title={t('questionnaireTitle')} subtitle={t('questionnaireSubtitle')}>
      <Card>
        <CardHeader>
          <CardTitle>{t('questionnaireTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileBaseQuestionnaire />
        </CardContent>
      </Card>
    </PageShell>
  );
}
