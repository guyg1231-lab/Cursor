/** Non-secret refs documented in repo ops / parity spec — used only for header diagnostics. */
export const SUPABASE_PROJECT_REF_PRODUCTION = 'nshgmuqlivuhlimwdwhe';
export const SUPABASE_PROJECT_REF_STAGING = 'huzcvjyyyuudchnrosvx';

export function resolveSupabaseProjectRefFromEnv(): string {
  const id = import.meta.env.VITE_SUPABASE_PROJECT_ID?.toString().trim();
  if (id) return id.toLowerCase();
  const url = import.meta.env.VITE_SUPABASE_URL?.toString().trim();
  const m = url?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co\/?$/i);
  return (m?.[1] ?? '').toLowerCase();
}

/**
 * Label for which Supabase/data tier the bundle talks to — not Vite's build mode
 * (`import.meta.env.MODE` is `production` for every optimized build, including staging hosts).
 */
export function dataEnvironmentBadgeLabel(projectRef: string, viteMode: string): string {
  if (projectRef === SUPABASE_PROJECT_REF_PRODUCTION) return 'PROD';
  if (projectRef === SUPABASE_PROJECT_REF_STAGING) return 'STAGING';
  if (projectRef) return 'OTHER';
  const m = (viteMode || '').toLowerCase();
  if (m === 'staging') return 'STAGING';
  if (m === 'production') return 'PROD';
  return 'DEV';
}
