import { Link, useParams } from 'react-router-dom';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { PageShell } from '@/components/shared/PageShell';
import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Button } from '@/components/ui/button';

export function HostEventWorkspacePage() {
  const { eventId } = useParams();

  return (
    <PageShell title="Host event workspace" subtitle={`Event ${eventId ?? 'unknown'}`}>
      <PageActionBar>
        <Button asChild variant="outline" size="sm">
          <Link to="/host/events">Back to host events</Link>
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
        title="Host event workspace"
        description="Reserved for a later implementation pass."
      />

      <PlaceholderPanel
        title="Host event workspace"
        contractState="stubbed"
        body="This route is reserved for host-only event overview, milestones, and next-step navigation."
      />
    </PageShell>
  );
}
