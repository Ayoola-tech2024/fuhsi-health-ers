const { pool } = require('../config/db');

// Stub: writes a notification row. Swap the body of `dispatch` for a real
// SMS/push/email provider call later; the queued/sent/failed status lets
// you retry without changing callers.
async function queue({ userId, incidentId, channel, message }) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, incident_id, channel, message)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [userId || null, incidentId || null, channel || 'push', message]
  );
  return rows[0];
}

async function dispatch(notification) {
  // TODO: integrate real provider (e.g. Termii/Africa's Talking for SMS,
  // Expo push for mobile, nodemailer for email). For now mark as sent.
  const { rows } = await pool.query(
    `UPDATE notifications SET status = 'sent' WHERE id = $1 RETURNING *`,
    [notification.id]
  );
  return rows[0];
}

async function notifyMany(recipients, { incidentId, channel, message }) {
  const results = [];
  for (const userId of recipients) {
    const n = await queue({ userId, incidentId, channel, message });
    results.push(await dispatch(n));
  }
  return results;
}

async function listForIncident(incidentId) {
  const { rows } = await pool.query(
    `SELECT * FROM notifications WHERE incident_id = $1 ORDER BY created_at ASC`,
    [incidentId]
  );
  return rows;
}

module.exports = { queue, dispatch, notifyMany, listForIncident };
