const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool, isMemoryFallback } = require('../config/db');

async function autoBootDb() {
  console.log('🔄 Checking database tables and running auto-migration...');
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    let sql = fs.readFileSync(schemaPath, 'utf8');

    if (isMemoryFallback) {
      // Strip procedural blocks that pg-mem doesn't need
      sql = sql.replace(/CREATE EXTENSION[^\n]+;/g, '')
               .replace(/DO \$\$[\s\S]*?\$\$[\s\S]*?;/g, '');
    }

    await pool.query(sql);

    // Apply incremental migrations for Proxy SOS & Trusted Friends
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trusted_buddies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        matric_number TEXT,
        blood_group TEXT,
        allergies TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      ALTER TABLE incidents ADD COLUMN IF NOT EXISTS is_proxy_sos BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE incidents ADD COLUMN IF NOT EXISTS patient_name TEXT;
      ALTER TABLE incidents ADD COLUMN IF NOT EXISTS patient_matric_number TEXT;
      ALTER TABLE incidents ADD COLUMN IF NOT EXISTS patient_phone TEXT;
      ALTER TABLE incidents ADD COLUMN IF NOT EXISTS patient_blood_group TEXT;
      ALTER TABLE incidents ADD COLUMN IF NOT EXISTS patient_allergies TEXT;
      ALTER TABLE incidents ADD COLUMN IF NOT EXISTS patient_notes TEXT;
    `);

    console.log('✅ Database schema verified / migrated successfully.');

    // Seed/Update Comprehensive Health Facilities
    console.log('🌱 Verifying active health & emergency facilities...');
    const facilitiesList = [
      // Ila-Orangun (FUHSI Campus & Town)
      ['FUHSI Health & Medical Centre', 'Main Clinic / Emergency Ward', 8.0194, 4.9042, 'Main Campus Gate 1, Ila-Orangun', '+234 800 384 7437'],
      ['Campus Dispensary Unit 1', 'Dispensary / Outpatient Triage', 8.0182, 4.9031, 'Hostel Complex B, Ila-Orangun', '+234 802 111 2233'],
      ['Ila-Orangun General Hospital', 'Tertiary Trauma Referral', 8.0150, 4.8980, 'Ila-Orangun Town Bypass', '+234 803 999 8877'],
      
      // Ado-Ekiti & Ekiti Region
      ['Ekiti State University Teaching Hospital (EKSUTH)', 'State Teaching Hospital / Trauma Centre', 7.6401, 5.2345, 'Teaching Hospital Road, Ado-Ekiti', '+234 803 400 1122'],
      ['Federal Teaching Hospital (FTHI) - Ado Referral Centre', 'Federal Tertiary Referral', 7.6180, 5.2210, 'Adebayo Area, Ado-Ekiti', '+234 803 555 8899'],
      ['State Specialist Hospital Ado-Ekiti', 'Emergency Specialist Hospital', 7.6255, 5.2155, 'Hospital Road, Ado-Ekiti', '+234 802 333 4455'],
      ['Afe Babalola University Multi-System Hospital (ABUAD)', 'Multi-System Tertiary Care', 7.5992, 5.3021, 'ABUAD Campus, Ado-Ekiti', '+234 808 777 6655'],
      ['General Hospital Ikole-Ekiti', 'District General Hospital', 7.7981, 5.5122, 'Ikole-Oye Expressway, Ikole', '+234 802 888 9911'],

      // Osogbo, Ile-Ife & Osun Region
      ['UNIOSUN Teaching Hospital (UTH)', 'State University Teaching Hospital', 7.7827, 4.5418, 'Idi-Seke, Osogbo', '+234 803 111 9900'],
      ['State Hospital Asubiaro, Osogbo', 'General Hospital / Trauma Ward', 7.7690, 4.5620, 'Asubiaro, Osogbo', '+234 805 222 3344'],
      ['Obafemi Awolowo University Teaching Hospitals Complex (OAUTHC)', 'Federal Teaching Hospital / Trauma Hub', 7.5140, 4.5290, 'OAUTHC Complex, Ile-Ife', '+234 803 333 7711'],

      // Kwara State (Ilorin & Offa)
      ['University of Ilorin Teaching Hospital (UITH)', 'Federal University Teaching Hospital', 8.4833, 4.5500, 'UITH Permanent Site, Ilorin', '+234 803 777 4411'],
      ['Federal Medical Centre Annex Offa', 'Federal Medical Centre', 8.1492, 4.7198, 'Offa-Ila Road, Offa', '+234 803 666 7788'],
      ['General Hospital Ilorin', 'State Specialist & Trauma Centre', 8.4950, 4.5420, 'Hospital Road, Ilorin', '+234 802 666 5544'],

      // Lagos State Metropolis
      ['Lagos University Teaching Hospital (LUTH)', 'Federal Teaching Hospital / Level 1 Trauma', 6.5201, 3.3578, 'Ishaga Road, Idi-Araba, Surulere, Lagos', '+234 803 200 4455'],
      ['Lagos State University Teaching Hospital (LASUTH)', 'State Teaching Hospital / Emergency Centre', 6.5962, 3.3458, '1-5 Oba Akinjobi Way, Ikeja, Lagos', '+234 802 444 3322'],
      ['Federal Medical Centre Ebute Metta', 'Federal Medical Centre / Emergency Trauma', 6.4912, 3.3820, 'Railway Compound, Ebute Metta, Lagos', '+234 803 888 1122'],
      ['General Hospital Lagos Island', 'Emergency General Hospital', 6.4520, 3.3950, 'Broad Street, Marina, Lagos Island', '+234 802 777 8899'],

      // Oyo State (Ibadan)
      ['University College Hospital (UCH) Ibadan', 'Premier Tertiary Teaching Hospital & Trauma', 7.4022, 3.9064, 'Queen Elizabeth II Road, Mokola, Ibadan', '+234 803 555 1100'],
      ['Adeoyo Maternity Teaching Hospital', 'Teaching Hospital / Specialist Care', 7.3910, 3.8990, 'Yemetu, Ibadan', '+234 802 555 4433'],

      // FCT Abuja & Northern Hubs
      ['National Hospital Abuja', 'Apex Federal Trauma & Referral Hospital', 9.0430, 7.4645, 'Plot 132 Central Business District, Abuja', '+234 803 900 1100'],
      ['University of Abuja Teaching Hospital (UATH)', 'Federal Teaching Hospital', 8.9482, 7.0864, 'Gwagwalada Expressway, Gwagwalada, Abuja', '+234 803 700 8899'],
      ['Federal Medical Centre Jabi', 'Federal Medical Centre', 9.0725, 7.4230, 'Jabi District, Abuja', '+234 802 999 1100'],

      // Ondo State (Akure & Ondo Town) & Edo
      ['State Specialist Hospital Akure', 'State Specialist & Emergency Trauma Centre', 7.2520, 5.1980, 'Hospital Road, Akure, Ondo State', '+234 802 333 4455'],
      ['Mother and Child Hospital Akure', 'Specialist Emergency Hospital', 7.2560, 5.2010, 'Oda Road, Akure, Ondo State', '+234 803 777 8899'],
      ['University of Medical Sciences Teaching Hospital (UNIMEDTH)', 'Specialist Medical Teaching Hospital', 7.0910, 4.8320, 'Laje Road, Ondo Town', '+234 803 444 9988'],
      ['Federal Medical Centre Owo', 'Federal Tertiary Referral Hospital', 7.1950, 5.5840, 'Owo-Akure Highway, Owo', '+234 803 555 6677'],
      ['University of Benin Teaching Hospital (UBTH)', 'Federal Tertiary Teaching Hospital', 6.3980, 5.6150, 'Ugbowo Lagos-Benin Expressway, Benin City', '+234 803 333 1199'],

      // Rivers & South-East Hubs
      ['University of Port Harcourt Teaching Hospital (UPTH)', 'Federal Tertiary Referral & Trauma', 4.9020, 6.9240, 'East-West Road, Port Harcourt', '+234 803 666 2200'],
      ['University of Nigeria Teaching Hospital (UNTH)', 'Federal Teaching Hospital', 6.4250, 7.5020, 'Ituku-Ozalla, Enugu', '+234 803 888 7744']
    ];

    for (const fac of facilitiesList) {
      const existing = await pool.query('SELECT id FROM facilities WHERE name = $1 LIMIT 1', [fac[0]]);
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO facilities (name, facility_type, latitude, longitude, address, phone, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, true)`,
          fac
        );
      }
    }

    // Check demo users
    const userCheck = await pool.query('SELECT count(*) FROM users;');
    if (parseInt(userCheck.rows[0].count, 10) === 0) {
      const passwordHash = await bcrypt.hash('password123', 10);
      const demoUsers = [
        ['student@fuhsi.edu.ng', passwordHash, 'FUHSI Student', '+234 803 123 4567', 'student', 'FUHSI/2023/MBBS/0142', null],
        ['doctor@fuhsi.edu.ng', passwordHash, 'Dr. Medical Officer', '+234 802 987 6543', 'clinician', null, 'DOC-FUHSI-088'],
        ['responder@fuhsi.edu.ng', passwordHash, 'Officer Responder', '+234 814 555 0199', 'responder', null, 'EMS-FUHSI-012'],
        ['admin@fuhsi.edu.ng', passwordHash, 'Campus Health Admin', '+234 800 111 0000', 'admin', null, 'ADM-FUHSI-001'],
      ];

      for (const u of demoUsers) {
        await pool.query(
          `INSERT INTO users (email, password_hash, full_name, phone, role, matric_number, staff_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (email) DO NOTHING`,
          u
        );
      }

      console.log('✅ Initial database seed completed.');
    }
  } catch (err) {
    console.error('❌ Auto-migration / seed error:', err.message);
  }
}

module.exports = { autoBootDb };
