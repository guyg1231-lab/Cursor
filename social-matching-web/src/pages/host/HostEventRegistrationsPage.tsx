import { useParams } from 'react-router-dom';
import { PageShell } from '@/components/shared/PageShell';
import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';

export function HostEventRegistrationsPage() {
  const { eventId } = useParams();

  return (
    <PageShell title="Host event registrations" subtitle={`Event ${eventId ?? 'unknown'}`}>
      <PlaceholderPanel
        title="Host event registrations"
        contractState="stubbed"
        body="This route is reserved for host-only registration summaries and response status breakdowns."
      />
    </PageShell>
  );
}
