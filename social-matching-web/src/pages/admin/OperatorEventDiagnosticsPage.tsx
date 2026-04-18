import { Link, useParams } from 'react-router-dom';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { PageShell } from '@/components/shared/PageShell';
import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Button } from '@/components/ui/button';

export function OperatorEventDiagnosticsPage() {
  const { eventId } = useParams();

  return (
    <PageShell variant="minimal" title="Operator diagnostics" subtitle={`Event ${eventId ?? 'unknown'}`}>
      <PageActionBar>
        <Button asChild variant="outline" size="sm">
          <Link to={`/admin/events/${eventId ?? ''}`}>Back to event dashboard</Link>
        </Button>
      </PageActionBar>

      <SectionHeader
        title="Operator diagnostics"
        description="Reserved for a later implementation pass."
      />

      <PlaceholderPanel
        title="Operator diagnostics"
        contractState="stubbed"
        body="This route is reserved for internal logs, state checks, and operator-only diagnostics."
      />
    </PageShell>
  );
}
