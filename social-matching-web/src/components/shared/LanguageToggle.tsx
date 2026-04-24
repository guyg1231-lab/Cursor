import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
      aria-label={t('toggleLanguage')}
      className="gap-1.5 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] px-2.5 rounded-full"
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm tabular-nums">{language === 'he' ? 'EN' : 'עב'}</span>
    </Button>
  );
}
