require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function seed() {
  console.log('Starting database seeding...');
  
  try {
    // Read and run schema.sql
    console.log('Reading schema.sql...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Running schema queries...');
    await pool.query(schemaSql);
    console.log('Schema created successfully.');

    // Encrypt default password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('Password123', saltRounds);

    // Insert Users
    console.log('Inserting users...');
    const userInsertResult = await pool.query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES 
        ('Business Owner', 'owner@orderpilot.ai', $1, 'owner'),
        ('Ravi Kumar', 'partner@orderpilot.ai', $1, 'delivery_partner'),
        ('Suresh Reddy', 'suresh@orderpilot.ai', $1, 'delivery_partner'),
        ('Vikram Singh', 'vikram@orderpilot.ai', $1, 'delivery_partner')
      RETURNING id, name, role;
    `, [passwordHash]);

    const users = userInsertResult.rows;
    const partnerRavi = users.find(u => u.name === 'Ravi Kumar');
    const partnerSuresh = users.find(u => u.name === 'Suresh Reddy');
    const partnerVikram = users.find(u => u.name === 'Vikram Singh');

    console.log(`Users created. Ravi ID: ${partnerRavi?.id}, Suresh ID: ${partnerSuresh?.id}`);

    // Insert Orders
    console.log('Inserting orders...');
    
    // ORD-1024
    const timeline1024 = JSON.stringify([
      { time: '2026-08-03T10:30:00.000Z', event: 'Order placed', status: 'completed' },
      { time: '2026-08-03T11:00:00.000Z', event: 'Payment confirmed', status: 'completed' },
      { time: '2026-08-03T14:00:00.000Z', event: 'Order packed at warehouse', status: 'completed' },
      { time: '2026-08-04T08:00:00.000Z', event: 'Picked up by delivery partner', status: 'completed' },
      { time: '2026-08-04T16:00:00.000Z', event: 'Delivery attempted — customer unavailable', status: 'issue' },
      { time: '2026-08-05T09:00:00.000Z', event: 'Re-scheduled for delivery today', status: 'in-progress' },
      { time: null, event: 'Out for delivery', status: 'pending' },
      { time: null, event: 'Delivered', status: 'pending' }
    ]);

    await pool.query(`
      INSERT INTO orders (id, customer, address, items, status, priority, partner_id, estimated_delivery, original_estimate, placed_at, amount, timeline, customer_update)
      VALUES 
        ('ORD-1024', 'Priya Sharma', '42, MG Road, Indiranagar, Bangalore', '["Wireless Earbuds", "Phone Case"]', 'delayed', 'high', $1, '2026-08-05', '2026-08-04', '2026-08-03T10:30:00Z', 2499.00, $2, 'Your order was delayed due to a failed delivery attempt yesterday. It has been re-scheduled and is expected to arrive today by 6 PM.'),
        ('ORD-1023', 'Amit Patel', '15, Jubilee Hills, Hyderabad', '["Running Shoes"]', 'delivered', 'normal', $3, '2026-08-04', '2026-08-04', '2026-08-02T09:15:00Z', 3999.00, '[]', NULL),
        ('ORD-1022', 'Neha Gupta', '88, Connaught Place, New Delhi', '["Yoga Mat", "Water Bottle", "Resistance Bands"]', 'in-transit', 'normal', $4, '2026-08-06', '2026-08-06', '2026-08-04T16:45:00Z', 1849.00, '[]', NULL),
        ('ORD-1021', 'Rajesh Iyer', '7, Anna Nagar, Chennai', '["Bluetooth Speaker"]', 'delayed', 'high', $5, '2026-08-05', '2026-08-03', '2026-08-01T12:00:00Z', 4599.00, '[]', NULL),
        ('ORD-1020', 'Ananya Roy', '23, Park Street, Kolkata', '["Desk Lamp", "Notebook Set"]', 'processing', 'normal', NULL, '2026-08-07', '2026-08-07', '2026-08-05T08:20:00Z', 1299.00, '[]', NULL)
    `, [partnerRavi?.id, timeline1024, partnerSuresh?.id, partnerVikram?.id, partnerRavi?.id]);

    console.log('Orders inserted successfully.');

    // Insert Complaints
    console.log('Inserting complaints...');
    await pool.query(`
      INSERT INTO complaints (id, order_id, customer, issue_type, message, status, urgency, ai_summary, ai_suggestion, created_at)
      VALUES 
        ('CMP-301', 'ORD-1024', 'Priya Sharma', 'Delivery Delay', 'My order was supposed to arrive yesterday but it still hasn''t been delivered. I need it urgently for a gift.', 'open', 'high', 'Customer frustrated about missed delivery window. Order ORD-1024 had a failed attempt due to customer unavailability. Re-delivery scheduled for today.', 'Send apology with updated ETA. Offer 10% discount on next order. Prioritize re-delivery.', '2026-08-05T10:00:00Z'),
        ('CMP-300', 'ORD-1021', 'Rajesh Iyer', 'Wrong Item', 'I received a different color than what I ordered. I ordered black but got grey.', 'in-progress', 'medium', 'Color mismatch complaint. Customer ordered black Bluetooth Speaker but received grey variant. Warehouse packing error likely.', 'Initiate return pickup and send correct item. Escalate to warehouse QC team.', '2026-08-04T15:30:00Z')
    `);

    console.log('Complaints inserted successfully.');

    // Insert Tasks
    console.log('Inserting tasks...');
    await pool.query(`
      INSERT INTO tasks (id, order_id, partner_id, status, priority, scheduled_time, notes)
      VALUES 
        ('TASK-101', 'ORD-1024', $1, 'in-progress', 'high', '2026-08-05T14:00:00Z', 'Re-delivery attempt. Customer confirmed availability between 2-6 PM.'),
        ('TASK-102', 'ORD-1022', $2, 'pending', 'normal', '2026-08-06T10:00:00Z', 'Standard delivery. No special instructions.')
    `, [partnerRavi?.id, partnerVikram?.id]);

    console.log('Tasks inserted successfully.');

    // Insert Notifications (Urgent Issues mapping)
    console.log('Inserting notifications...');
    await pool.query(`
      INSERT INTO notifications (title, type, severity)
      VALUES 
        ('ORD-1024 delivery failed — re-delivery needed today', 'delivery', 'critical'),
        ('Customer complaint: Rajesh Iyer — wrong item delivered', 'complaint', 'high')
    `);

    console.log('Notifications inserted successfully.');

    // Insert AI Activity Logs
    console.log('Inserting AI Activity Logs...');
    await pool.query(`
      INSERT INTO ai_activity_logs (id, action, type, timestamp, related_to)
      VALUES 
        ('AI-001', 'Auto-replied to Priya Sharma with updated delivery ETA and apology message.', 'auto-reply', '2026-08-05T10:05:00Z', 'CMP-301'),
        ('AI-002', 'Flagged ORD-1021 as high priority and reassigned to nearest available partner.', 'escalation', '2026-08-05T09:30:00Z', 'ORD-1021')
    `);

    console.log('AI Activity Logs inserted successfully.');

    console.log('Database seeding finished successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

seed();
