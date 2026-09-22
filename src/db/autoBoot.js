const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function autoBootDb() {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ No DATABASE_URL provided. Skipping auto-migration.');
    return;
  }

  console.log('🔄 Checking database tables and running auto-migration...');
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(sql);
    console.log('✅ Database schema verified / migrated successfully.');

    // Check if facilities exist
    const facCheck = await pool.query('SELECT count(*) FROM facilities;');
    if (parseInt(facCheck.rows[0].count, 10) === 0) {
      console.log('🌱 Empty database detected. Seeding initial campus facilities and demo accounts...');
      
      // 1. Facilities
      await pool.query(`
        INSERT INTO facilities (name, facility_type, latitude, longitude, address, phone, is_active)
        VALUES 
          ('FUHSI Health & Medical Centre', 'Main Clinic / Emergency Ward', 8.0194, 4.9042, 'Main Campus Gate 1, Ila-Orangun', '+234 800 384 7437', true),
          ('Campus Dispensary Unit 1', 'Dispensary / Outpatient Triage', 8.0182, 4.9031, 'Hostel Complex B, Ila-Orangun', '+234 802 111 2233', true),
          ('Ila-Orangun General Hospital', 'Tertiary Trauma Referral', 8.0150, 4.8980, 'Ila-Orangun Town Bypass', '+234 803 999 8877', true)
        ON CONFLICT DO NOTHING;
      `);

      // 2. Demo Users
      const passwordHash = await bcrypt.hash('password123', 10);
      const userRes = await pool.query(`
        INSERT INTO users (email, password_hash, full_name, phone, role, matric_number, staff_id)
        VALUES 
          ('student@fuhsi.edu.ng', $1, 'Adewale Bakare', '+234 803 123 4567', 'student', 'FUHSI/2023/MBBS/0142', NULL),
          ('doctor@fuhsi.edu.ng', $1, 'Dr. Fatima Olamide', '+234 802 987 6543', 'clinician', NULL, 'DOC-FUHSI-088'),
          ('responder@fuhsi.edu.ng', $1, 'Officer John Musa', '+234 814 555 0199', 'responder', NULL, 'EMS-FUHSI-012'),
          ('admin@fuhsi.edu.ng', $1, 'Campus Health Admin', '+234 800 111 0000', 'admin', NULL, 'ADM-FUHSI-001')
        ON CONFLICT (email) DO UPDATE SET password_hash = $1
        RETURNING id, email, role;
      `, [passwordHash]);

      const student = userRes.rows.find(r => r.role === 'student');
      if (student) {
        await pool.query(`
          INSERT INTO student_profiles (
            student_id, date_of_birth, gender, department, hostel_or_address, 
            blood_group, genotype, allergies, current_medications, chronic_conditions, self_reported_notes
          )
          VALUES (
            $1, '2003-05-14', 'Male', 'Medicine & Surgery', 'Hall 2, Room 214',
            'O+', 'AA', ARRAY['Penicillin', 'Peanuts'], ARRAY['Salbutamol Inhaler (PRN)'], ARRAY['Mild Asthmatic'],
            'Wears emergency medical alert wristband'
          )
          ON CONFLICT (student_id) DO NOTHING;
        `, [student.id]);

        await pool.query(`
          INSERT INTO emergency_contacts (student_id, name, relationship, phone, priority)
          VALUES 
            ($1, 'Alhaji Bakare (Father)', 'Parent', '+234 803 555 0101', 1),
            ($1, 'Mrs. Aminat Bakare (Mother)', 'Parent', '+234 802 444 0202', 2)
          ON CONFLICT DO NOTHING;
        `, [student.id]);
      }
      console.log('✅ Initial database seed completed.');
    }
  } catch (err) {
    console.error('❌ Auto-migration / seed error:', err.message);
  }
}

module.exports = { autoBootDb };
