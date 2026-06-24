require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const migrationsDir = path.join(__dirname, '../prisma/migrations');

async function runMigrations() {
  const folders = fs
    .readdirSync(migrationsDir)
    .filter((name) => fs.statSync(path.join(migrationsDir, name)).isDirectory())
    .sort();

  for (const folder of folders) {
    const sqlPath = path.join(migrationsDir, folder, 'migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);
    console.log(`Applied: ${folder}`);
  }
}

runMigrations()
  .then(() => {
    console.log('All migrations applied successfully');
    return pool.end();
  })
  .catch((error) => {
    console.error('Migration failed:', error.message);
    pool.end();
    process.exit(1);
  });
