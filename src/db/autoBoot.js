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
    console.log('✅ Database schema verified / migrated successfully.');

    // Seed/Update Comprehensive Health Facilities
    console.log('🌱 Verifying active health & emergency facilities...');
    const facilitiesList = [
      // Ila-Orangun (FUHSI Campus & Town)
      ['FUHSI Health & Medical Centre', 'Main Clinic / Emergency Ward', 8.0194, 4.9042, 'Main Campus Gate 1, Ila-Orangun', '+234 800 384 7437'],
      ['Campus Dispensary Unit 1', 'Dispensary / Outpatient Triage', 8.0182, 4.9031, 'Hostel Complex B, Ila-Orangun', '+234 802 111 2233'],
      ['Ila-Orangun General Hospital', 'Tertiary Trauma Referral', 8.0150, 4.8980, 'Ila-Orangun Town Bypass', '+234 803 999 8877'],
      
      // Ado-Ekiti (Regional Partner Hospitals & Teaching Centers)
      ['Ekiti State University Teaching Hospital (EKSUTH)', 'State Teaching Hospital / Trauma Centre', 7.6401, 5.2345, 'Teaching Hospital Road, Ado-Ekiti', '+234 803 400 1122'],
      ['Federal Teaching Hospital (FTHI) - Ado Referral Centre', 'Federal Tertiary Referral', 7.6180, 5.2210, 'Adebayo Area, Ado-Ekiti', '+234 803 555 8899'],
      ['State Specialist Hospital Ado-Ekiti', 'Emergency Specialist Hospital', 7.6255, 5.2155, 'Hospital Road, Ado-Ekiti', '+234 802 333 4455'],
      ['Afe Babalola University Multi-System Hospital (ABUAD)', 'Multi-System Tertiary Care', 7.5992, 5.3021, 'ABUAD Campus, Ado-Ekiti', '+234 808 777 6655'],

      // Osogbo & Regional Centers
      ['UNIOSUN Teaching Hospital (UTH)', 'State University Teaching Hospital', 7.7827, 4.5418, 'Idi-Seke, Osogbo', '+234 803 111 9900'],
      ['State Hospital Asubiaro, Osogbo', 'General Hospital / Trauma Ward', 7.7690, 4.5620, 'Asubiaro, Osogbo', '+234 805 222 3344'],
      ['Federal Medical Centre Annex Offa', 'Federal Medical Centre', 8.1492, 4.7198, 'Offa-Ila Road, Offa', '+234 803 666 7788'],
      ['General Hospital Ikole-Ekiti', 'District General Hospital', 7.7981, 5.5122, 'Ikole-Oye Expressway, Ikole', '+234 802 888 9911']
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
