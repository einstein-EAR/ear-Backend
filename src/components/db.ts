import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '';
const useSsl =
  process.env.DB_SSL === 'true' ||
  host.includes('neon.tech') ||
  (host !== '' && host !== 'localhost' && host !== '127.0.0.1');

const pool = new Pool({
  host,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

export default pool;
