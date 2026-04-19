import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { SectionDivider } from '@/components/shared/SectionDivider';
import { tokens } from '@/lib/design-tokens';

export function LandingPage() {
  return (
    <PageShell
      title="מפגשים קטנים. אנשים חדשים. חוויה שמרגישה נכונה."
      subtitle="Circles עוזרת לך להצטרף למפגשים חברתיים קטנים, נעימים ומאוצרים — עם תהליך שמרגיש בטוח יותר מרנדומליות."
      headerTransparent
    >
      <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr] items-start">
        <Card className={tokens.card.accent}>
          <CardHeader className="space-y-3">
            <p className={tokens.typography.eyebrow}>מפגשים מאוצרים</p>
            <CardTitle className="text-2xl md:text-3xl leading-tight">
              לא מגיעים לבד לרנדום — מצטרפים לקבוצה קטנה שמרגישה יותר נכונה.
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm md:text-base text-foreground/85 leading-relaxed">
            <p>
              אנחנו שומרים על קבוצות קטנות, עוברים על ההגשות, ומבקשים תשלום רק אחרי אישור — כדי שהדרך
              למפגש תרגיש ברורה, נעימה ומכבדת.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild variant="primary">
                <Link to="/events">לצפייה במפגשים</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/questionnaire">להתחיל פרופיל</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className={tokens.card.surface}>
          <CardHeader>
            <CardTitle className="text-xl">איך זה עובד</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-foreground/80">
            <div className="space-y-1">
              <p className="font-medium text-foreground">1. בוחרים מפגש שנראה נכון</p>
              <p>מעיינים באופי, בשפה, באזור ובמחיר לפני שמגישים מועמדות.</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">2. עונים על כמה שאלות קצרות</p>
              <p>כדי שנוכל להבין אותך טוב יותר ולבנות קבוצה עם חיבור וגם תחושת נינוחות.</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">3. תשלום רק אחרי אישור</p>
              <p>אם התקבלת, נשלח לך את פרטי התשלום ונאשר את המקום שלך בקבוצה.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <SectionDivider />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className={tokens.card.surface}>
          <CardHeader>
            <CardTitle className="text-lg">לא דייטינג</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            זה לא מרגיש כמו סווייפים, ולא כמו התאמה אחד-על-אחד. זו חוויה קבוצתית, אנושית ורגועה יותר.
          </CardContent>
        </Card>

        <Card className={tokens.card.surface}>
          <CardHeader>
            <CardTitle className="text-lg">לא לוח אירועים גנרי</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            אנחנו לא מציגים המון רעש. המטרה היא קבוצה קטנה, עם כוונה, ולא שוק פתוח של אינסוף אפשרויות.
          </CardContent>
        </Card>

        <Card className={tokens.card.surface}>
          <CardHeader>
            <CardTitle className="text-lg">כן יותר בהיר, בטוח ומדויק</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            מי שרוצה להצטרף יודע מה קורה, מה השלב הבא, ולמה התהליך בנוי כך — לפני שמגיעים למפגש עצמו.
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
