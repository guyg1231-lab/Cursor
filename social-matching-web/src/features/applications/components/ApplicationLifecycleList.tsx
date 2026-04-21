import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  resolveApplicationBadgeTone,
  resolveApplicationLifecycleRowContent,
} from '@/features/applications/presentation';
import { listDashboardApplications } from '@/features/events/query';
import {
  canReapplyToEvent,
  formatApplicationStatusShort,
  isAwaitingParticipantResponse,
  isOfferExpired,
} from '@/features/applications/status';

type ApplicationRow = Awaited<ReturnType<typeof listDashboardApplications>>[number];

export function ApplicationLifecycleList({ applications }: { applications: ApplicationRow[] }) {
  return (
    <div className="space-y-3">
      {applications.map((application) => {
        const rowContent = resolveApplicationLifecycleRowContent(application);

        return (
          <div key={application.id} className="rounded-3xl border border-border bg-background/30 p-4">
            <p className="font-medium text-foreground">{application.event?.title ?? 'מפגש'}</p>
            <p className="mt-1 text-muted-foreground">
              סטטוס:{' '}
              <StatusBadge
                label={formatApplicationStatusShort(application.status)}
                tone={resolveApplicationBadgeTone(application.status)}
              />
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{rowContent.summary}</p>
            {rowContent.deadlineLine ? (
              <p className="mt-1 text-xs text-muted-foreground">{rowContent.deadlineLine}</p>
            ) : null}
            {application.event ? (
              <div className="mt-3 flex flex-wrap gap-3">
                {isAwaitingParticipantResponse(application.status) ? (
                  <Button asChild size="sm" variant={isOfferExpired(application) ? 'outline' : 'primary'}>
                    <Link to={`/events/${application.event.id}/apply`}>
                      {isOfferExpired(application) ? 'לצפייה בסטטוס' : 'לתגובה על המקום הזמני'}
                    </Link>
                  </Button>
                ) : (
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/events/${application.event.id}/apply`}>
                      {canReapplyToEvent(application.status) ? 'להגיש שוב' : 'להגשה ולסטטוס'}
                    </Link>
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
