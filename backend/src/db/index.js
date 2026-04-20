const { Pool } = require('pg');

let _pool = null;

function getDb() {
  if (_pool) return _pool;
  _pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway') || process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
    max: 10,
    idleTimeoutMillis: 30000,
  });
  _pool.on('error', (err) => console.error('PG pool error:', err));
  return _pool;
}

module.exports = { getDb };
