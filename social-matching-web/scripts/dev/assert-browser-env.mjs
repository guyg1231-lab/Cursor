#!/usr/bin/env node
/**
 * Fast fail before `npm run dev` / `npm run dev:staging` when no Supabase browser env resolves.
 * Mode-aware by design:
 * - development: do NOT preload staging env files
 * - staging: preload `.env.staging.local` and mirror STAGING_* → VITE_* when needed
 */
import { config as loadEnvFile } from 'dotenv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from 'vite';

const root = join(import.meta.dirname, '..', '..');
const staging = join(root, '.env.staging.local');
const local = join(root, '.env.local');
const modeArg = process.argv.find((arg) => arg.startsWith('--mode=')) || '';
const mode = modeArg.slice('--mode='.length) || 'development';
const isStagingMode = mode === 'staging';

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

const missingViteBrowserEnv = () => {
  const url = (process.env.VITE_SUPABASE_URL || '').trim();
  const key = (
    (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim()
    || (process.env.VITE_SUPABASE_ANON_KEY || '').trim()
  );
  return !url || !key;
};

if (isStagingMode || (missingViteBrowserEnv() && existsSync(staging))) {
  if (existsSync(staging)) loadEnvFile({ path: staging });
  mirrorStagingVarsToViteBrowserEnv();
}

const merged = loadEnv(mode, root, '');

const url = (merged.VITE_SUPABASE_URL || '').trim();
const key = (
  (merged.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim()
  || (merged.VITE_SUPABASE_ANON_KEY || '').trim()
);

if (!url || !key) {
  console.error(
    'חסרים משתני Supabase לדפדפן. '
      + (isStagingMode
        ? 'צור את הקובץ `.env.staging.local` (העתק מ־`.env.staging.example`) והגדר בו VITE_SUPABASE_URL ו־VITE_SUPABASE_PUBLISHABLE_KEY.'
        : 'הגדר את VITE_SUPABASE_URL ו־VITE_SUPABASE_PUBLISHABLE_KEY ב־`.env.local` / `.env`.')
      + '\n'
      + 'אחרי שמירה — הרץ שוב `npm run dev`.',
  );
  process.exit(1);
}
