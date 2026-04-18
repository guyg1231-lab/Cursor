import { useParams } from 'react-router-dom';
import { PageShell } from '@/components/shared/PageShell';
import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';

export function OperatorEventDiagnosticsPage() {
  const { eventId } = useParams();

  return (
    <PageShell variant="minimal" title="Operator diagnostics" subtitle={`Event ${eventId ?? 'unknown'}`}>
      <PlaceholderPanel
        title="Operator diagnostics"
        contractState="stubbed"
        body="This route is reserved for internal logs, state checks, and operator-only diagnostics."
      />
    </PageShell>
  );
}
