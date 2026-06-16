#!/usr/bin/env node
/**
 * Apply SQL migrations using Node/pg (no psql required).
 * Used on Render pre-deploy and CI. Prefers DATABASE_URL_DIRECT for Neon.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '../database/migrations');

const connectionString =
  process.env.DATABASE_URL_DIRECT?.trim() || process.env.DATABASE_URL?.trim();

if (!connectionString) {
  console.error('Set DATABASE_URL_DIRECT or DATABASE_URL before running migrations.');
  process.exit(1);
}

function resolveSsl(url) {
  try {
    const parsed = new URL(url);
    const sslMode = parsed.searchParams.get('sslmode')?.toLowerCase();
    if (
      parsed.hostname.endsWith('.neon.tech') ||
      sslMode === 'require' ||
      sslMode === 'verify-full' ||
      sslMode === 'verify-ca'
    ) {
      return { rejectUnauthorized: true };
    }
  } catch {
    // ignore
  }
  return undefined;
}

const files = fs
  .readdirSync(migrationsDir)
  .filter((name) => name.endsWith('.sql'))
  .sort();

const client = new pg.Client({
  connectionString,
  ssl: resolveSsl(connectionString),
});

try {
  await client.connect();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`==> Applying ${file}`);
    await client.query(sql);
  }
  console.log('==> Migrations complete.');
} catch (error) {
  console.error('Migration failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
