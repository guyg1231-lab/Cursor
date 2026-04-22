#!/usr/bin/env node
/**
 * Generate a production-ready Tel Aviv content bundle with rolling future dates.
 *
 * Usage:
 *   node scripts/ops/generate-tel-aviv-content-bundle.mjs
 *   node scripts/ops/generate-tel-aviv-content-bundle.mjs --output scripts/ops/content/tel-aviv-production-bundle.generated.json
 */
import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function getArg(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx === process.argv.length - 1) return fallback;
  return process.argv[idx + 1];
}

const outputPath = resolve(root, getArg('--output', 'scripts/ops/content/tel-aviv-production-bundle.generated.json'));
const weeksAhead = Number(getArg('--weeks-ahead', '2'));

function utcAt(base, dayOffset, hour, minute) {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

function makeEvent(id, title, description, category, tags, venueHint, start, deadline, maxCapacity, hostEmail) {
  return {
    id,
    created_by_email: 'circlesplatform@gmail.com',
    host_email: hostEmail,
    title,
    description,
    category,
    tags,
    city: 'Tel Aviv',
    venue_hint: venueHint,
    starts_at: start,
    registration_deadline: deadline,
    max_capacity: maxCapacity,
    status: 'active',
    is_published: true,
  };
}

const now = new Date();
const anchor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
anchor.setUTCDate(anchor.getUTCDate() + Math.max(1, weeksAhead * 7));

const events = [
  makeEvent(
    '97f4b30e-8ebf-4421-aae8-16a8a0d90001',
    'קפה שכונתי והיכרות — פלורנטין',
    'מפגש בוקר קליל עם שיחה פתוחה בין אנשים חדשים בעיר. מתאים למי שמחפש התחלה נעימה בלי עומס.',
    'Coffee Meetup',
    ['coffee', 'weekday-morning', 'new-in-city'],
    'פלורנטין (מיקום מדויק לאחר אישור)',
    utcAt(anchor, 1, 7, 30),
    utcAt(anchor, -1, 20, 0),
    10,
    'ops-tlv@circles.local',
  ),
  makeEvent(
    '97f4b30e-8ebf-4421-aae8-16a8a0d90002',
    'הליכת שקיעה בטיילת',
    'הליכה עירונית רגועה לאורך הים עם עצירה קצרה לשיחה והיכרות. קצב בינוני, אווירה פתוחה.',
    'Urban Walk',
    ['walk', 'sunset', 'seafront'],
    'טיילת תל אביב (נקודת מפגש תישלח לנרשמים)',
    utcAt(anchor, 3, 16, 30),
    utcAt(anchor, 2, 20, 0),
    14,
    'ops-tlv@circles.local',
  ),
  makeEvent(
    '97f4b30e-8ebf-4421-aae8-16a8a0d90003',
    'פתיחת קבוצת כדורעף בפארק',
    'סשן פתיחה לקבוצה עירונית חדשה של כדורעף. מתאים גם למתחילים עם רקע בסיסי בספורט קבוצתי.',
    'Community Sport',
    ['volleyball', 'community', 'park'],
    'פארק הירקון',
    utcAt(anchor, 6, 14, 30),
    utcAt(anchor, 4, 18, 0),
    16,
    'ops-tlv@circles.local',
  ),
  makeEvent(
    '97f4b30e-8ebf-4421-aae8-16a8a0d90004',
    'קפה + הליכה קצרה בדיזנגוף',
    'שילוב של ישיבה קצרה בבית קפה ולאחריה הליכה שכונתית. פורמט קליל למי שרוצה שיחה טבעית.',
    'Coffee Meetup',
    ['coffee', 'walk', 'evening'],
    'אזור דיזנגוף',
    utcAt(anchor, 8, 16, 0),
    utcAt(anchor, 6, 20, 0),
    12,
    'ops-tlv@circles.local',
  ),
  makeEvent(
    '97f4b30e-8ebf-4421-aae8-16a8a0d90005',
    'סיבוב גלריות עירוני + עצירת קפה',
    'מסלול קצר בין חללי תרבות מקומיים עם עצירה לקפה ושיח פתוח. מתאים לחיבורים סביב סקרנות ויצירה.',
    'Urban Culture',
    ['culture', 'gallery', 'small-group'],
    'לב העיר תל אביב',
    utcAt(anchor, 10, 15, 0),
    utcAt(anchor, 8, 20, 0),
    10,
    'circlesplatform@gmail.com',
  ),
];

const bundle = {
  operators: [
    { email: 'circlesplatform@gmail.com', full_name: 'Circles Platform', role: 'admin' },
    { email: 'ops-tlv@circles.local', full_name: 'Tel Aviv Ops', role: 'admin' },
  ],
  events,
  email_templates: [
    {
      key: 'registration_received',
      updated_by_email: 'circlesplatform@gmail.com',
      subject: 'ההרשמה התקבלה — ממשיכים לשלב ההתאמה',
      html_body: '<h2>קיבלנו את ההרשמה שלך</h2><p>הצעד הבא: בדיקת התאמה קצרה לקבוצה. נעדכן אותך בהקדם.</p>',
    },
    {
      key: 'approved',
      updated_by_email: 'circlesplatform@gmail.com',
      subject: 'איזה כיף — אושרת למפגש בתל אביב',
      html_body: '<h2>אושרת למפגש</h2><p>המקום שלך נשמר. בקרוב נשלח פרטים סופיים לגבי זמן ומיקום.</p>',
    },
    {
      key: 'rejected',
      updated_by_email: 'circlesplatform@gmail.com',
      subject: 'עדכון לגבי הבקשה שלך',
      html_body: '<h2>תודה שנרשמת</h2><p>בשלב הזה לא נוכל לשבץ אותך למפגש הנוכחי. נציע לך מפגשים נוספים בקרוב.</p>',
    },
    {
      key: 'temporary_offer',
      updated_by_email: 'circlesplatform@gmail.com',
      subject: 'התפנה מקום עבורך — לזמן מוגבל',
      html_body: '<h2>מקום התפנה עבורך</h2><p>אם זה רלוונטי לך, אשר/י בזמן כדי שנוכל לשמור עבורך את המקום.</p>',
    },
  ],
};

writeFileSync(outputPath, `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');
console.log(`Generated bundle: ${outputPath}`);
