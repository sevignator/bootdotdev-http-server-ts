process.loadEnvFile();

if (!process.env.DB_URL) {
  throw new Error('Please add a `DB_URL` value to your .env file.');
}

type APIConfig = {
  dbURL: string;
  fileserverHits: number;
};

export const config: APIConfig = {
  dbURL: process.env.DB_URL,
  fileserverHits: 0,
};
