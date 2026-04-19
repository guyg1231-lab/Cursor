import { tokens, type StatusBadgeTone } from '@/lib/design-tokens';

export type { StatusBadgeTone };

export function StatusBadge({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: StatusBadgeTone;
}) {
  return <span className={tokens.statusBadge[tone]}>{label}</span>;
}
