import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { safeLocalStorage } from '@/lib/safeStorage';
import { tokens } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

type PostEventFeedbackDraft = {
  reflection: string;
  connection: string;
  nextCircle: string;
};

function storageKey(eventId: string, userId: string) {
  return `social-matching-post-event-feedback:${eventId}:${userId}`;
}

function readDraft(key: string): PostEventFeedbackDraft {
  try {
    const raw = safeLocalStorage.getItem(key);
    if (!raw) {
      return { reflection: '', connection: '', nextCircle: '' };
    }

    const parsed = JSON.parse(raw) as Partial<PostEventFeedbackDraft>;
    return {
      reflection: typeof parsed.reflection === 'string' ? parsed.reflection : '',
      connection: typeof parsed.connection === 'string' ? parsed.connection : '',
      nextCircle: typeof parsed.nextCircle === 'string' ? parsed.nextCircle : '',
    };
  } catch {
    return { reflection: '', connection: '', nextCircle: '' };
  }
}

export function PostEventFeedbackCard({
  eventId,
  userId,
  completedStatus,
}: {
  eventId: string;
  userId: string;
  completedStatus: 'attended' | 'no_show';
}) {
  const key = useMemo(() => storageKey(eventId, userId), [eventId, userId]);
  const [reflection, setReflection] = useState('');
  const [connection, setConnection] = useState('');
  const [nextCircle, setNextCircle] = useState('');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    const draft = readDraft(key);
    setReflection(draft.reflection);
    setConnection(draft.connection);
    setNextCircle(draft.nextCircle);
  }, [key]);

  const intro =
    completedStatus === 'attended'
      ? 'אם תרצה או תרצי, אפשר להשאיר כאן כמה מילים על מה שהיה חשוב לך במפגש הזה, כדי שהמפגשים הבאים ירגישו יותר מדויקים.'
      : 'אם זה לא הסתדר הפעם, אפשר להשאיר כאן כמה מילים קצרות כדי שהפעם הבאה תרגיש יותר נכונה.';

  function saveFeedback() {
    safeLocalStorage.setItem(
      key,
      JSON.stringify({
        reflection,
        connection,
        nextCircle,
      }),
    );
    setSavedMessage('המשוב נשמר מקומית, ואפשר לחזור אליו אחר כך.');
    window.setTimeout(() => setSavedMessage(null), 2500);
  }

  return (
    <Card data-testid="post-event-feedback" className={cn(tokens.card.surface)}>
      <CardHeader className="space-y-2">
        <p className={tokens.typography.eyebrow}>אחרי המפגש</p>
        <CardTitle className="text-xl font-semibold tracking-[-0.015em]">אחרי המפגש</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
        <p className="text-foreground/85">{intro}</p>

        <div className={tokens.card.inner + ' space-y-2 p-4'}>
          <label className="text-sm font-medium text-foreground" htmlFor={`reflection-${key}`}>
            מה נשאר איתך מהמפגש?
          </label>
          <textarea
            id={`reflection-${key}`}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="min-h-[110px] w-full resize-y rounded-[22px] border border-border/70 bg-card/94 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-2 focus:ring-primary/10"
          />
        </div>

        <div className={tokens.card.inner + ' space-y-2 p-4'}>
          <label className="text-sm font-medium text-foreground" htmlFor={`connection-${key}`}>
            מי או מה הרגיש לך כמו חיבור?
          </label>
          <textarea
            id={`connection-${key}`}
            value={connection}
            onChange={(e) => setConnection(e.target.value)}
            className="min-h-[96px] w-full resize-y rounded-[22px] border border-border/70 bg-card/94 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-2 focus:ring-primary/10"
          />
        </div>

        <div className={tokens.card.inner + ' space-y-2 p-4'}>
          <label className="text-sm font-medium text-foreground" htmlFor={`next-circle-${key}`}>
            איזה סוג מפגש, חוויה או מעגל יתאים לך בפעם הבאה?
          </label>
          <textarea
            id={`next-circle-${key}`}
            value={nextCircle}
            onChange={(e) => setNextCircle(e.target.value)}
            className="min-h-[110px] w-full resize-y rounded-[22px] border border-border/70 bg-card/94 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-2 focus:ring-primary/10"
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">אפשר להשאיר כמה שורות, ואז לשמור מקומית.</p>
          <div className="flex flex-col gap-2 sm:items-end">
            {savedMessage ? <p className="text-sm text-primary">{savedMessage}</p> : null}
            <Button variant="secondary" className="w-full sm:w-auto" onClick={saveFeedback}>
              שמירת משוב
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
