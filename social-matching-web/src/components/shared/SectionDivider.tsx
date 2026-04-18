import type { HTMLAttributes } from 'react';

export function SectionDivider(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className="max-w-md mx-auto px-5">
      <div
        className="h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, hsl(var(--accent-lavender)) 30%, hsl(var(--accent-periwinkle)) 70%, transparent)',
        }}
      />
    </div>
  );
}
