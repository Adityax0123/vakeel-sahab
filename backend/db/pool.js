// PostgreSQL connection pool, shared across the app.
// SSL is switched on automatically for remote databases (Supabase, Render, etc.).
const { Pool } = require('pg');

const url = process.env.DATABASE_URL || '';
const isLocal = url.includes('localhost') || url.includes('127.0.0.1');

const pool = new Pool({
  connectionString: url,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error on idle client', err);
  process.exit(1);
});

module.exports = pool;
