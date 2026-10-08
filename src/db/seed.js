require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seed() {
  console.log('🌱 Starting database seed for FUHSI ERS...');

  try {
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Insert Campus and Regional Facilities
    console.log('Inserting campus and regional health facilities...');
    await db.query(`
      INSERT INTO facilities (name, facility_type, latitude, longitude, address, phone, is_active)
      VALUES 
        ('FUHSI Health & Medical Centre', 'Main Clinic / Emergency Ward', 8.0194, 4.9042, 'Main Campus Gate 1, Ila-Orangun', '+234 800 384 7437', true),
        ('Campus Dispensary Unit 1', 'Dispensary / Outpatient Triage', 8.0182, 4.9031, 'Hostel Complex B, Ila-Orangun', '+234 802 111 2233', true),
        ('Ila-Orangun General Hospital', 'Tertiary Trauma Referral', 8.0150, 4.8980, 'Ila-Orangun Town Bypass', '+234 803 999 8877', true),
        ('Ekiti State University Teaching Hospital (EKSUTH)', 'State Teaching Hospital / Trauma Centre', 7.6401, 5.2345, 'Teaching Hospital Road, Ado-Ekiti', '+234 803 400 1122', true),
        ('Federal Teaching Hospital (FTHI) - Ado Referral Centre', 'Federal Tertiary Referral', 7.6180, 5.2210, 'Adebayo Area, Ado-Ekiti', '+234 803 555 8899', true),
        ('State Specialist Hospital Ado-Ekiti', 'Emergency Specialist Hospital', 7.6255, 5.2155, 'Hospital Road, Ado-Ekiti', '+234 802 333 4455', true),
        ('Afe Babalola University Multi-System Hospital (ABUAD)', 'Multi-System Tertiary Care', 7.5992, 5.3021, 'ABUAD Campus, Ado-Ekiti', '+234 808 777 6655', true),
        ('UNIOSUN Teaching Hospital (UTH)', 'State University Teaching Hospital', 7.7827, 4.5418, 'Idi-Seke, Osogbo', '+234 803 111 9900', true),
        ('State Hospital Asubiaro, Osogbo', 'General Hospital / Trauma Ward', 7.7690, 4.5620, 'Asubiaro, Osogbo', '+234 805 222 3344', true),
        ('Federal Medical Centre Annex Offa', 'Federal Medical Centre', 8.1492, 4.7198, 'Offa-Ila Road, Offa', '+234 803 666 7788', true),
        ('General Hospital Ikole-Ekiti', 'District General Hospital', 7.7981, 5.5122, 'Ikole-Oye Expressway, Ikole', '+234 802 888 9911', true)
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
