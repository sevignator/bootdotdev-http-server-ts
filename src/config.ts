import { type MigrationConfig } from 'drizzle-orm/migrator';

process.loadEnvFile();

if (!process.env.PLATFORM) {
  throw new Error(
    'Please provide a `PLATFORM` value of either "dev" or "prod".'
  );
}

if (!process.env.DB_URL) {
  throw new Error('Please add a `DB_URL` value to your .env file.');
}

if (!process.env.JWT_SECRET) {
  throw new Error('Please add a `JWT_SECRET` value to your .env file.');
}

type Config = {
  api: {
    platform: typeof process.env.PLATFORM;
    fileserverHits: number;
    jwtSecret: typeof process.env.JWT_SECRET;
  };
  db: {
    url: typeof process.env.DB_URL;
    migrationConfig: MigrationConfig;
  };
};

export const config: Config = {
  api: {
    platform: process.env.PLATFORM,
    fileserverHits: 0,
    jwtSecret: process.env.JWT_SECRET,
  },
  db: {
    url: process.env.DB_URL,
    migrationConfig: {
      migrationsFolder: './src/db/drizzle',
    },
  },
};
