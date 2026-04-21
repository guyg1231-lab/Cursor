import { Link, useParams } from 'react-router-dom';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { PageShell } from '@/components/shared/PageShell';
import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Button } from '@/components/ui/button';

export function HostEventCommunicationsPage() {
  const { eventId } = useParams();

  return (
    <PageShell title="תקשורת מארח/ת" subtitle={`אירוע ${eventId ?? 'unknown'}`}>
      <PageActionBar>
        <Button asChild variant="outline" size="sm">
          <Link to={`/host/events/${eventId ?? ''}`}>חזרה למרחב ניהול מארח/ת</Link>
        </Button>
      </PageActionBar>

      <SectionHeader
        title="תקשורת מארח/ת"
        description="שמורה להשלמת יישום עתידי."
      />

      <PlaceholderPanel
        title="תקשורת מארח/ת"
        contractState="stubbed"
        body="המסך הזה שומר מקום לעדכונים עתידיים מהמארח/ת בלי לרמוז שיש כרגע מערכת הודעות פעילה."
      />
    </PageShell>
  );
}
