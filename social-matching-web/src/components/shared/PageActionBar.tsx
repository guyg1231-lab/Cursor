import type { PropsWithChildren } from 'react';

export function PageActionBar({ children }: PropsWithChildren) {
  return <div className="mb-4 flex flex-wrap gap-3">{children}</div>;
}
