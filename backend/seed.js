require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

async function seed() {
  console.log('=======================================================');
  console.log(' OrderPilot AI – Enterprise Database Seeding Engine ');
  console.log('=======================================================');
  
  let pool = null;
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && !dbUrl.includes('[YOUR-PASSWORD]')) {
    try {
      pool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });
    } catch (err) {
      console.warn('Could not initialize PostgreSQL pool:', err.message);
    }
  }

  if (pool) {
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      console.log('1. Deploying schema SQL to PostgreSQL...');
      await pool.query(schemaSql);
      console.log('✓ Master PostgreSQL tables created successfully.');

      // Encrypt default password
      const passwordHash = await bcrypt.hash('Password123', 10);

      // Insert Users
      console.log('2. Seeding enterprise users...');
      const userRes = await pool.query(`
        INSERT INTO users (name, email, password, role)
        VALUES 
          ('Priya Customer', 'customer@orderpilot.ai', $1, 'customer'),
          ('Business Owner', 'owner@orderpilot.ai', $1, 'owner'),
          ('Ravi Kumar', 'partner@orderpilot.ai', $1, 'delivery_partner'),
          ('Suresh Reddy', 'suresh@orderpilot.ai', $1, 'delivery_partner'),
          ('Anish Sharma', 'anish@orderpilot.ai', $1, 'delivery_partner')
        RETURNING id, name, email, role;
      `, [passwordHash]);

      const users = userRes.rows;
      const customer = users.find(u => u.role === 'customer');
      const partnerRavi = users.find(u => u.name === 'Ravi Kumar');
      const partnerSuresh = users.find(u => u.name === 'Suresh Reddy');
      const partnerAnish = users.find(u => u.name === 'Anish Sharma');

      // Insert Orders
      console.log('3. Seeding operational orders...');
      await pool.query(`
        INSERT INTO orders (
          id, order_number, customer, customer_id, partner_id, delivery_partner_id, address, status, priority, estimated_delivery, original_estimate, current_location, items, amount, timeline
        )
        VALUES 
          ('ORD-1024', 'ORD-1024', 'Priya Customer', $1, $2, $2, '12, 100ft Road, Indiranagar, Bangalore', 'delayed', 'critical', '2026-08-05', '2026-08-04', 'Indiranagar Regional Hub, Bangalore', '["Wireless Earbuds", "Phone Case"]', 2499.00, '[{"time": "2026-08-05T10:00:00Z", "event": "Order placed", "status": "completed"}, {"time": "2026-08-05T14:30:00Z", "event": "SLA Window Missed - Heavy Traffic Corridor", "status": "issue"}]'),
          ('ORD-1027', 'ORD-1027', 'Kavita Sundaram', $1, $2, $2, '44, Cambridge Layout, Ulsoor, Bangalore', 'in-transit', 'high', '2026-08-06', '2026-08-06', 'Ulsoor Transit Point', '["Smart Fitness Watch Series 5"]', 6999.00, '[{"time": "2026-08-06T07:30:00Z", "event": "Out for express delivery", "status": "in-progress"}]'),
          ('ORD-1025', 'ORD-1025', 'Vikram Sethi', $1, $2, $2, '88, Inner Ring Road, Domlur, Bangalore', 'processing', 'high', '2026-08-06', '2026-08-06', 'Central Sorting Facility', '["Aluminium Laptop Stand", "7-in-1 USB-C Hub"]', 3499.00, '[{"time": "2026-08-06T08:15:00Z", "event": "Order packed", "status": "completed"}]'),
          ('ORD-1022', 'ORD-1022', 'Sneha Verma', $1, $2, $2, '78, Koramangala 4th Block, Bangalore', 'in-transit', 'normal', '2026-08-06', '2026-08-06', 'MG Road Express Transit Hub', '["Yoga Mat", "Steel Water Bottle"]', 1849.00, '[{"time": "2026-08-06T08:00:00Z", "event": "Order dispatched", "status": "in-progress"}]'),
          ('ORD-1029', 'ORD-1029', 'Rohan Deshmukh', $1, $2, $2, '56, Trinity Circle, MG Road, Bangalore', 'processing', 'normal', '2026-08-07', '2026-08-07', 'Central Distribution Warehouse', '["Noise Cancelling Headphones"]', 8999.00, '[{"time": "2026-08-06T09:45:00Z", "event": "Order scheduled for evening dispatch", "status": "completed"}]'),
          ('ORD-1026', 'ORD-1026', 'Meera Iyer', $1, $2, $2, '15, Bellandur Lake Road, Bangalore', 'delivered', 'normal', '2026-08-05', '2026-08-05', 'Delivered at Security Desk', '["Organic Coffee Beans (1kg)"]', 1450.00, '[{"time": "2026-08-05T11:30:00Z", "event": "Delivered successfully", "status": "completed"}]'),
          ('ORD-1028', 'ORD-1028', 'Arjun Menon', $1, $2, $2, '22, Victoria Layout, Bangalore', 'delivered', 'high', '2026-08-05', '2026-08-05', 'Handed Over to Customer', '["GPS Trail Tracker Watch"]', 4500.00, '[{"time": "2026-08-05T15:45:00Z", "event": "Delivered with OTP", "status": "completed"}]')
      `, [customer?.id, partnerRavi?.id, partnerSuresh?.id]);

      // Insert Complaints
      console.log('4. Seeding customer complaints...');
      await pool.query(`
        INSERT INTO complaints (
          id, order_id, customer, customer_id, complaint_text, message, category, issue_type, urgency, sentiment, ai_summary, ai_suggestion, requires_approval, approved, status
        )
        VALUES 
          ('CMP-301', 'ORD-1024', 'Priya Customer', $1, 'My order was supposed to arrive yesterday but it still has not been delivered. I need it urgently for a gift.', 'My order was supposed to arrive yesterday but it still has not been delivered. I need it urgently for a gift.', 'Delivery Delay', 'Delivery Delay', 'critical', 'frustrated', 'Customer experienced delivery failure due to missed SLA window in Indiranagar corridor.', 'Re-assign priority task to partner Ravi Kumar with direct customer dispatch before 6 PM today.', true, false, 'open')
      `, [customer?.id]);

      // Insert Tasks
      console.log('5. Seeding delivery tasks...');
      await pool.query(`
        INSERT INTO tasks (id, complaint_id, order_id, assigned_to, partner_id, priority, description, notes, due_time, scheduled_time, completed, status)
        VALUES 
          ('TASK-101', 'CMP-301', 'ORD-1024', $1, $1, 'critical', 'Prioritize express re-delivery attempt of ORD-1024 to Indiranagar address before 6 PM today.', 'Customer requested urgency for birthday gift. Contact customer before arrival.', '2026-08-05T18:00:00Z', '2026-08-05T18:00:00Z', false, 'in-progress'),
          ('TASK-106', NULL, 'ORD-1027', $1, $1, 'high', 'Express delivery of Smart Fitness Watch (ORD-1027) to Cambridge Layout.', 'Call recipient 15 minutes prior to arrival.', '2026-08-06T18:00:00Z', '2026-08-06T14:00:00Z', false, 'in-progress'),
          ('TASK-104', NULL, 'ORD-1025', $1, $1, 'high', 'Deliver ORD-1025 (Laptop Stand & USB-C Hub) to Domlur Inner Ring Road.', 'Corporate office reception delivery.', '2026-08-06T19:00:00Z', '2026-08-06T15:00:00Z', false, 'pending'),
          ('TASK-102', NULL, 'ORD-1022', $1, $1, 'normal', 'Deliver ORD-1022 (Yoga Mat & Water Bottle) to Koramangala 4th Block.', 'Standard afternoon delivery slot.', '2026-08-06T20:00:00Z', '2026-08-06T16:00:00Z', false, 'pending'),
          ('TASK-107', NULL, 'ORD-1029', $1, $1, 'normal', 'Evening slot dispatch for ORD-1029 (Headphones) to Trinity Circle, MG Road.', 'Customer available after 5 PM.', '2026-08-06T21:00:00Z', '2026-08-06T17:00:00Z', false, 'pending'),
          ('TASK-105', NULL, 'ORD-1026', $1, $1, 'normal', 'Deliver ORD-1026 (Coffee Beans) to Bellandur.', 'Delivered to security desk.', '2026-08-05T12:00:00Z', '2026-08-05T11:00:00Z', true, 'completed'),
          ('TASK-108', NULL, 'ORD-1028', $1, $1, 'high', 'Priority hand-off for ORD-1028 to Victoria Layout.', 'Verified via OTP with customer.', '2026-08-05T16:00:00Z', '2026-08-05T15:00:00Z', true, 'completed')
      `, [partnerRavi?.id]);

      // Insert Activity Logs
      console.log('6. Seeding immutable activity audit trail & AI decisions...');
      await pool.query(`
        INSERT INTO activity_logs (action, performed_by, details)
        VALUES 
          ('AI_ACTION_PLAN_GENERATED', 'PlanningAgent (AI)', '{"complaintId": "CMP-301", "orderId": "ORD-1024", "summary": "Customer experienced delivery failure due to missed SLA window.", "actionPlan": "Contact delivery partner Ravi Kumar and re-dispatch order before 6 PM today."}'),
          ('PRIORITY_EVALUATION_COMPLETED', 'PriorityAgent (AI)', '{"complaintId": "CMP-301", "calculatedUrgency": "critical", "sentiment": "frustrated", "confidence": 0.98}'),
          ('COMPLAINT_ANALYSIS_EXECUTED', 'ComplaintAnalysisAgent (AI)', '{"complaintId": "CMP-301", "category": "Delivery Delay", "issueType": "Delayed SLA"}'),
          ('AUTOMATED_TASK_ASSIGNED', 'TaskAssignmentAgent (AI)', '{"taskId": "TASK-101", "partnerId": 3, "partnerName": "Ravi Kumar", "orderId": "ORD-1024"}'),
          ('CUSTOMER_NOTIFICATION_SENT', 'NotificationAgent (AI)', '{"recipient": "customer@orderpilot.ai", "orderId": "ORD-1024", "channel": "SMS/In-App"}'),
          ('SYSTEM_INITIALIZATION', 'System', '{"message": "OrderPilot AI Enterprise Engine initialized with multi-agent coordination."}')
      `);

      await pool.query(`
        INSERT INTO ai_decisions (id, complaint_id, agent_name, reasoning, action_taken, confidence)
        VALUES 
          ('AID-101', 'CMP-301', 'ComplaintAnalysisAgent', 'Detected severe delivery delay on high priority order for customer birthday requirement.', 'Categorized as Delivery Delay with Frustrated sentiment.', 0.98),
          ('AID-102', 'CMP-301', 'PriorityAgent', 'Delivery window elapsed >24 hours with negative sentiment.', 'Assigned CRITICAL urgency level.', 0.95),
          ('AID-103', 'CMP-301', 'PlanningAgent', 'Order requires immediate re-route and partner priority contact.', 'Generated 4-step dispatch execution plan.', 0.92)
      `);

      console.log('=======================================================');
      console.log('✓ SUCCESS: Database seeded with enterprise demo data!');
      console.log('=======================================================');
    } catch (error) {
      console.warn('PostgreSQL Database connection attempt failed:', error.message);
      console.log('Notice: If using Supabase, copy the Transaction Pooler URI (Port 6543) into DATABASE_URL in backend/.env.');
    } finally {
      await pool.end();
    }
  } else {
    console.log('=======================================================');
    console.log(' OrderPilot AI In-Memory Resilient Engine Active ');
    console.log(' Pre-seeded with 7 Orders, 7 Tasks, 6 Activity Logs ');
    console.log('=======================================================');
  }
}

seed();
