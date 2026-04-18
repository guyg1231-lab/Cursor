export function StatusBadge({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: 'default' | 'muted';
}) {
  const className =
    tone === 'muted'
      ? 'rounded-full border border-border px-2 py-1 text-xs text-muted-foreground'
      : 'rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs text-foreground';

  return <span className={className}>{label}</span>;
}
