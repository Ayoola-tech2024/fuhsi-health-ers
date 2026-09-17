const { pool } = require('../config/db');

async function createEntry({ studentId, enteredBy, entryType, content, isEmergencyOverride, overrideReason }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO clinical_entries
        (student_id, entered_by, entry_type, content, is_emergency_override, override_reason)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [studentId, enteredBy, entryType, content, !!isEmergencyOverride, overrideReason || null]
    );
    const entry = rows[0];

    await client.query(
      `INSERT INTO clinical_entry_audit (clinical_entry_id, actor_id, action, details)
       VALUES ($1,$2,'created',$3)`,
      [entry.id, enteredBy, JSON.stringify({ entryType, isEmergencyOverride: !!isEmergencyOverride })]
    );

    await client.query('COMMIT');
    return entry;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listForStudent(studentId) {
  const { rows } = await pool.query(
    `SELECT ce.*, u.full_name AS entered_by_name
     FROM clinical_entries ce
     JOIN users u ON u.id = ce.entered_by
     WHERE ce.student_id = $1
     ORDER BY ce.created_at DESC`,
    [studentId]
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(`SELECT * FROM clinical_entries WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function setVerification(id, verifierId, status, note) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE clinical_entries
       SET verification_status = $2, verified_by = $3, verified_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, status, verifierId]
    );
    await client.query(
      `INSERT INTO clinical_entry_audit (clinical_entry_id, actor_id, action, details)
       VALUES ($1,$2,$3,$4)`,
      [id, verifierId, status === 'verified' ? 'verified' : 'rejected', JSON.stringify({ note: note || null })]
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function auditTrail(entryId) {
  const { rows } = await pool.query(
    `SELECT a.*, u.full_name AS actor_name
     FROM clinical_entry_audit a
     JOIN users u ON u.id = a.actor_id
     WHERE a.clinical_entry_id = $1
     ORDER BY a.created_at ASC`,
    [entryId]
  );
  return rows;
}

module.exports = { createEntry, listForStudent, findById, setVerification, auditTrail };
