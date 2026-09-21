require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seed() {
  console.log('🌱 Starting database seed for FUHSI ERS...');

  try {
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Insert Campus Facilities
    console.log('Inserting campus health facilities...');
    await db.query(`
      INSERT INTO facilities (name, facility_type, latitude, longitude, address, phone, is_active)
      VALUES 
        ('FUHSI Health & Medical Centre', 'Main Clinic / Emergency Ward', 8.0194, 4.9042, 'Main Campus Gate 1, Ila-Orangun', '+234 800 384 7437', true),
        ('Campus Dispensary Unit 1', 'Dispensary / Outpatient Triage', 8.0182, 4.9031, 'Hostel Complex B, Ila-Orangun', '+234 802 111 2233', true),
        ('Ila-Orangun General Hospital', 'Tertiary Trauma Referral', 8.0150, 4.8980, 'Ila-Orangun Town Bypass', '+234 803 999 8877', true)
      ON CONFLICT DO NOTHING;
    `);

    // 2. Insert Test Users
    console.log('Inserting test accounts...');
    const userRes = await db.query(`
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
    const clinician = userRes.rows.find(r => r.role === 'clinician');

    if (student) {
      // 3. Insert Student Medical Profile
      console.log('Inserting student medical profile...');
      await db.query(`
        INSERT INTO student_profiles (
          student_id, date_of_birth, gender, department, hostel_or_address, 
          blood_group, genotype, allergies, current_medications, chronic_conditions, self_reported_notes
        )
        VALUES (
          $1, '2003-05-14', 'Male', 'Medicine & Surgery', 'Hall 2, Room 214',
          'O+', 'AA', ARRAY['Penicillin', 'Peanuts'], ARRAY['Salbutamol Inhaler (PRN)'], ARRAY['Mild Asthmatic'],
          'Wears emergency medical alert wristband'
        )
        ON CONFLICT (student_id) DO UPDATE SET
          blood_group = EXCLUDED.blood_group,
          genotype = EXCLUDED.genotype;
      `, [student.id]);

      // 4. Insert Emergency Contacts
      console.log('Inserting emergency contacts...');
      await db.query(`
        INSERT INTO emergency_contacts (student_id, name, relationship, phone, priority)
        VALUES 
          ($1, 'Alhaji Bakare (Father)', 'Parent', '+234 803 555 0101', 1),
          ($1, 'Mrs. Aminat Bakare (Mother)', 'Parent', '+234 802 444 0202', 2);
      `, [student.id]);

      // 5. Insert Clinician-verified entry if doctor exists
      if (clinician) {
        console.log('Inserting clinician verified medical entry & audit log...');
        const entryRes = await db.query(`
          INSERT INTO clinical_entries (
            student_id, entered_by, entry_type, content, verification_status, verified_by, verified_at
          )
          VALUES (
            $1, $2, 'allergy_confirmation',
            '{"allergy": "Penicillin (Severe Anaphylaxis Risk)", "confirmed_by_lab": true}'::jsonb,
            'verified', $2, now()
          )
          RETURNING id;
        `, [student.id, clinician.id]);

        if (entryRes.rows[0]) {
          await db.query(`
            INSERT INTO clinical_entry_audit (clinical_entry_id, actor_id, action, details)
            VALUES ($1, $2, 'verified', '{"note": "Confirmed by university clinic initial matriculation medical board"}'::jsonb);
          `, [entryRes.rows[0].id, clinician.id]);
        }
      }
    }

    console.log('✅ Seed completed successfully!');
    console.log('----------------------------------------------------');
    console.log('Test Accounts (Password for all: password123):');
    console.log('• Student:   student@fuhsi.edu.ng');
    console.log('• Doctor:    doctor@fuhsi.edu.ng');
    console.log('• Responder: responder@fuhsi.edu.ng');
    console.log('• Admin:     admin@fuhsi.edu.ng');
    console.log('----------------------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
