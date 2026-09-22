const { pool } = require('../config/db');

function toArray(val) {
  if (!val) return null;
  if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
  if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
  return null;
}

async function getProfile(studentId) {
  const { rows } = await pool.query(
    `SELECT * FROM student_profiles WHERE student_id = $1`,
    [studentId]
  );
  return rows[0] || null;
}

async function getStudentWithProfile(identifier) {
  const { rows } = await pool.query(
    `SELECT u.id, u.full_name, u.matric_number, u.email, u.phone, u.role,
            sp.blood_group, sp.genotype, sp.allergies, sp.chronic_conditions,
            sp.current_medications, sp.department, sp.hostel_or_address,
            sp.self_reported_notes
     FROM users u
     LEFT JOIN student_profiles sp ON sp.student_id = u.id
     WHERE u.id::text = $1 OR u.matric_number ILIKE $1 OR u.email ILIKE $1`,
    [identifier.trim()]
  );
  return rows[0] || null;
}

// Upserts the student's self-owned profile fields (supports both camelCase & snake_case).
async function upsertProfile(studentId, fields) {
  const dateOfBirth = fields.dateOfBirth || fields.date_of_birth || null;
  const gender = fields.gender || null;
  const department = fields.department || null;
  const hostelOrAddress = fields.hostelOrAddress || fields.hostel_or_address || null;
  const bloodGroup = fields.bloodGroup || fields.blood_group || null;
  const genotype = fields.genotype || null;
  const allergies = toArray(fields.allergies);
  const currentMedications = toArray(fields.currentMedications || fields.current_medications);
  const chronicConditions = toArray(fields.chronicConditions || fields.chronic_conditions);
  const selfReportedNotes = fields.selfReportedNotes || fields.self_reported_notes || null;

  const { rows } = await pool.query(
    `INSERT INTO student_profiles (
        student_id, date_of_birth, gender, department, hostel_or_address,
        blood_group, genotype, allergies, current_medications, chronic_conditions,
        self_reported_notes, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now())
     ON CONFLICT (student_id) DO UPDATE SET
        date_of_birth = COALESCE(EXCLUDED.date_of_birth, student_profiles.date_of_birth),
        gender = COALESCE(EXCLUDED.gender, student_profiles.gender),
        department = COALESCE(EXCLUDED.department, student_profiles.department),
        hostel_or_address = COALESCE(EXCLUDED.hostel_or_address, student_profiles.hostel_or_address),
        blood_group = COALESCE(EXCLUDED.blood_group, student_profiles.blood_group),
        genotype = COALESCE(EXCLUDED.genotype, student_profiles.genotype),
        allergies = COALESCE(EXCLUDED.allergies, student_profiles.allergies),
        current_medications = COALESCE(EXCLUDED.current_medications, student_profiles.current_medications),
        chronic_conditions = COALESCE(EXCLUDED.chronic_conditions, student_profiles.chronic_conditions),
        self_reported_notes = COALESCE(EXCLUDED.self_reported_notes, student_profiles.self_reported_notes),
        updated_at = now()
     RETURNING *`,
    [
      studentId,
      dateOfBirth,
      gender,
      department,
      hostelOrAddress,
      bloodGroup,
      genotype,
      allergies,
      currentMedications,
      chronicConditions,
      selfReportedNotes,
    ]
  );
  return rows[0];
}

module.exports = { getProfile, getStudentWithProfile, upsertProfile };
