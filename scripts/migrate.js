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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `);

  const appliedResult = await pool.query('SELECT id FROM schema_migrations');
  const applied = new Set(appliedResult.rows.map((row) => row.id));

  const folders = fs
    .readdirSync(migrationsDir)
    .filter((name) => fs.statSync(path.join(migrationsDir, name)).isDirectory())
    .sort();

  for (const folder of folders) {
    if (applied.has(folder)) {
      console.log(`Skipped (already applied): ${folder}`);
      continue;
    }

    const sqlPath = path.join(migrationsDir, folder, 'migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO schema_migrations (id) VALUES ($1)', [folder]);
      await pool.query('COMMIT');
      console.log(`Applied: ${folder}`);
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
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
