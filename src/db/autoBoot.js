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

    // Check if facilities exist
    const facCheck = await pool.query('SELECT count(*) FROM facilities;');
    if (parseInt(facCheck.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding campus facilities...');
      await pool.query(`
        INSERT INTO facilities (name, facility_type, latitude, longitude, address, phone, is_active)
        VALUES 
          ('FUHSI Health & Medical Centre', 'Main Clinic / Emergency Ward', 8.0194, 4.9042, 'Main Campus Gate 1, Ila-Orangun', '+234 800 384 7437', true),
          ('Campus Dispensary Unit 1', 'Dispensary / Outpatient Triage', 8.0182, 4.9031, 'Hostel Complex B, Ila-Orangun', '+234 802 111 2233', true),
          ('Ila-Orangun General Hospital', 'Tertiary Trauma Referral', 8.0150, 4.8980, 'Ila-Orangun Town Bypass', '+234 803 999 8877', true)
        ON CONFLICT DO NOTHING;
      `);

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
