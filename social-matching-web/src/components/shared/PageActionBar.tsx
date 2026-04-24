import type { PropsWithChildren } from 'react';
import { tokens } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

interface PageActionBarProps extends PropsWithChildren {
  variant?: 'default' | 'participant';
}

export function PageActionBar({ children, variant = 'default' }: PageActionBarProps) {
  if (variant === 'participant') {
    return (
      <div className="flex justify-start">
        <div data-testid="participant-page-actions" className={tokens.participant.actionRail}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('mb-4 flex flex-wrap gap-3')}>
      {children}
    </div>
  );
}
