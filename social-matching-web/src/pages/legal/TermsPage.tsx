import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';

export function TermsPage() {
  return (
    <PageShell
      title="תנאי שימוש"
      subtitle="טיוטה — הטקסט הסופי יאושר על ידי המוצר והמשפטי."
    >
      <Card>
        <CardContent className="pt-6 text-sm text-foreground/85 leading-relaxed space-y-4">
          <p>כאן יופיעו תנאי השימוש המלאים לשירות.</p>
          <p>בינתיים, השימוש באתר כפוף לכללים שיעודכנו כאן.</p>
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
