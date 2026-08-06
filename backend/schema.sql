-- OrderPilot AI Enterprise Supabase PostgreSQL Schema

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
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  delivery_partner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'in-transit', 'delayed', 'delivered', 'cancelled')),
  estimated_delivery DATE,
  current_location TEXT DEFAULT 'Central Distribution Warehouse',
  items JSONB DEFAULT '[]'::jsonb,
  amount NUMERIC(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Complaints Table
CREATE TABLE complaints (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  complaint_text TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'General',
  urgency VARCHAR(50) DEFAULT 'medium' CHECK (urgency IN ('critical', 'high', 'medium', 'low')),
  sentiment VARCHAR(50) DEFAULT 'negative',
  ai_summary TEXT,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'escalated')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tasks Table
CREATE TABLE tasks (
  id VARCHAR(50) PRIMARY KEY,
  complaint_id VARCHAR(50) REFERENCES complaints(id) ON DELETE CASCADE,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  description TEXT NOT NULL,
  due_time TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  receiver VARCHAR(255) NOT NULL, -- email or role or user_id
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('delivery', 'complaint', 'system', 'info', 'alert')),
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
