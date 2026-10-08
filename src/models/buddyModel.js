const { pool } = require('../config/db');

async function listForStudent(studentId) {
  const { rows } = await pool.query(
    `SELECT tb.id, tb.student_id, tb.buddy_user_id,
            COALESCE(u.full_name, tb.name) AS name,
            COALESCE(u.phone, tb.phone) AS phone,
            COALESCE(u.matric_number, tb.matric_number) AS matric_number,
            COALESCE(sp.blood_group, tb.blood_group) AS blood_group,
            COALESCE(array_to_string(sp.allergies, ', '), tb.allergies) AS allergies,
            sp.genotype,
            sp.department,
            tb.notes,
            tb.created_at,
            (u.id IS NOT NULL) AS is_account_linked
     FROM trusted_buddies tb
     LEFT JOIN users u ON u.id = tb.buddy_user_id
     LEFT JOIN student_profiles sp ON sp.student_id = u.id
     WHERE tb.student_id = $1
     ORDER BY tb.created_at ASC`,
    [studentId]
  );
  return rows;
}

async function lookupStudentAccount(identifier) {
  if (!identifier || !identifier.trim()) return null;
  const clean = identifier.trim();
  const { rows } = await pool.query(
    `SELECT u.id, u.full_name, u.matric_number, u.email, u.phone, u.role,
            sp.department, sp.blood_group, sp.genotype, sp.allergies
     FROM users u
     LEFT JOIN student_profiles sp ON sp.student_id = u.id
     WHERE (u.matric_number ILIKE $1 OR u.email ILIKE $1 OR u.phone = $1)
       AND u.is_active = TRUE
     LIMIT 1`,
    [clean]
  );
  return rows[0] || null;
}

async function createLinkedBuddy({ studentId, buddyUserId, notes }) {
  const countRes = await pool.query(
    `SELECT count(*) FROM trusted_buddies WHERE student_id = $1`,
    [studentId]
  );
  if (parseInt(countRes.rows[0].count, 10) >= 3) {
    const err = new Error('You can link a maximum of 3 trusted friends.');
    err.status = 400;
    throw err;
  }

  // Verify target user exists
  const userRes = await pool.query(
    `SELECT u.id, u.full_name, u.matric_number, u.phone,
            sp.blood_group, sp.genotype, sp.allergies
     FROM users u
     LEFT JOIN student_profiles sp ON sp.student_id = u.id
     WHERE u.id = $1 AND u.is_active = TRUE`,
    [buddyUserId]
  );

  if (userRes.rows.length === 0) {
    const err = new Error('Target user account not found or is inactive.');
    err.status = 404;
    throw err;
  }

  const target = userRes.rows[0];

  // Check if already linked
  const existRes = await pool.query(
    `SELECT id FROM trusted_buddies WHERE student_id = $1 AND buddy_user_id = $2`,
    [studentId, buddyUserId]
  );
  if (existRes.rows.length > 0) {
    const err = new Error(`${target.full_name} is already linked as your trusted friend.`);
    err.status = 400;
    throw err;
  }

  const allergiesStr = Array.isArray(target.allergies) ? target.allergies.join(', ') : target.allergies;

  const { rows } = await pool.query(
    `INSERT INTO trusted_buddies (student_id, buddy_user_id, name, phone, matric_number, blood_group, allergies, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      studentId,
      target.id,
      target.full_name,
      target.phone || 'N/A',
      target.matric_number || null,
      target.blood_group || null,
      allergiesStr || null,
      notes || null
    ]
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

module.exports = { listForStudent, lookupStudentAccount, createLinkedBuddy, deleteForStudent };
