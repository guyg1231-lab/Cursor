import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { useLanguage } from '@/contexts/LanguageContext';

const copy = {
  he: {
    title: 'תנאי שימוש',
    subtitle: 'גרסת MVP — מנוסחת בשפה פשוטה וברורה.',
    sections: [
      {
        title: '1. מה השירות עושה',
        body:
          'Circles עוזרת לאנשים להצטרף למפגשים חברתיים קטנים. אישור למפגש נעשה אחרי בדיקה אנושית של התאמה לקבוצה.',
      },
      {
        title: '2. מי יכול להשתמש',
        body:
          'השירות מיועד לבגירים. בשימוש בשירות אתם מצהירים שהמידע שמסרתם נכון ושאתם פועלים לפי כללי הקהילה.',
      },
      {
        title: '3. הרשמה ואישור למפגש',
        body:
          'שליחת מועמדות לא מבטיחה מקום. אנחנו עשויים לאשר, לדחות או להעביר לרשימת המתנה בהתאם לשיקולי התאמה ותפעול.',
      },
      {
        title: '4. ביטול, השעיה וסיום שימוש',
        body:
          'במקרים של הפרת כללים, התנהגות פוגענית או סיכון משתתפים, נוכל להגביל או לחסום גישה לפלטפורמה ולמפגשים.',
      },
      {
        title: '5. יצירת קשר',
        body: 'לשאלות נוספות אפשר לפנות דרך פרטי הקשר באתר.',
      },
    ],
    back: 'חזרה לדף הבית',
  },
  en: {
    title: 'Terms of Use',
    subtitle: 'MVP version — clear and practical summary.',
    sections: [
      {
        title: '1. What the service does',
        body:
          'Circles helps people join small social gatherings. Final participation is subject to human review and group-fit curation.',
      },
      {
        title: '2. Eligibility',
        body:
          'The service is intended for adults. By using it, you confirm the information you provide is accurate and that you follow community guidelines.',
      },
      {
        title: '3. Registration and approval',
        body:
          'Submitting an application does not guarantee a seat. Applications may be approved, waitlisted, or declined based on fit and operational constraints.',
      },
      {
        title: '4. Suspension and removal',
        body:
          'If users violate rules, create safety risk, or harm others, we may restrict access to the platform and events.',
      },
      {
        title: '5. Contact',
        body: 'For questions, contact us through the support details shown on the site.',
      },
    ],
    back: 'Back to home',
  },
} as const;

export function TermsPage() {
  const { language } = useLanguage();
  const text = copy[language];

  return (
    <PageShell title={text.title} subtitle={text.subtitle}>
      <Card>
        <CardContent className="pt-6 text-sm text-foreground/85 leading-relaxed space-y-5">
          {text.sections.map((section) => (
            <section key={section.title} className="space-y-1.5">
              <h2 className="font-semibold text-foreground">{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
          <p>
            <Link to="/" className="text-primary underline underline-offset-2">
              {text.back}
            </Link>
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
