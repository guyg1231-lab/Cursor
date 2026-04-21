#!/usr/bin/env node
/**
 * Fast fail before `npm run dev` / `npm run dev:staging` when no Supabase browser env resolves.
 * Applies the same dotenv preload as `vite.config.ts`, then merges Vite `loadEnv` for `staging`
 * and `development` (covers both `vite` and `vite --mode staging`).
 */
import { config as loadEnvFile } from 'dotenv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from 'vite';

const root = join(import.meta.dirname, '..', '..');
const staging = join(root, '.env.staging.local');
const local = join(root, '.env.local');

if (existsSync(staging)) loadEnvFile({ path: staging });
if (existsSync(local)) loadEnvFile({ path: local, override: true });

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

mirrorStagingVarsToViteBrowserEnv();

const merged = {
  ...loadEnv('staging', root, ''),
  ...loadEnv('development', root, ''),
};

const url = (merged.VITE_SUPABASE_URL || '').trim();
const key = (
  (merged.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim()
  || (merged.VITE_SUPABASE_ANON_KEY || '').trim()
);

if (!url || !key) {
  console.error(
    'חסרים משתני Supabase לדפדפן. צור את הקובץ `.env.staging.local` (העתק מ־`.env.staging.example`) '
      + 'והגדר בו VITE_SUPABASE_URL ו־VITE_SUPABASE_PUBLISHABLE_KEY, או הגדר אותם ב־`.env.local` / `.env`.\n'
      + 'אחרי שמירה — הרץ שוב `npm run dev`.',
  );
  process.exit(1);
}
