const { Pool } = require('pg');

const isRemoteDb = Boolean(
  process.env.DATABASE_URL && 
  !process.env.DATABASE_URL.includes('localhost') && 
  !process.env.DATABASE_URL.includes('127.0.0.1')
);

const useSSL = process.env.PGSSL === 'true' || process.env.NODE_ENV === 'production' || isRemoteDb;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err.message);
});

module.exports = { pool };
