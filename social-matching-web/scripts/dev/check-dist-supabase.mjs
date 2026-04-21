#!/usr/bin/env node
/**
 * Fail before `vite preview` if the last `dist/` build still bakes the Supabase
 * placeholder host (means VITE_* were missing at build time).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const assetsDir = join(root, 'dist', 'assets');

if (!existsSync(join(root, 'dist', 'index.html'))) {
  console.error(
    'אין תיקיית dist/. הרץ קודם `npm run build` (או `npm run build:staging`) עם קובץ env שמכיל VITE_SUPABASE_URL ו־VITE_SUPABASE_PUBLISHABLE_KEY.',
  );
  process.exit(1);
}

if (!existsSync(assetsDir)) {
  console.error('אין dist/assets/. הרץ `npm run build` מחדש.');
  process.exit(1);
}

const chunks = readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
let combined = '';
for (const f of chunks) {
  combined += readFileSync(join(assetsDir, f), 'utf8');
  if (combined.length > 2_000_000) break;
}

// `invalid.supabase.co` appears in source as a fallback string even when configured;
// require a real project ref host (20 lowercase alnum subdomain — Supabase project ref shape).
const realSupabaseHost = /https:\/\/[a-z0-9]{20}\.supabase\.co/;
if (!realSupabaseHost.test(combined)) {
  console.error(
    'הבילד האחרון ב־dist/ לא מכיל כתובת Supabase אמיתית (מזהה פרויקט בן 20 תווים). '
      + 'כלומר בזמן `npm run build` לא נטענו VITE_SUPABASE_URL ו/או המפתח.\n'
      + 'פתרון: `.env.production.local` או `.env.local` עם VITE_*, או `npm run build:staging` עם `.env.staging.local`, '
      + 'ואז `npm run preview`.',
  );
  process.exit(1);
}
