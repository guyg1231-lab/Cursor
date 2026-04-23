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
    section: 'py-10 md:py-14',
    card: 'p-5 sm:p-6',
    content: 'space-y-6',
  },
  participant: {
    shell: {
      chrome: 'relative z-10',
      content: 'container py-8 md:py-12 space-y-5 md:space-y-6',
      hero: 'max-w-3xl space-y-3',
    },
    actionRail:
      'mb-1 flex flex-wrap items-center gap-3 rounded-[28px] border border-border/60 bg-background/72 p-2.5 shadow-soft backdrop-blur-md',
    routeState:
      'border-border/60 bg-card/88 shadow-soft-lg backdrop-blur-md',
    panel:
      'rounded-[30px] border border-border/60 bg-card/88 text-card-foreground shadow-soft backdrop-blur-md',
    panelInner:
      'rounded-[26px] border border-border/40 bg-background/55 backdrop-blur-sm',
  },
  typography: {
    hero: 'text-3xl md:text-5xl font-semibold tracking-[-0.015em] text-foreground',
    sectionTitle: 'text-2xl md:text-4xl font-semibold tracking-[-0.015em] text-foreground',
    pageTitle: 'text-2xl md:text-3xl font-semibold tracking-[-0.015em] text-foreground',
    body: 'text-base leading-7 text-foreground/90',
    muted: 'text-sm leading-6 text-muted-foreground',
    eyebrow: 'text-xs tracking-[0.02em] font-medium text-muted-foreground',
  },
  card: {
    surface:
      'rounded-[30px] border border-border/60 bg-card/88 backdrop-blur-md shadow-soft transition-all duration-300 ease-out',
    accent:
      'rounded-3xl border border-primary/10 bg-gradient-to-br from-[hsl(var(--accent-lavender)/0.8)] via-card/95 to-[hsl(var(--accent-periwinkle)/0.6)] shadow-soft-lg transition-all duration-300 ease-out',
    inner:
      'rounded-[26px] border border-border/40 bg-background/55 backdrop-blur-sm',
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
