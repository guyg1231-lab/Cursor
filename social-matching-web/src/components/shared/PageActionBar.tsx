import type { PropsWithChildren } from 'react';
import { tokens } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

interface PageActionBarProps extends PropsWithChildren {
  variant?: 'default' | 'participant';
}

export function PageActionBar({ children, variant = 'default' }: PageActionBarProps) {
  return (
    <div
      data-testid={variant === 'participant' ? 'participant-page-actions' : undefined}
      className={cn(variant === 'participant' ? tokens.participant.actionRail : 'mb-4 flex flex-wrap gap-3')}
    >
      {children}
    </div>
  );
}
