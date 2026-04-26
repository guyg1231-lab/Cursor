import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { useLanguage } from '@/contexts/LanguageContext';

const copy = {
  he: {
    title: 'מדיניות פרטיות',
    subtitle: 'גרסת MVP — מה אנחנו אוספים ולמה, בשפה פשוטה.',
    sections: [
      {
        title: '1. איזה מידע נאסף',
        body:
          'אנחנו שומרים פרטי פרופיל שמסרתם (כמו שם, אימייל, טלפון ותשובות לשאלון) ומידע תפעולי על הרשמות למפגשים.',
      },
      {
        title: '2. למה אנחנו משתמשים במידע',
        body:
          'המטרה היא בניית קבוצות מתאימות, תפעול תהליך ההרשמה, שליחת עדכונים על סטטוס ההרשמה ושיפור חוויית המפגש.',
      },
      {
        title: '3. עם מי המידע משותף',
        body:
          'המידע נגיש לצוות התפעול לפי צורך תפעולי. אנחנו לא מוכרים מידע אישי לצדדים שלישיים לצרכי פרסום.',
      },
      {
        title: '4. שמירה ואבטחה',
        body:
          'אנחנו מפעילים שכבות הגנה סבירות לשמירת המידע. למרות זאת, אין מערכת שמספקת אבטחה מוחלטת ב-100%.',
      },
      {
        title: '5. זכויות משתמש',
        body:
          'אפשר לפנות אלינו לעדכון/תיקון מידע אישי או לבקשות הקשורות לחשבון, בהתאם ליכולות ה-MVP והחוק החל.',
      },
    ],
    back: 'חזרה לדף הבית',
  },
  en: {
    title: 'Privacy Policy',
    subtitle: 'MVP version — what we collect and why.',
    sections: [
      {
        title: '1. Data we collect',
        body:
          'We store profile details you provide (such as name, email, phone, and questionnaire responses) and operational registration data.',
      },
      {
        title: '2. Why we use data',
        body:
          'Data is used to curate suitable groups, operate registration flows, send status updates, and improve event experience.',
      },
      {
        title: '3. Data sharing',
        body:
          'Data is accessible to authorized operations staff on a need-to-know basis. We do not sell personal data for advertising.',
      },
      {
        title: '4. Security',
        body:
          'We apply reasonable security controls to protect data. No system can guarantee absolute security in all scenarios.',
      },
      {
        title: '5. User rights',
        body:
          'You may contact us to request profile updates or account-related actions, subject to MVP capabilities and applicable law.',
      },
    ],
    back: 'Back to home',
  },
} as const;

export function PrivacyPage() {
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
