import { Link, useParams } from 'react-router-dom';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { PageShell } from '@/components/shared/PageShell';
import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Button } from '@/components/ui/button';

export function HostEventFollowUpPage() {
  const { eventId } = useParams();

  return (
    <PageShell title="Host event follow-up" subtitle={`Event ${eventId ?? 'unknown'}`}>
      <PageActionBar>
        <Button asChild variant="outline" size="sm">
          <Link to={`/host/events/${eventId ?? ''}`}>Back to host event workspace</Link>
        </Button>
      </PageActionBar>

      <SectionHeader
        title="Host event follow-up"
        description="Reserved for a later implementation pass."
      />

      <PlaceholderPanel
        title="Host follow-up"
        contractState="stubbed"
        body="המסך הזה שומר מקום לסיכום ופולואפ אחרי האירוע, אבל עדיין לא מבצע פעולות כתיבה."
      />
    </PageShell>
  );
}
