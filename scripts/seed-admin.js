require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function seedAdmin() {
  const email = 'admin@ear.com';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

  if (existing.rows.length > 0) {
    await pool.query(
      'UPDATE users SET password = $1, role = $2 WHERE email = $3',
      [hashedPassword, 'admin', email]
    );
    console.log('Admin user updated:', email);
  } else {
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      ['Admin', email, hashedPassword, 'admin']
    );
    console.log('Admin user created:', email);
  }

  console.log('Default password: admin123');
  await pool.end();
}

seedAdmin().catch((error) => {
  console.error('Seed failed:', error.message);
  pool.end();
  process.exit(1);
});
