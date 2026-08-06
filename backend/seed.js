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
    const owner = users.find(u => u.role === 'owner');
    const partnerRavi = users.find(u => u.name === 'Ravi Kumar');
    const partnerSuresh = users.find(u => u.name === 'Suresh Reddy');

    console.log('Seeding orders...');
    await pool.query(`
      INSERT INTO orders (id, order_number, customer_id, delivery_partner_id, status, estimated_delivery, current_location, items, amount)
      VALUES 
        ('ORD-1024', 'ORD-1024', $1, $2, 'delayed', '2026-08-05', 'Indiranagar Hub, Bangalore', '["Wireless Earbuds", "Phone Case"]', 2499.00),
        ('ORD-1023', 'ORD-1023', $1, $3, 'delivered', '2026-08-04', 'Delivered at Doorstep', '["Running Shoes"]', 3999.00),
        ('ORD-1022', 'ORD-1022', $1, $2, 'in-transit', '2026-08-06', 'MG Road Express Transit', '["Yoga Mat", "Water Bottle"]', 1849.00)
    `, [customer?.id, partnerRavi?.id, partnerSuresh?.id]);

    console.log('Seeding complaints...');
    await pool.query(`
      INSERT INTO complaints (id, order_id, customer_id, complaint_text, category, urgency, sentiment, ai_summary, status)
      VALUES 
        ('CMP-301', 'ORD-1024', $1, 'My order was supposed to arrive yesterday but it still hasn''t been delivered. I need it urgently for a gift.', 'Delivery Delay', 'critical', 'frustrated', 'Customer experienced delivery failure due to missed SLA window.', 'open')
    `, [customer?.id]);

    console.log('Seeding AI decisions...');
    await pool.query(`
      INSERT INTO ai_decisions (id, complaint_id, agent_name, reasoning, action_taken, confidence)
      VALUES 
        ('AID-101', 'CMP-301', 'ComplaintAnalysisAgent', 'Detected severe delay on high priority order for customer gift requirement.', 'Categorized as Delivery Delay with Frustrated sentiment.', 0.98),
        ('AID-102', 'CMP-301', 'PriorityAgent', 'Delivery window elapsed >24 hours with negative sentiment.', 'Assigned CRITICAL urgency level.', 0.95),
        ('AID-103', 'CMP-301', 'PlanningAgent', 'Order requires immediate re-route and partner priority contact.', 'Generated 4-step dispatch execution plan.', 0.92)
    `);

    console.log('Seeding tasks...');
    await pool.query(`
      INSERT INTO tasks (id, complaint_id, assigned_to, priority, description, due_time, completed)
      VALUES 
        ('TASK-101', 'CMP-301', $1, 'critical', 'Prioritize re-delivery attempt of ORD-1024 to Indiranagar address before 6 PM today.', '2026-08-05T18:00:00Z', false)
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
        ('SYSTEM_INITIALIZATION', 'System', '{"message": "Database seeded with initial enterprise records."}'),
        ('AI_PIPELINE_EXECUTION', 'AI Workflow Orchestrator', '{"complaintId": "CMP-301", "status": "executed"}')
    `);

    console.log('Database seeding finished successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

seed();
