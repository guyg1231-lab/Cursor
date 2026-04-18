import { useParams } from 'react-router-dom';
import { PageShell } from '@/components/shared/PageShell';
import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';

export function HostEventCommunicationsPage() {
  const { eventId } = useParams();

  return (
    <PageShell title="Host event communications" subtitle={`Event ${eventId ?? 'unknown'}`}>
      <PlaceholderPanel
        title="Host event communications"
        contractState="stubbed"
        body="This route is reserved for host-only participant messaging and outbound comms history."
      />
    </PageShell>
  );
}
