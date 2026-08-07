require('dotenv').config({ path: './backend/.env' });
const { Pool } = require('pg');

async function testSupabase() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    
    const res = await pool.query('SELECT NOW()');
    console.log('Supabase connection successful. Time:', res.rows[0]);
    
    // Check if tables exist
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables:', tablesRes.rows.map(r => r.table_name));
    
    process.exit(0);
  } catch (err) {
    console.error('Supabase connection failed:', err);
    process.exit(1);
  }
}

testSupabase();
