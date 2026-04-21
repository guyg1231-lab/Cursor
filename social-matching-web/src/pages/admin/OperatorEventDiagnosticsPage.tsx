import { Link, useParams } from 'react-router-dom';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { PageShell } from '@/components/shared/PageShell';
import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Button } from '@/components/ui/button';

export function OperatorEventDiagnosticsPage() {
  const { eventId } = useParams();

  return (
    <PageShell variant="minimal" title="דיאגנוסטיקה תפעולית" subtitle={`אירוע ${eventId ?? 'unknown'}`}>
      <PageActionBar>
        <Button asChild variant="outline" size="sm">
          <Link to={`/admin/events/${eventId ?? ''}`}>חזרה לדשבורד האירוע</Link>
        </Button>
      </PageActionBar>

      <SectionHeader
        title="דיאגנוסטיקה תפעולית"
        description="שמורה להשלמת יישום עתידי."
      />

      <PlaceholderPanel
        title="דיאגנוסטיקה תפעולית"
        contractState="stubbed"
        body="המסלול הזה שמור ליומני מערכת פנימיים, בדיקות מצב, ודיאגנוסטיקה לצוות התפעול בלבד."
      />
    </PageShell>
  );
}
