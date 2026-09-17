const { pool } = require('../config/db');

async function listForStudent(studentId) {
  const { rows } = await pool.query(
    `SELECT * FROM emergency_contacts WHERE student_id = $1 ORDER BY priority ASC, created_at ASC`,
    [studentId]
  );
  return rows;
}

async function create(studentId, { name, relationship, phone, priority }) {
  const { rows } = await pool.query(
    `INSERT INTO emergency_contacts (student_id, name, relationship, phone, priority)
     VALUES ($1,$2,$3,$4,COALESCE($5,1)) RETURNING *`,
    [studentId, name, relationship || null, phone, priority || null]
  );
  return rows[0];
}

async function remove(studentId, contactId) {
  const { rowCount } = await pool.query(
    `DELETE FROM emergency_contacts WHERE id = $1 AND student_id = $2`,
    [contactId, studentId]
  );
  return rowCount > 0;
}

async function update(studentId, contactId, fields) {
  const { name, relationship, phone, priority } = fields;
  const { rows } = await pool.query(
    `UPDATE emergency_contacts SET
       name = COALESCE($3, name),
       relationship = COALESCE($4, relationship),
       phone = COALESCE($5, phone),
       priority = COALESCE($6, priority)
     WHERE id = $1 AND student_id = $2
     RETURNING *`,
    [contactId, studentId, name, relationship, phone, priority]
  );
  return rows[0] || null;
}

module.exports = { listForStudent, create, remove, update };
