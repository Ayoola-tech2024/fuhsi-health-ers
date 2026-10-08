const { pool } = require('../config/db');
const notificationModel = require('./notificationModel');

async function listForStudent(studentId) {
  const { rows } = await pool.query(
    `SELECT tb.id, tb.student_id, tb.buddy_user_id, tb.status, tb.requested_by,
            COALESCE(u.full_name, tb.name) AS name,
            COALESCE(u.phone, tb.phone) AS phone,
            COALESCE(u.matric_number, tb.matric_number) AS matric_number,
            COALESCE(sp.blood_group, tb.blood_group) AS blood_group,
            sp.allergies AS profile_allergies,
            tb.allergies AS custom_allergies,
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
  return rows.map((r) => {
    const rawAllergies = r.profile_allergies || r.custom_allergies;
    const allergiesStr = Array.isArray(rawAllergies) ? rawAllergies.join(', ') : (rawAllergies || null);
    return {
      id: r.id,
      student_id: r.student_id,
      buddy_user_id: r.buddy_user_id,
      status: r.status,
      requested_by: r.requested_by,
      name: r.name,
      phone: r.phone,
      matric_number: r.matric_number,
      blood_group: r.blood_group,
      allergies: allergiesStr,
      genotype: r.genotype,
      department: r.department,
      notes: r.notes,
      created_at: r.created_at,
      is_account_linked: r.is_account_linked,
    };
  });
}

async function listIncomingRequests(studentId) {
  const { rows } = await pool.query(
    `SELECT tb.id, tb.student_id AS requester_id, tb.buddy_user_id, tb.status, tb.notes, tb.created_at,
            u.full_name AS requester_name,
            u.email AS requester_email,
            u.matric_number AS requester_matric,
            u.phone AS requester_phone,
            sp.department AS requester_department
     FROM trusted_buddies tb
     JOIN users u ON u.id = tb.student_id
     LEFT JOIN student_profiles sp ON sp.student_id = u.id
     WHERE tb.buddy_user_id = $1 AND tb.status = 'pending'
     ORDER BY tb.created_at DESC`,
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

async function createBuddyRequest({ studentId, buddyUserId, notes }) {
  const countRes = await pool.query(
    `SELECT count(*) FROM trusted_buddies WHERE student_id = $1`,
    [studentId]
  );
  if (parseInt(countRes.rows[0].count, 10) >= 3) {
    const err = new Error('You can link a maximum of 3 trusted friends.');
    err.status = 400;
    throw err;
  }

  // Get requester info
  const requesterRes = await pool.query(
    `SELECT id, full_name, matric_number FROM users WHERE id = $1`,
    [studentId]
  );
  const requester = requesterRes.rows[0];

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

  // Check if already linked or requested
  const existRes = await pool.query(
    `SELECT id, status FROM trusted_buddies WHERE student_id = $1 AND buddy_user_id = $2`,
    [studentId, buddyUserId]
  );
  if (existRes.rows.length > 0) {
    const existing = existRes.rows[0];
    if (existing.status === 'pending') {
      const err = new Error(`You have already sent a pending request to ${target.full_name}. Awaiting their authorization.`);
      err.status = 400;
      throw err;
    }
    const err = new Error(`${target.full_name} is already linked in your trusted friends list.`);
    err.status = 400;
    throw err;
  }

  const allergiesStr = Array.isArray(target.allergies) ? target.allergies.join(', ') : target.allergies;

  const { rows } = await pool.query(
    `INSERT INTO trusted_buddies (student_id, buddy_user_id, name, phone, matric_number, blood_group, allergies, notes, status, requested_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $1) RETURNING *`,
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

  // Send real-time notification to the requested friend
  await notificationModel.queue({
    userId: target.id,
    channel: 'push',
    message: `🤝 Emergency Buddy Request: ${requester.full_name} (${requester.matric_number || 'FUHSI Student'}) requested permission to link as your trusted emergency buddy.`
  }).catch(() => {});

  return rows[0];
}

async function respondToRequest({ requestId, studentId, action }) {
  const reqRes = await pool.query(
    `SELECT tb.*, u.full_name AS requester_name, u.id AS requester_id, u.phone AS requester_phone, u.matric_number AS requester_matric
     FROM trusted_buddies tb
     JOIN users u ON u.id = tb.student_id
     WHERE tb.id = $1 AND tb.buddy_user_id = $2 AND tb.status = 'pending'`,
    [requestId, studentId]
  );

  if (reqRes.rows.length === 0) {
    const err = new Error('Pending buddy request not found or already processed.');
    err.status = 404;
    throw err;
  }

  const request = reqRes.rows[0];

  // Fetch approver's name
  const approverRes = await pool.query(`SELECT full_name FROM users WHERE id = $1`, [studentId]);
  const approverName = approverRes.rows[0]?.full_name || 'Your friend';

  if (action === 'accept') {
    const { rows } = await pool.query(
      `UPDATE trusted_buddies SET status = 'accepted' WHERE id = $1 RETURNING *`,
      [requestId]
    );

    // Create reciprocal accepted link so BOTH friends have each other linked
    const reverseCheck = await pool.query(
      `SELECT id FROM trusted_buddies WHERE student_id = $1 AND buddy_user_id = $2`,
      [studentId, request.student_id]
    );
    if (reverseCheck.rows.length === 0) {
      // Get requester's clinical profile
      const reqProfRes = await pool.query(
        `SELECT sp.blood_group, sp.allergies, sp.genotype, sp.department
         FROM student_profiles sp WHERE sp.student_id = $1`,
        [request.student_id]
      );
      const rp = reqProfRes.rows[0] || {};
      const rawAllergies = rp.allergies;
      const allergiesStr = Array.isArray(rawAllergies) ? rawAllergies.join(', ') : rawAllergies;

      await pool.query(
        `INSERT INTO trusted_buddies (student_id, buddy_user_id, name, phone, matric_number, blood_group, allergies, notes, status, requested_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'accepted', $9)`,
        [
          studentId,
          request.student_id,
          request.requester_name,
          request.requester_phone || 'N/A',
          request.requester_matric,
          rp.blood_group || null,
          allergiesStr || null,
          'Mutual Emergency Link',
          request.requested_by
        ]
      );
    }

    // Notify requester
    await notificationModel.queue({
      userId: request.requester_id,
      channel: 'push',
      message: `✅ Emergency Buddy Approved: ${approverName} accepted your buddy request! You can now protect each other in emergencies.`
    }).catch(() => {});

    return { status: 'accepted', buddy: rows[0] };
  } else {
    // Decline
    await pool.query(
      `DELETE FROM trusted_buddies WHERE id = $1`,
      [requestId]
    );

    // Notify requester
    await notificationModel.queue({
      userId: request.requester_id,
      channel: 'push',
      message: `❌ Emergency Buddy Update: ${approverName} declined your buddy link request.`
    }).catch(() => {});

    return { status: 'declined' };
  }
}

async function deleteForStudent(id, studentId) {
  const rowRes = await pool.query(
    `SELECT * FROM trusted_buddies WHERE id = $1 AND (student_id = $2 OR buddy_user_id = $2)`,
    [id, studentId]
  );
  if (rowRes.rows.length === 0) return null;
  const target = rowRes.rows[0];

  if (target.buddy_user_id) {
    await pool.query(
      `DELETE FROM trusted_buddies 
       WHERE (student_id = $1 AND buddy_user_id = $2)
          OR (student_id = $2 AND buddy_user_id = $1)
          OR id = $3`,
      [target.student_id, target.buddy_user_id, id]
    );
  } else {
    await pool.query(`DELETE FROM trusted_buddies WHERE id = $1`, [id]);
  }
  return target;
}

module.exports = {
  listForStudent,
  listIncomingRequests,
  lookupStudentAccount,
  createBuddyRequest,
  respondToRequest,
  deleteForStudent
};
