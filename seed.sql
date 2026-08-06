-- OrderPilot AI Supabase Seed Script
-- Run this script in your Supabase SQL Editor after running schema.sql

-- 1. Insert Users (Password is 'Password123' encrypted with bcrypt)
INSERT INTO users (id, name, email, password, role)
VALUES 
  (1, 'Priya Customer', 'customer@orderpilot.ai', '$2b$10$kowd2V2zMpxHvhvTzUDzeejUvpo92sghou1EOENFMdN37hLPjVtRG', 'customer'),
  (2, 'Business Owner', 'owner@orderpilot.ai', '$2b$10$kowd2V2zMpxHvhvTzUDzeejUvpo92sghou1EOENFMdN37hLPjVtRG', 'owner'),
  (3, 'Ravi Kumar', 'partner@orderpilot.ai', '$2b$10$kowd2V2zMpxHvhvTzUDzeejUvpo92sghou1EOENFMdN37hLPjVtRG', 'delivery_partner'),
  (4, 'Suresh Reddy', 'suresh@orderpilot.ai', '$2b$10$kowd2V2zMpxHvhvTzUDzeejUvpo92sghou1EOENFMdN37hLPjVtRG', 'delivery_partner'),
  (5, 'Anish Sharma', 'anish@orderpilot.ai', '$2b$10$kowd2V2zMpxHvhvTzUDzeejUvpo92sghou1EOENFMdN37hLPjVtRG', 'delivery_partner')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  role = EXCLUDED.role;

-- Reset sequence for users table
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 2. Insert Orders
INSERT INTO orders (
  id, order_number, customer, customer_id, partner_id, delivery_partner_id, address, status, priority, estimated_delivery, original_estimate, current_location, items, amount, timeline
)
VALUES 
  ('ORD-1024', 'ORD-1024', 'Priya Customer', 1, 3, 3, '12, 100ft Road, Indiranagar, Bangalore', 'delayed', 'critical', '2026-08-05', '2026-08-04', 'Indiranagar Regional Hub, Bangalore', '["Wireless Earbuds", "Phone Case"]'::jsonb, 2499.00, '[{"time": "2026-08-05T10:00:00Z", "event": "Order placed", "status": "completed"}, {"time": "2026-08-05T14:30:00Z", "event": "SLA Window Missed - Heavy Traffic Corridor", "status": "issue"}]'::jsonb),
  ('ORD-1027', 'ORD-1027', 'Kavita Sundaram', 1, 3, 3, '44, Cambridge Layout, Ulsoor, Bangalore', 'in-transit', 'high', '2026-08-06', '2026-08-06', 'Ulsoor Transit Point', '["Smart Fitness Watch Series 5"]'::jsonb, 6999.00, '[{"time": "2026-08-06T07:30:00Z", "event": "Out for express delivery", "status": "in-progress"}]'::jsonb),
  ('ORD-1025', 'ORD-1025', 'Vikram Sethi', 1, 3, 3, '88, Inner Ring Road, Domlur, Bangalore', 'processing', 'high', '2026-08-06', '2026-08-06', 'Central Sorting Facility', '["Aluminium Laptop Stand", "7-in-1 USB-C Hub"]'::jsonb, 3499.00, '[{"time": "2026-08-06T08:15:00Z", "event": "Order packed", "status": "completed"}]'::jsonb),
  ('ORD-1022', 'ORD-1022', 'Sneha Verma', 1, 3, 3, '78, Koramangala 4th Block, Bangalore', 'in-transit', 'normal', '2026-08-06', '2026-08-06', 'MG Road Express Transit Hub', '["Yoga Mat", "Steel Water Bottle"]'::jsonb, 1849.00, '[{"time": "2026-08-06T08:00:00Z", "event": "Order dispatched", "status": "in-progress"}]'::jsonb),
  ('ORD-1029', 'ORD-1029', 'Rohan Deshmukh', 1, 3, 3, '56, Trinity Circle, MG Road, Bangalore', 'processing', 'normal', '2026-08-07', '2026-08-07', 'Central Distribution Warehouse', '["Noise Cancelling Headphones"]'::jsonb, 8999.00, '[{"time": "2026-08-06T09:45:00Z", "event": "Order scheduled for evening dispatch", "status": "completed"}]'::jsonb),
  ('ORD-1026', 'ORD-1026', 'Meera Iyer', 1, 3, 3, '15, Bellandur Lake Road, Bangalore', 'delivered', 'normal', '2026-08-05', '2026-08-05', 'Delivered at Security Desk', '["Organic Coffee Beans (1kg)"]'::jsonb, 1450.00, '[{"time": "2026-08-05T11:30:00Z", "event": "Delivered successfully", "status": "completed"}]'::jsonb),
  ('ORD-1028', 'ORD-1028', 'Arjun Menon', 1, 3, 3, '22, Victoria Layout, Bangalore', 'delivered', 'high', '2026-08-05', '2026-08-05', 'Handed Over to Customer', '["GPS Trail Tracker Watch"]'::jsonb, 4500.00, '[{"time": "2026-08-05T15:45:00Z", "event": "Delivered with OTP", "status": "completed"}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET 
  status = EXCLUDED.status,
  priority = EXCLUDED.priority,
  current_location = EXCLUDED.current_location;

-- 3. Insert Complaints
INSERT INTO complaints (
  id, order_id, customer, customer_id, complaint_text, message, category, issue_type, urgency, sentiment, ai_summary, ai_suggestion, requires_approval, approved, status
)
VALUES 
  ('CMP-301', 'ORD-1024', 'Priya Customer', 1, 'My order was supposed to arrive yesterday but it still has not been delivered. I need it urgently for a gift.', 'My order was supposed to arrive yesterday but it still has not been delivered. I need it urgently for a gift.', 'Delivery Delay', 'Delivery Delay', 'critical', 'frustrated', 'Customer experienced delivery failure due to missed SLA window in Indiranagar corridor.', 'Re-assign priority task to partner Ravi Kumar with direct customer dispatch before 6 PM today.', true, false, 'open')
ON CONFLICT (id) DO UPDATE SET 
  urgency = EXCLUDED.urgency,
  status = EXCLUDED.status;

-- 4. Insert Tasks
INSERT INTO tasks (id, complaint_id, order_id, assigned_to, partner_id, priority, description, notes, due_time, scheduled_time, completed, status)
VALUES 
  ('TASK-101', 'CMP-301', 'ORD-1024', 3, 3, 'critical', 'Prioritize express re-delivery attempt of ORD-1024 to Indiranagar address before 6 PM today.', 'Customer requested urgency for birthday gift. Contact customer before arrival.', NOW() + INTERVAL '5 hours', NOW() + INTERVAL '1 hour', false, 'in-progress'),
  ('TASK-106', NULL, 'ORD-1027', 3, 3, 'high', 'Express delivery of Smart Fitness Watch (ORD-1027) to Cambridge Layout.', 'Call recipient 15 minutes prior to arrival.', NOW() + INTERVAL '6 hours', NOW() + INTERVAL '2 hours', false, 'in-progress'),
  ('TASK-104', NULL, 'ORD-1025', 3, 3, 'high', 'Deliver ORD-1025 (Laptop Stand & USB-C Hub) to Domlur Inner Ring Road.', 'Corporate office reception delivery.', NOW() + INTERVAL '8 hours', NOW() + INTERVAL '3 hours', false, 'pending'),
  ('TASK-102', NULL, 'ORD-1022', 3, 3, 'normal', 'Deliver ORD-1022 (Yoga Mat & Water Bottle) to Koramangala 4th Block.', 'Standard afternoon delivery slot.', NOW() + INTERVAL '10 hours', NOW() + INTERVAL '4 hours', false, 'pending'),
  ('TASK-107', NULL, 'ORD-1029', 3, 3, 'normal', 'Evening slot dispatch for ORD-1029 (Headphones) to Trinity Circle, MG Road.', 'Customer available after 5 PM.', NOW() + INTERVAL '12 hours', NOW() + INTERVAL '5 hours', false, 'pending'),
  ('TASK-105', NULL, 'ORD-1026', 3, 3, 'normal', 'Deliver ORD-1026 (Coffee Beans) to Bellandur.', 'Delivered to security desk.', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', true, 'completed'),
  ('TASK-108', NULL, 'ORD-1028', 3, 3, 'high', 'Priority hand-off for ORD-1028 to Victoria Layout.', 'Verified via OTP with customer.', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', true, 'completed')
ON CONFLICT (id) DO UPDATE SET 
  status = EXCLUDED.status,
  completed = EXCLUDED.completed;

-- 5. Insert Notifications
INSERT INTO notifications (receiver, message, type, severity, read)
VALUES 
  ('owner@orderpilot.ai', 'Gemini AI generated action plan for CMP-301 requiring owner approval.', 'complaint', 'critical', false),
  ('partner@orderpilot.ai', 'Express re-delivery assigned for ORD-1024 (Indiranagar)', 'delivery', 'critical', false),
  ('partner@orderpilot.ai', 'Recipient requested 15-min advance call for ORD-1027 (Ulsoor)', 'info', 'high', false),
  ('customer@orderpilot.ai', 'OrderPilot AI pilot dispatched express re-delivery attempt for ORD-1024.', 'info', 'normal', true);

-- 6. Insert Activity Audit Trail
INSERT INTO activity_logs (action, performed_by, details)
VALUES 
  ('AI_ACTION_PLAN_GENERATED', 'PlanningAgent (AI)', '{"complaintId": "CMP-301", "orderId": "ORD-1024", "summary": "Customer experienced delivery failure due to missed SLA window.", "actionPlan": "Contact delivery partner Ravi Kumar and re-dispatch order before 6 PM today."}'::jsonb),
  ('PRIORITY_EVALUATION_COMPLETED', 'PriorityAgent (AI)', '{"complaintId": "CMP-301", "calculatedUrgency": "critical", "sentiment": "frustrated", "confidence": 0.98}'::jsonb),
  ('COMPLAINT_ANALYSIS_EXECUTED', 'ComplaintAnalysisAgent (AI)', '{"complaintId": "CMP-301", "category": "Delivery Delay", "issueType": "Delayed SLA"}'::jsonb),
  ('AUTOMATED_TASK_ASSIGNED', 'TaskAssignmentAgent (AI)', '{"taskId": "TASK-101", "partnerId": 3, "partnerName": "Ravi Kumar", "orderId": "ORD-1024"}'::jsonb),
  ('CUSTOMER_NOTIFICATION_SENT', 'NotificationAgent (AI)', '{"recipient": "customer@orderpilot.ai", "orderId": "ORD-1024", "channel": "SMS/In-App"}'::jsonb),
  ('SYSTEM_INITIALIZATION', 'System', '{"message": "OrderPilot AI Enterprise Engine initialized with multi-agent coordination."}'::jsonb);

-- 7. Insert AI Decisions
INSERT INTO ai_decisions (id, complaint_id, agent_name, reasoning, action_taken, confidence)
VALUES 
  ('AID-101', 'CMP-301', 'ComplaintAnalysisAgent', 'Detected severe delivery delay on high priority order for customer birthday requirement.', 'Categorized as Delivery Delay with Frustrated sentiment.', 0.98),
  ('AID-102', 'CMP-301', 'PriorityAgent', 'Delivery window elapsed >24 hours with negative sentiment.', 'Assigned CRITICAL urgency level.', 0.95),
  ('AID-103', 'CMP-301', 'PlanningAgent', 'Order requires immediate re-route and partner priority contact.', 'Generated 4-step dispatch execution plan.', 0.92)
ON CONFLICT (id) DO UPDATE SET 
  confidence = EXCLUDED.confidence;
