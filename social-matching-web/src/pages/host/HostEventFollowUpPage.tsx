import { useParams } from 'react-router-dom';
import { PageShell } from '@/components/shared/PageShell';
import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';

export function HostEventFollowUpPage() {
  const { eventId } = useParams();

  return (
    <PageShell title="Host event follow-up" subtitle={`Event ${eventId ?? 'unknown'}`}>
      <PlaceholderPanel
        title="Host event follow-up"
        contractState="stubbed"
        body="This route is reserved for host-only post-event recap, attendance, and follow-up actions."
      />
    </PageShell>
  );
}
