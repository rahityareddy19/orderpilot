-- OrderPilot AI Unified PostgreSQL Schema

DROP TABLE IF EXISTS ai_decisions CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'owner', 'delivery_partner')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE orders (
  id VARCHAR(50) PRIMARY KEY,
  order_number VARCHAR(50),
  customer VARCHAR(255) DEFAULT 'Customer',
  customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  partner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  delivery_partner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  address TEXT DEFAULT 'Main Address',
  items JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'in-transit', 'delayed', 'delivered', 'cancelled')),
  priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal', 'low')),
  estimated_delivery DATE,
  original_estimate DATE,
  current_location TEXT DEFAULT 'Central Distribution Warehouse',
  amount NUMERIC(10, 2) DEFAULT 0.00,
  timeline JSONB DEFAULT '[]'::jsonb,
  customer_update TEXT,
  placed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Complaints Table
CREATE TABLE complaints (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
  customer VARCHAR(255) DEFAULT 'Customer',
  customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  complaint_text TEXT,
  message TEXT,
  category VARCHAR(100) DEFAULT 'General',
  issue_type VARCHAR(100) DEFAULT 'General',
  urgency VARCHAR(50) DEFAULT 'medium' CHECK (urgency IN ('critical', 'high', 'medium', 'low', 'normal')),
  sentiment VARCHAR(50) DEFAULT 'negative',
  ai_summary TEXT,
  ai_suggestion TEXT,
  requires_approval BOOLEAN DEFAULT true,
  approved BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'escalated')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tasks Table
CREATE TABLE tasks (
  id VARCHAR(50) PRIMARY KEY,
  complaint_id VARCHAR(50) REFERENCES complaints(id) ON DELETE CASCADE,
  order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  partner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  priority VARCHAR(50) DEFAULT 'medium',
  description TEXT,
  notes TEXT,
  scheduled_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  due_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 day',
  completed BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  receiver VARCHAR(255) NOT NULL,
  title TEXT,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  severity VARCHAR(50) DEFAULT 'medium',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Activity Logs Table
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(255) NOT NULL,
  performed_by VARCHAR(255) NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- AI Decisions Table
CREATE TABLE ai_decisions (
  id VARCHAR(50) PRIMARY KEY,
  complaint_id VARCHAR(50) REFERENCES complaints(id) ON DELETE CASCADE,
  agent_name VARCHAR(100) NOT NULL,
  reasoning TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  confidence NUMERIC(5, 2) DEFAULT 0.95,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
