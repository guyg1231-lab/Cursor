import { Link, useParams } from 'react-router-dom';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { PageShell } from '@/components/shared/PageShell';
import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Button } from '@/components/ui/button';

export function HostEventRegistrationsPage() {
  const { eventId } = useParams();

  return (
    <PageShell title="תמונת הרשמות למארח/ת" subtitle={`אירוע ${eventId ?? 'לא זמין'}`}>
      <PageActionBar>
        <Button asChild variant="outline" size="sm">
          <Link to={`/host/events/${eventId ?? ''}`}>חזרה למרחב ניהול מארח/ת</Link>
        </Button>
      </PageActionBar>

      <SectionHeader
        title="תמונת הרשמות למארח/ת"
        description="יושלם בהמשך."
      />

      <PlaceholderPanel
        title="סיכום הרשמות למארח/ת"
        contractState="stubbed"
        body="אין כאן שמות משתתפים או שליטה בבחירה. המסך הזה שמור לסיכום ספירות ומצב כללי בלבד."
      />
    </PageShell>
  );
}
