// lib/db.ts - Put this in your app at lib/db.ts
import { Pool } from 'pg';

declare global {
  var pgPool: Pool | undefined;
}

const pool = global.pgPool || new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
});

if (process.env.NODE_ENV !== 'production') global.pgPool = pool;

export default pool;