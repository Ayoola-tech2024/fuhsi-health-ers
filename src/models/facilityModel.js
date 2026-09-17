const { pool } = require('../config/db');

async function listActive() {
  const { rows } = await pool.query(
    `SELECT * FROM facilities WHERE is_active = TRUE ORDER BY name`
  );
  return rows;
}

async function create({ name, facilityType, latitude, longitude, address, phone }) {
  const { rows } = await pool.query(
    `INSERT INTO facilities (name, facility_type, latitude, longitude, address, phone)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [name, facilityType || 'clinic', latitude, longitude, address || null, phone || null]
  );
  return rows[0];
}

async function findById(id) {
  const { rows } = await pool.query(`SELECT * FROM facilities WHERE id = $1`, [id]);
  return rows[0] || null;
}

module.exports = { listActive, create, findById };
