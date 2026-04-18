import { useParams } from 'react-router-dom';
import { PageShell } from '@/components/shared/PageShell';
import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';

export function OperatorEventAuditPage() {
  const { eventId } = useParams();

  return (
    <PageShell variant="minimal" title="Operator audit" subtitle={`Event ${eventId ?? 'unknown'}`}>
      <PlaceholderPanel
        title="Operator audit"
        contractState="stubbed"
        body="This route is reserved for operator audit trails, change history, and compliance review."
      />
    </PageShell>
  );
}
