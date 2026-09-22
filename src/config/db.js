const { Pool } = require('pg');

let pool;
let isMemoryFallback = false;

if (process.env.DATABASE_URL) {
  const isRemoteDb = Boolean(
    !process.env.DATABASE_URL.includes('localhost') && 
    !process.env.DATABASE_URL.includes('127.0.0.1')
  );
  const useSSL = process.env.PGSSL === 'true' || process.env.NODE_ENV === 'production' || isRemoteDb;
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
  });
  pool.on('error', (err) => {
    console.error('Unexpected error on idle Postgres client', err.message);
  });
} else {
  console.log('⚡ DATABASE_URL is not set. Activating high-performance in-memory PostgreSQL engine (pg-mem)...');
  isMemoryFallback = true;
  const { newDb } = require('pg-mem');
  const db = newDb();

  db.registerExtension('pgcrypto', (schema) => {
    schema.registerFunction({
      name: 'gen_random_uuid',
      returns: 'uuid',
      impure: true,
      implementation: () => require('crypto').randomUUID(),
    });
  });

  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: 'uuid',
    impure: true,
    implementation: () => require('crypto').randomUUID(),
  });

  // Pre-register enum types before tables
  db.public.none(`
    CREATE TYPE user_role AS ENUM ('student', 'clinician', 'responder', 'admin');
    CREATE TYPE incident_status AS ENUM ('reported', 'triaged', 'responder_assigned', 'dispatched', 'at_facility', 'resolved', 'cancelled');
    CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
  `);

  const PoolAdapter = db.adapters.createPg().Pool;
  pool = new PoolAdapter();
}

module.exports = { pool, isMemoryFallback };
