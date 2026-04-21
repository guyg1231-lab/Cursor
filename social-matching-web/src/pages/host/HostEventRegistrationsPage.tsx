import { Link, useParams } from 'react-router-dom';
import { PageActionBar } from '@/components/shared/PageActionBar';
import { PageShell } from '@/components/shared/PageShell';
import { PlaceholderPanel } from '@/components/shared/PlaceholderPanel';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Button } from '@/components/ui/button';

export function HostEventRegistrationsPage() {
  const { eventId } = useParams();

  return (
    <PageShell title="Host event registrations" subtitle={`Event ${eventId ?? 'unknown'}`}>
      <PageActionBar>
        <Button asChild variant="outline" size="sm">
          <Link to={`/host/events/${eventId ?? ''}`}>Back to host event workspace</Link>
        </Button>
      </PageActionBar>

      <SectionHeader
        title="Host event registrations"
        description="Reserved for a later implementation pass."
      />

      <PlaceholderPanel
        title="Host registrations summary"
        contractState="stubbed"
        body="אין כאן שמות משתתפים או שליטה בבחירה. המסך הזה שמור לסיכום ספירות ומצב כללי בלבד."
      />
    </PageShell>
  );
}
