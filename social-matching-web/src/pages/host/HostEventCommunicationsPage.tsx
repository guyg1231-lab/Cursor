import { Link, useParams } from 'react-router-dom';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { PageShell } from '@/components/shared/PageShell';
import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Button } from '@/components/ui/button';

export function HostEventCommunicationsPage() {
  const { eventId } = useParams();

  return (
    <PageShell title="Host event communications" subtitle={`Event ${eventId ?? 'unknown'}`}>
      <PageActionBar>
        <Button asChild variant="outline" size="sm">
          <Link to={`/host/events/${eventId ?? ''}`}>Back to host event workspace</Link>
        </Button>
      </PageActionBar>

      <SectionHeader
        title="Host event communications"
        description="Reserved for a later implementation pass."
      />

      <PlaceholderPanel
        title="Host communications"
        contractState="stubbed"
        body="המסך הזה שומר מקום לעדכונים עתידיים מהמארח/ת בלי לרמוז שיש כרגע מערכת הודעות פעילה."
      />
    </PageShell>
  );
}
