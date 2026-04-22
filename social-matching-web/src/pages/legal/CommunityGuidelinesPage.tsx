import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { useLanguage } from '@/contexts/LanguageContext';

const copy = {
  he: {
    title: 'כללי קהילה',
    subtitle: 'איך שומרים על חוויה אנושית, בטוחה ונעימה לכולם.',
    intro:
      'Circles נבנתה לחיבורים קבוצתיים קטנים ולאינטראקציה מכבדת. השימוש בפלטפורמה ובהשתתפות במפגשים כפוף לכללים הבאים.',
    sections: [
      {
        title: '1. כבוד הדדי',
        points: [
          'מדברים בכבוד. אין שפה פוגענית, גזענית, מינית או מאיימת.',
          'מכבדים גבולות אישיים, קצב אישי והחלטות של משתתפים אחרים.',
          'לא מפרסמים פרטים אישיים של אחרים ללא אישור מפורש.',
        ],
      },
      {
        title: '2. התנהלות במפגש',
        points: [
          'מגיעים בזמן או מעדכנים מראש במקרה עיכוב.',
          'נמנעים מהצעות מסחריות, גיוס אגרסיבי או קידום עצמי לא רלוונטי.',
          'מטרת המפגשים היא חיבור קהילתי, לא מסגרת דייטינג או מכירה.',
        ],
      },
      {
        title: '3. בטיחות',
        points: [
          'אם משהו מרגיש לא בטוח, אפשר לצאת מהמפגש בכל רגע.',
          'אפשר לפנות לצוות התמיכה דרך פרטי הקשר שמופיעים באתר.',
          'דיווחים על הטרדה/פגיעה נבדקים בעדיפות גבוהה ועלולים להוביל לחסימה מיידית.',
        ],
      },
      {
        title: '4. אכיפה',
        points: [
          'הפרת כללים עשויה להוביל לאזהרה, השעיה זמנית או חסימה קבועה.',
          'במקרים חמורים נשמור לעצמנו זכות לבטל הרשמה או השתתפות גם אחרי אישור.',
        ],
      },
    ],
    back: 'חזרה לדף הבית',
  },
  en: {
    title: 'Community Guidelines',
    subtitle: 'How we keep the experience human, safe, and respectful.',
    intro:
      'Circles is designed for small-group social connection. Use of the platform and participation in events is subject to the following guidelines.',
    sections: [
      {
        title: '1. Mutual respect',
        points: [
          'Use respectful language. No harassment, hate speech, threats, or sexual misconduct.',
          'Respect personal boundaries and consent at all times.',
          'Do not share personal information of others without explicit consent.',
        ],
      },
      {
        title: '2. Event conduct',
        points: [
          'Arrive on time, or notify in advance if delayed.',
          'No aggressive promotion, spam, or irrelevant commercial activity.',
          'Events are designed for community connection, not dating or sales funnels.',
        ],
      },
      {
        title: '3. Safety',
        points: [
          'If something feels unsafe, leave immediately and contact support.',
          'Reports of harassment or abuse are reviewed with high priority.',
          'Serious violations may result in immediate account suspension.',
        ],
      },
      {
        title: '4. Enforcement',
        points: [
          'Violations may lead to warning, temporary suspension, or permanent removal.',
          'In severe cases, we may cancel a registration or participation even after approval.',
        ],
      },
    ],
    back: 'Back to home',
  },
} as const;

export function CommunityGuidelinesPage() {
  const { language } = useLanguage();
  const text = copy[language];

  return (
    <PageShell title={text.title} subtitle={text.subtitle}>
      <Card>
        <CardContent className="pt-6 text-sm text-foreground/85 leading-relaxed space-y-5">
          <p>{text.intro}</p>
          {text.sections.map((section) => (
            <section key={section.title} className="space-y-2">
              <h2 className="font-semibold text-foreground">{section.title}</h2>
              <ul className="list-disc ps-5 space-y-1">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
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
