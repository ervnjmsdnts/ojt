import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

import env from '../lib/env.js';

async function connectDB() {
  const pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    queueLimit: 0,
  });

  const db = drizzle(pool);
  return db;
}

export const db = await connectDB();
