export { cn } from './utils';

export const brandColors = {
  primary: 'hsl(239, 84%, 67%)',
  sage: '#6B7F5E',
  lavender: '#9BA8C4',
  cream: '#FDFBF7',
  warmWhite: '#FAF9F7',
} as const;

export const tokens = {
  spacing: {
    section: 'py-8 md:py-12',
    card: 'p-5 sm:p-6',
    content: 'space-y-5',
  },
  participant: {
    shell: {
      chrome: 'relative z-10',
      content: 'container py-6 md:py-10 space-y-4 md:space-y-5',
      hero: 'max-w-3xl space-y-2.5',
    },
    actionRail:
      'inline-flex w-fit max-w-full flex-wrap items-center gap-2 rounded-full border border-border/75 bg-card/96 px-2 py-2 shadow-[0_14px_34px_-24px_hsl(var(--foreground)/0.28),0_3px_10px_hsl(var(--foreground)/0.04)]',
    routeState:
      'border-border/75 bg-card/96 shadow-[0_16px_38px_-28px_hsl(var(--foreground)/0.3),0_4px_12px_hsl(var(--foreground)/0.05)]',
    panel:
      'rounded-[28px] border border-border/75 bg-card/96 text-card-foreground shadow-[0_18px_42px_-30px_hsl(var(--foreground)/0.32),0_6px_14px_hsl(var(--foreground)/0.05)]',
    panelInner:
      'rounded-[22px] border border-border/60 bg-background/92 shadow-[inset_0_1px_0_hsl(var(--card)),0_8px_16px_-16px_hsl(var(--foreground)/0.2)]',
  },
  typography: {
    hero: 'text-[2.6rem] leading-[1.04] md:text-[4rem] md:leading-[0.98] font-semibold tracking-[-0.03em] text-foreground',
    sectionTitle: 'text-2xl md:text-4xl font-semibold tracking-[-0.015em] text-foreground',
    pageTitle: 'text-2xl md:text-3xl font-semibold tracking-[-0.015em] text-foreground',
    body: 'text-base leading-7 text-foreground/90',
    muted: 'text-sm leading-6 text-muted-foreground',
    eyebrow: 'text-xs tracking-[0.02em] font-medium text-muted-foreground',
  },
  card: {
    surface:
      'rounded-[28px] border border-border/75 bg-card/96 shadow-[0_18px_40px_-28px_hsl(var(--foreground)/0.3),0_6px_16px_hsl(var(--foreground)/0.04)] transition-all duration-300 ease-out',
    accent:
      'rounded-[28px] border border-primary/10 bg-[linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--accent-lavender)/0.34)_100%)] shadow-[0_22px_46px_-32px_hsl(var(--primary)/0.26),0_8px_18px_hsl(var(--foreground)/0.04)] transition-all duration-300 ease-out',
    inner:
      'rounded-[22px] border border-border/60 bg-background/92 shadow-[inset_0_1px_0_hsl(var(--card)),0_8px_16px_-16px_hsl(var(--foreground)/0.2)]',
  },
  button: {
    primary: 'rounded-full shadow-sm',
    secondary: 'rounded-full shadow-sm',
    ghost: 'rounded-full',
  },
  /** Semantic pill styles for `StatusBadge` — uses theme CSS variables (see `index.css`). */
  statusBadge: {
    default:
      'rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs text-foreground',
    muted:
      'rounded-full border border-border px-2 py-1 text-xs text-muted-foreground',
    success:
      'rounded-full border border-sage/30 bg-sage/15 px-2 py-1 text-xs text-sage dark:border-sage/35 dark:bg-sage/20 dark:text-sage',
    warning:
      'rounded-full border border-primary/20 bg-accent-periwinkle/25 px-2 py-1 text-xs text-primary dark:border-primary/25 dark:bg-accent-periwinkle/20 dark:text-primary',
    danger:
      'rounded-full border border-destructive/30 bg-destructive/15 px-2 py-1 text-xs text-destructive dark:border-destructive/35 dark:bg-destructive/20 dark:text-destructive',
  },
} as const;

export type StatusBadgeTone = keyof typeof tokens.statusBadge;
