import { Link, useParams } from 'react-router-dom';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { PageShell } from '@/components/shared/PageShell';
import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Button } from '@/components/ui/button';

export function HostEventWorkspacePage() {
  const { eventId } = useParams();

  return (
    <PageShell title="מרחב ניהול מארח/ת" subtitle={`אירוע ${eventId ?? 'unknown'}`}>
      <PageActionBar>
        <Button asChild variant="outline" size="sm">
          <Link to="/host/events">חזרה לאירועי מארחים</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to={`/host/events/${eventId ?? ''}/registrations`}>לתמונת ההרשמות</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to={`/host/events/${eventId ?? ''}/communications`}>לתקשורת</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to={`/host/events/${eventId ?? ''}/follow-up`}>למעקב אחרי האירוע</Link>
        </Button>
      </PageActionBar>

      <SectionHeader
        title="מרחב ניהול מארח/ת"
        description="שמורה להשלמת יישום עתידי."
      />

      <PlaceholderPanel
        title="מרחב ניהול מארח/ת"
        contractState="stubbed"
        body="המסך שמור להצגת תמונת מצב למארח/ת, אבני דרך, וניווט לפעולות הבאות."
      />
    </PageShell>
  );
}
