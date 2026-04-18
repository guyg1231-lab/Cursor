import { config as loadDotenv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
loadDotenv({ path: path.resolve(ROOT, '.env.staging.local') });
loadDotenv({ path: path.resolve(ROOT, 'e2e/.env.e2e') });

function req(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing env var: ${name}`);
  return v.trim();
}

export const ENV = {
  SUPABASE_URL: req('STAGING_SUPABASE_URL'),
  SUPABASE_ANON_KEY: req('STAGING_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: req('STAGING_SUPABASE_SERVICE_ROLE_KEY'),
  SUPABASE_PROJECT_REF: req('STAGING_PROJECT_REF'),
  SHARED_PASSWORD: req('STAGING_VALIDATION_SHARED_PASSWORD'),
  EVENT_ID: req('E2E_EVENT_ID'),
  EMAILS: {
    ADMIN1: req('STAGING_ADMIN1_EMAIL'),
    HOST1: req('STAGING_HOST1_EMAIL'),
    P1: req('STAGING_P1_EMAIL'),
    P2: req('STAGING_P2_EMAIL'),
    P3: req('STAGING_P3_EMAIL'),
    P4: req('STAGING_P4_EMAIL'),
  },
};

export const STORAGE_KEY = `sb-${ENV.SUPABASE_PROJECT_REF}-auth-token`;
