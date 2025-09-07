import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';

import { config } from '../config.js';

export async function migrateDb() {
  const migrationClient = postgres(config.db.url, { max: 1 });
  await migrate(drizzle(migrationClient), config.db.migrationConfig);
}
