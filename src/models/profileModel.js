const { pool } = require('../config/db');

async function getProfile(studentId) {
  const { rows } = await pool.query(
    `SELECT * FROM student_profiles WHERE student_id = $1`,
    [studentId]
  );
  return rows[0] || null;
}

// Upserts the student's self-owned profile fields.
async function upsertProfile(studentId, fields) {
  const {
    dateOfBirth = null,
    gender = null,
    department = null,
    hostelOrAddress = null,
    bloodGroup = null,
    genotype = null,
    allergies = null,
    currentMedications = null,
    chronicConditions = null,
    selfReportedNotes = null,
  } = fields;

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
      studentId, dateOfBirth, gender, department, hostelOrAddress,
      bloodGroup, genotype, allergies, currentMedications, chronicConditions,
      selfReportedNotes,
    ]
  );
  return rows[0];
}

module.exports = { getProfile, upsertProfile };
