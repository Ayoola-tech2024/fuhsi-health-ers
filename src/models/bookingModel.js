const { pool } = require('../config/db');

// Create a booking appointment for the authenticated student
async function create({ studentId, physician, appointmentSlot, notes }) {
  const { rows } = await pool.query(
    `INSERT INTO bookings (student_id, physician, appointment_slot, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [studentId, physician, appointmentSlot, notes || null]
  );
  return rows[0];
}

// List all bookings for a given student
async function listForStudent(studentId) {
  const { rows } = await pool.query(
    `SELECT b.*, u.full_name AS student_name
     FROM bookings b
     JOIN users u ON u.id = b.student_id
     WHERE b.student_id = $1
     ORDER BY b.created_at DESC`,
    [studentId]
  );
  return rows;
}

// Get all responders (role='responder') for the volunteers modal
async function listResponders() {
  const { rows } = await pool.query(
    `SELECT id, full_name, phone, staff_id, role
     FROM users
     WHERE role = 'responder' AND is_active = TRUE
     ORDER BY full_name ASC`
  );
  return rows;
}

module.exports = { create, listForStudent, listResponders };
