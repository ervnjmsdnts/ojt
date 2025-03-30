import { defineConfig } from 'drizzle-kit';

import env from './src/lib/env';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'mysql',
  dbCredentials: {
    host: 'host.docker.internal', // For Local development use 'host.docker.internal'
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: env.DB_PORT,
    user: env.DB_USER,
  },
});
