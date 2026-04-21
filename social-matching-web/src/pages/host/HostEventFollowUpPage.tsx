import { Link, useParams } from 'react-router-dom';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { PageShell } from '@/components/shared/PageShell';
import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Button } from '@/components/ui/button';

export function HostEventFollowUpPage() {
  const { eventId } = useParams();

  return (
    <PageShell title="מעקב אחרי אירוע" subtitle={`אירוע ${eventId ?? 'unknown'}`}>
      <PageActionBar>
        <Button asChild variant="outline" size="sm">
          <Link to={`/host/events/${eventId ?? ''}`}>חזרה למרחב ניהול מארח/ת</Link>
        </Button>
      </PageActionBar>

      <SectionHeader
        title="מעקב אחרי אירוע"
        description="שמורה להשלמת יישום עתידי."
      />

      <PlaceholderPanel
        title="מעקב אחרי אירוע"
        contractState="stubbed"
        body="המסך הזה שומר מקום לסיכום ופולואפ אחרי האירוע, אבל עדיין לא מבצע פעולות כתיבה."
      />
    </PageShell>
  );
}
