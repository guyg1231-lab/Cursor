import { Link, useParams } from 'react-router-dom';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { PageShell } from '@/components/shared/PageShell';
import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Button } from '@/components/ui/button';

export function OperatorEventAuditPage() {
  const { eventId } = useParams();

  return (
    <PageShell variant="minimal" title="Operator audit" subtitle={`Event ${eventId ?? 'unknown'}`}>
      <PageActionBar>
        <Button asChild variant="outline" size="sm">
          <Link to={`/admin/events/${eventId ?? ''}`}>Back to event dashboard</Link>
        </Button>
      </PageActionBar>

      <SectionHeader
        title="Operator audit"
        description="Reserved for a later implementation pass."
      />

      <PlaceholderPanel
        title="Operator audit"
        contractState="stubbed"
        body="המסלול הזה שמור לעקבות ביקורת תפעוליות, היסטוריית שינויים, ובדיקות תאימות."
      />
    </PageShell>
  );
}
