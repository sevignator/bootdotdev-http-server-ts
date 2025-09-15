namespace NodeJS {
  interface ProcessEnv {
    DB_URL: string;
    PLATFORM: 'dev' | 'prod';
    JWT_SECRET: string;
    POLKA_KEY: string;
  }
}
