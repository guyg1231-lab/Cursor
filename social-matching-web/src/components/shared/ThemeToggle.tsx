import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export function ThemeToggle({ theme, toggleTheme }: ThemeToggleProps) {
  const { t } = useLanguage();
  const Icon = theme === 'dark' ? Moon : Sun;
  const label = theme === 'dark' ? t('themeDark') : t('themeLight');

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-label={t('toggleTheme')}
      className="gap-1.5 text-muted-foreground hover:text-foreground min-h-[44px] px-2.5 rounded-full"
    >
      <Icon className="h-4 w-4" />
      <span className="text-sm">{label}</span>
    </Button>
  );
}
