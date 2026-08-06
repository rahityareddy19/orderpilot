require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function seed() {
  console.log('Starting enterprise database seeding...');
  
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Deploying schema SQL...');
    await pool.query(schemaSql);
    console.log('Schema tables created successfully.');

    // Encrypt default password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('Password123', saltRounds);

    // Insert Users for all roles
    console.log('Seeding users...');
    const userRes = await pool.query(`
      INSERT INTO users (name, email, password, role)
      VALUES 
        ('Priya Customer', 'customer@orderpilot.ai', $1, 'customer'),
        ('Business Owner', 'owner@orderpilot.ai', $1, 'owner'),
        ('Ravi Kumar', 'partner@orderpilot.ai', $1, 'delivery_partner'),
        ('Suresh Reddy', 'suresh@orderpilot.ai', $1, 'delivery_partner')
      RETURNING id, name, email, role;
    `, [passwordHash]);

    const users = userRes.rows;
    const customer = users.find(u => u.role === 'customer');
    const partnerRavi = users.find(u => u.name === 'Ravi Kumar');
    const partnerSuresh = users.find(u => u.name === 'Suresh Reddy');

    console.log('Seeding orders...');
    await pool.query(`
      INSERT INTO orders (
        id, order_number, customer, customer_id, partner_id, delivery_partner_id, address, status, priority, estimated_delivery, current_location, items, amount, timeline
      )
      VALUES 
        ('ORD-1024', 'ORD-1024', 'Priya Customer', $1, $2, $2, '12, 100ft Road, Indiranagar, Bangalore', 'delayed', 'critical', '2026-08-05', 'Indiranagar Hub, Bangalore', '["Wireless Earbuds", "Phone Case"]', 2499.00, '[{"time": "2026-08-05T10:00:00Z", "event": "Order placed", "status": "completed"}, {"time": "2026-08-05T14:30:00Z", "event": "Delayed at Indiranagar Hub", "status": "issue"}]'),
        ('ORD-1023', 'ORD-1023', 'Priya Customer', $1, $3, $3, '45, MG Road, Bangalore', 'delivered', 'normal', '2026-08-04', 'Delivered at Doorstep', '["Running Shoes"]', 3999.00, '[{"time": "2026-08-04T09:00:00Z", "event": "Order placed", "status": "completed"}, {"time": "2026-08-04T16:00:00Z", "event": "Delivered successfully", "status": "completed"}]'),
        ('ORD-1022', 'ORD-1022', 'Priya Customer', $1, $2, $2, '78, Koramangala 4th Block, Bangalore', 'in-transit', 'normal', '2026-08-06', 'MG Road Express Transit', '["Yoga Mat", "Water Bottle"]', 1849.00, '[{"time": "2026-08-06T08:00:00Z", "event": "Order dispatched", "status": "in-progress"}]')
    `, [customer?.id, partnerRavi?.id, partnerSuresh?.id]);

    console.log('Seeding complaints...');
    await pool.query(`
      INSERT INTO complaints (
        id, order_id, customer, customer_id, complaint_text, message, category, issue_type, urgency, sentiment, ai_summary, ai_suggestion, requires_approval, approved, status
      )
      VALUES 
        ('CMP-301', 'ORD-1024', 'Priya Customer', $1, 'My order was supposed to arrive yesterday but it still hasn''t been delivered. I need it urgently for a gift.', 'My order was supposed to arrive yesterday but it still hasn''t been delivered. I need it urgently for a gift.', 'Delivery Delay', 'Delivery Delay', 'critical', 'frustrated', 'Customer experienced delivery failure due to missed SLA window.', 'Contact delivery partner Ravi Kumar and re-dispatch order before 6 PM today.', true, false, 'open')
    `, [customer?.id]);

    console.log('Seeding tasks...');
    await pool.query(`
      INSERT INTO tasks (id, complaint_id, order_id, assigned_to, partner_id, priority, description, notes, due_time, scheduled_time, completed, status)
      VALUES 
        ('TASK-101', 'CMP-301', 'ORD-1024', $1, $1, 'critical', 'Prioritize re-delivery attempt of ORD-1024 to Indiranagar address before 6 PM today.', 'Prioritize re-delivery attempt of ORD-1024 to Indiranagar address before 6 PM today.', '2026-08-05T18:00:00Z', '2026-08-05T18:00:00Z', false, 'pending')
    `, [partnerRavi?.id]);

    console.log('Seeding notifications...');
    await pool.query(`
      INSERT INTO notifications (receiver, message, type, read)
      VALUES 
        ('owner@orderpilot.ai', 'Critical complaint filed for ORD-1024: Delivery Delay', 'complaint', false),
        ('partner@orderpilot.ai', 'New critical task assigned for order ORD-1024', 'delivery', false),
        ('customer@orderpilot.ai', 'OrderPilot AI has updated your order resolution timeline for ORD-1024', 'info', true)
    `);

    console.log('Seeding activity logs...');
    await pool.query(`
      INSERT INTO activity_logs (action, performed_by, details)
      VALUES 
        ('SYSTEM_INITIALIZATION', 'System', '{"message": "Database seeded with initial enterprise records."}')
    `);

    console.log('Database seeding finished successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

seed();
