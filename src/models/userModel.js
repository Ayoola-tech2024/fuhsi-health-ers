const { pool } = require('../config/db');

const PUBLIC_FIELDS = `id, email, full_name, phone, role, matric_number, staff_id, is_active, created_at`;

async function createUser({ email, passwordHash, fullName, phone, role, matricNumber, staffId }) {
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, phone, role, matric_number, staff_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${PUBLIC_FIELDS}`,
    [email, passwordHash, fullName, phone || null, role, matricNumber || null, staffId || null]
  );
  return rows[0];
}

async function findByEmail(email) {
  const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function listByRole(role) {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_FIELDS} FROM users WHERE role = $1 AND is_active = TRUE ORDER BY full_name`,
    [role]
  );
  return rows;
}

module.exports = { createUser, findByEmail, findById, listByRole };
