#!/usr/bin/env node
// Runner de migrations. Executar localmente com `tsx db/migrate.ts`.
// Nunca deve virar endpoint HTTP publico. Cada migration e idempotente
// (verifica o estado atual do schema antes de alterar), igual aos
// migrate_v*.php originais.
import { loadConfig } from '../lib/config.js';
import { getPool } from '../lib/db.js';
import { migrateV2 } from './migrate_v2.js';
import { migrateV3 } from './migrate_v3.js';
import { migrateV4 } from './migrate_v4.js';
import { migrateV5 } from './migrate_v5.js';
import { migrateSessions } from './migrate_sessions.js';

async function main() {
  const config = loadConfig(process.env);
  const pool = getPool(config);

  for (const migration of [migrateV2, migrateV3, migrateV4, migrateV5, migrateSessions]) {
    await migration(pool);
  }

  console.log('Migracoes concluidas.');
  process.exit(0);
}

main();
