#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(new URL(import.meta.url)));
const repoRoot = join(currentDir, '..', '..', '..');
const rootVercelJsonPath = join(repoRoot, 'vercel.json');

const EXPECTED = {
  installCommand: 'npm --prefix social-matching-web ci',
  buildCommand: 'npm --prefix social-matching-web run build',
  outputDirectory: 'social-matching-web/dist',
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

let parsed;
try {
  const raw = await readFile(rootVercelJsonPath, 'utf8');
  parsed = JSON.parse(raw);
} catch (error) {
  fail(`Unable to read ${rootVercelJsonPath}: ${String(error)}`);
}

for (const [key, expectedValue] of Object.entries(EXPECTED)) {
  const actualValue = parsed?.[key];
  if (actualValue !== expectedValue) {
    fail(
      `Invalid root vercel.json: expected ${key}="${expectedValue}", got "${String(actualValue)}".\n` +
        'This project deploys from a monorepo root and must delegate build to social-matching-web.',
    );
  }
}

console.log('OK: root vercel.json delegates install/build/output to social-matching-web.');
