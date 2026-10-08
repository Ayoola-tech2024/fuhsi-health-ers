const { pool } = require('../config/db');

async function listForStudent(studentId) {
  const { rows } = await pool.query(
    `SELECT * FROM trusted_buddies WHERE student_id = $1 ORDER BY created_at ASC`,
    [studentId]
  );
  return rows;
}

async function create({ studentId, name, phone, matricNumber, bloodGroup, allergies, notes }) {
  const countRes = await pool.query(
    `SELECT count(*) FROM trusted_buddies WHERE student_id = $1`,
    [studentId]
  );
  if (parseInt(countRes.rows[0].count, 10) >= 3) {
    const err = new Error('You can register a maximum of 3 trusted friends.');
    err.status = 400;
    throw err;
  }

  const { rows } = await pool.query(
    `INSERT INTO trusted_buddies (student_id, name, phone, matric_number, blood_group, allergies, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [studentId, name, phone, matricNumber || null, bloodGroup || null, allergies || null, notes || null]
  );
  return rows[0];
}

async function deleteForStudent(id, studentId) {
  const { rows } = await pool.query(
    `DELETE FROM trusted_buddies WHERE id = $1 AND student_id = $2 RETURNING *`,
    [id, studentId]
  );
  return rows[0] || null;
}

module.exports = { listForStudent, create, deleteForStudent };
