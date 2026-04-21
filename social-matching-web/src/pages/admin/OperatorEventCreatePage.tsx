import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { RouteErrorState } from '@/components/shared/RouteState';
import { tokens } from '@/lib/design-tokens';
import { useAuth } from '@/contexts/AuthContext';
import { AdminEventRequestActionError, insertOperatorEventDraftAndPublish } from '@/features/admin/api';
import { fromDateTimeLocalValue } from '@/features/events/formatters';

const fieldClass =
  'w-full rounded-2xl border border-border bg-background/50 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40';

export function OperatorEventCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('תל אביב');
  const [venueHint, setVenueHint] = useState('');
  const [startsAtLocal, setStartsAtLocal] = useState('');
  const [deadlineLocal, setDeadlineLocal] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) {
      setError('You must be signed in.');
      return;
    }
    const t = title.trim();
    if (!t) {
      setError('Title is required.');
      return;
    }
    const startsIso = fromDateTimeLocalValue(startsAtLocal);
    if (!startsIso) {
      setError('Start date/time is required.');
      return;
    }
    let cap: number | null = null;
    if (maxCapacity.trim()) {
      const n = Number(maxCapacity);
      if (!Number.isInteger(n) || n < 1) {
        setError('Capacity must be a positive integer or empty.');
        return;
      }
      cap = n;
    }
    const deadlineIso = deadlineLocal ? fromDateTimeLocalValue(deadlineLocal) : '';
    if (deadlineLocal && !deadlineIso) {
      setError('Invalid registration deadline.');
      return;
    }
    if (deadlineIso) {
      const s = new Date(startsIso).getTime();
      const d = new Date(deadlineIso).getTime();
      if (!Number.isNaN(s) && !Number.isNaN(d) && d >= s) {
        setError('Registration deadline must be before event start.');
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      const { id } = await insertOperatorEventDraftAndPublish(user.id, {
        title: t,
        starts_at: startsIso,
        city: city.trim() || 'תל אביב',
        venue_hint: venueHint.trim() || null,
        registration_deadline: deadlineIso || null,
        max_capacity: cap,
      });
      navigate(`/admin/events/${id}`, { replace: true });
    } catch (err) {
      setError(err instanceof AdminEventRequestActionError ? err.message : 'Create failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell variant="minimal" title="Create event" subtitle="Draft insert → admin publish (active + published).">
      <Button asChild variant="outline" size="sm" className="mb-4">
          <Link to="/admin/events">← חזרה לרשימת אירועים</Link>
      </Button>

      <Card className={tokens.card.surface}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-[-0.015em]">אירוע חדש</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="max-w-lg space-y-4">
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">כותרת</span>
              <input className={fieldClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">מועד התחלה</span>
              <input
                className={fieldClass}
                type="datetime-local"
                value={startsAtLocal}
                onChange={(e) => setStartsAtLocal(e.target.value)}
                required
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">דדליין להרשמה (אופציונלי)</span>
              <input
                className={fieldClass}
                type="datetime-local"
                value={deadlineLocal}
                onChange={(e) => setDeadlineLocal(e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">עיר</span>
              <input className={fieldClass} value={city} onChange={(e) => setCity(e.target.value)} />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">רמז למיקום (אופציונלי)</span>
              <input className={fieldClass} value={venueHint} onChange={(e) => setVenueHint(e.target.value)} />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">קיבולת מקסימלית (אופציונלי)</span>
              <input
                className={fieldClass}
                inputMode="numeric"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                placeholder="למשל 12"
              />
            </label>
            {error ? <RouteErrorState title="לא ניתן ליצור אירוע" body={error} /> : null}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'יוצרים...' : 'יצירה (טיוטה + פרסום)'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
