import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';

export function PrivacyPage() {
  return (
    <PageShell
      title="מדיניות פרטיות"
      subtitle="טיוטה — הטקסט הסופי יאושר על ידי המוצר והמשפטי."
    >
      <Card>
        <CardContent className="pt-6 text-sm text-foreground/85 leading-relaxed space-y-4">
          <p>כאן תופיע מדיניות הפרטיות המלאה, כולל אילו נתונים נאספים ולמה.</p>
          <p>בינתיים, אנו מטפלים בנתונים בהתאם לעדכונים שיפורסמו כאן.</p>
          <p>
            <Link to="/" className="text-primary underline underline-offset-2">
              חזרה לדף הבית
            </Link>
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
