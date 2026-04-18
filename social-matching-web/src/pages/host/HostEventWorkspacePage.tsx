import { useParams } from 'react-router-dom';
import { PageShell } from '@/components/shared/PageShell';
import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';

export function HostEventWorkspacePage() {
  const { eventId } = useParams();

  return (
    <PageShell title="Host event workspace" subtitle={`Event ${eventId ?? 'unknown'}`}>
      <PlaceholderPanel
        title="Host event workspace"
        contractState="stubbed"
        body="This route is reserved for host-only event overview, milestones, and next-step navigation."
      />
    </PageShell>
  );
}
