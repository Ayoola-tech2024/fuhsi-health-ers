const { pool } = require('../config/db');

// Valid forward transitions in the ERS flow.
const VALID_TRANSITIONS = {
  reported: ['triaged', 'cancelled'],
  triaged: ['responder_assigned', 'cancelled'],
  responder_assigned: ['dispatched', 'cancelled'],
  dispatched: ['at_facility', 'resolved', 'cancelled'],
  at_facility: ['resolved'],
  resolved: [],
  cancelled: [],
};

async function createIncident({ studentId, latitude, longitude, description, nearestFacilityId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO incidents (student_id, latitude, longitude, description, nearest_facility_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [studentId, latitude, longitude, description || null, nearestFacilityId || null]
    );
    const incident = rows[0];

    await client.query(
      `INSERT INTO incident_locations (incident_id, latitude, longitude) VALUES ($1,$2,$3)`,
      [incident.id, latitude, longitude]
    );

    await client.query(
      `INSERT INTO incident_logs (incident_id, actor_id, event_type, notes)
       VALUES ($1,$2,'reported',$3)`,
      [incident.id, studentId, 'SOS triggered']
    );

    await client.query('COMMIT');
    return incident;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function findById(id) {
  const { rows } = await pool.query(`SELECT * FROM incidents WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function listForUser({ role, userId, status }) {
  // Students see only their own incidents; responders/clinicians/admin see all
  // (optionally filtered by status).
  const params = [];
  let where = '1=1';

  if (role === 'student') {
    params.push(userId);
    where += ` AND student_id = $${params.length}`;
  }
  if (status) {
    params.push(status);
    where += ` AND status = $${params.length}`;
  }

  const { rows } = await pool.query(
    `SELECT i.*, s.full_name AS student_name, f.name AS facility_name, r.full_name AS responder_name
     FROM incidents i
     JOIN users s ON s.id = i.student_id
     LEFT JOIN facilities f ON f.id = i.nearest_facility_id
     LEFT JOIN users r ON r.id = i.assigned_responder_id
     WHERE ${where}
     ORDER BY i.created_at DESC`,
    params
  );
  return rows;
}

function canTransition(from, to) {
  return (VALID_TRANSITIONS[from] || []).includes(to);
}

async function updateStatus(id, actorId, newStatus, { notes, responderId, triageNotes } = {}) {
  const current = await findById(id);
  if (!current) return { error: 'not_found' };
  if (!canTransition(current.status, newStatus)) {
    return { error: 'invalid_transition', from: current.status, to: newStatus };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const setClauses = [`status = $2`, `updated_at = now()`];
    const params = [id, newStatus];

    if (responderId) {
      params.push(responderId);
      setClauses.push(`assigned_responder_id = $${params.length}`);
    }
    if (triageNotes) {
      params.push(triageNotes);
      setClauses.push(`triage_notes = $${params.length}`);
    }
    if (newStatus === 'resolved') {
      setClauses.push(`resolved_at = now()`);
    }

    const { rows } = await client.query(
      `UPDATE incidents SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
      params
    );

    await client.query(
      `INSERT INTO incident_logs (incident_id, actor_id, event_type, notes)
       VALUES ($1,$2,$3,$4)`,
      [id, actorId, newStatus, notes || null]
    );

    await client.query('COMMIT');
    return { incident: rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function addLocationPing(incidentId, latitude, longitude) {
  const { rows } = await pool.query(
    `INSERT INTO incident_locations (incident_id, latitude, longitude)
     VALUES ($1,$2,$3) RETURNING *`,
    [incidentId, latitude, longitude]
  );
  return rows[0];
}

async function locationHistory(incidentId) {
  const { rows } = await pool.query(
    `SELECT * FROM incident_locations WHERE incident_id = $1 ORDER BY recorded_at ASC`,
    [incidentId]
  );
  return rows;
}

async function logs(incidentId) {
  const { rows } = await pool.query(
    `SELECT l.*, u.full_name AS actor_name
     FROM incident_logs l
     LEFT JOIN users u ON u.id = l.actor_id
     WHERE l.incident_id = $1
     ORDER BY l.created_at ASC`,
    [incidentId]
  );
  return rows;
}

module.exports = {
  createIncident,
  findById,
  listForUser,
  updateStatus,
  addLocationPing,
  locationHistory,
  logs,
  canTransition,
};
