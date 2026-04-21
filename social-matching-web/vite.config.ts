import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite only auto-loads `.env.<mode>.local` for the active `mode`.
 * Developers keep secrets in `.env.staging.local` but often run `vite` in `development` mode,
 * so those vars never reached `import.meta.env`. Preload into `process.env` before Vite merges
 * env — `loadEnv` prefers `process.env` for `VITE_*` keys (see Vite source).
 *
 * Never load staging for `vite build` with `mode === 'production'` so prod bundles cannot
 * accidentally pick up a laptop's staging file.
 */
/** Many repos only set `STAGING_*` in `.env.staging.local` (E2E); mirror into `VITE_*` when missing. */
function mirrorStagingVarsToViteBrowserEnv() {
  const viteUrl = (process.env.VITE_SUPABASE_URL || '').trim();
  const viteKey = (
    (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim()
    || (process.env.VITE_SUPABASE_ANON_KEY || '').trim()
  );
  const viteRef = (process.env.VITE_SUPABASE_PROJECT_ID || '').trim();
  const sUrl = (process.env.STAGING_SUPABASE_URL || '').trim();
  const sKey = (process.env.STAGING_SUPABASE_ANON_KEY || '').trim();
  const sRef = (process.env.STAGING_PROJECT_REF || '').trim();
  if (!viteUrl && sUrl) process.env.VITE_SUPABASE_URL = sUrl;
  if (!viteKey && sKey) process.env.VITE_SUPABASE_PUBLISHABLE_KEY = sKey;
  if (!viteRef && sRef) process.env.VITE_SUPABASE_PROJECT_ID = sRef;
}

function preloadLocalEnvFiles(command: string, mode: string) {
  const root = __dirname;
  const isProdBuild = command === 'build' && mode === 'production';

  if (isProdBuild) {
    const prodLocal = path.join(root, '.env.production.local');
    if (existsSync(prodLocal)) loadDotenv({ path: prodLocal, override: true });
    const envLocal = path.join(root, '.env.local');
    if (existsSync(envLocal)) loadDotenv({ path: envLocal, override: true });
    return;
  }

  const stagingLocal = path.join(root, '.env.staging.local');
  if (existsSync(stagingLocal)) loadDotenv({ path: stagingLocal });
  const envLocal = path.join(root, '.env.local');
  if (existsSync(envLocal)) loadDotenv({ path: envLocal, override: true });
  mirrorStagingVarsToViteBrowserEnv();
}

export default defineConfig(({ command, mode }) => {
  preloadLocalEnvFiles(command, mode);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '::',
      port: 4173,
    },
    /** Same defaults as dev so `vite preview` works from a phone / LAN IP after a local build. */
    preview: {
      host: '::',
      port: 4173,
    },
  };
});
