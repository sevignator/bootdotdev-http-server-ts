import { type MigrationConfig } from 'drizzle-orm/migrator';

process.loadEnvFile();

if (!process.env.DB_URL) {
  throw new Error('Please add a `DB_URL` value to your .env file.');
}

type Config = {
  api: {
    fileserverHits: number;
  };
  db: {
    url: string;
    migrationConfig: MigrationConfig;
  };
};

export const config: Config = {
  api: {
    fileserverHits: 0,
  },
  db: {
    url: process.env.DB_URL,
    migrationConfig: {
      migrationsFolder: './src/db/drizzle',
    },
  },
};
