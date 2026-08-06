-- OrderPilot AI Database Schema

-- Drop tables if they exist (for easy resetting/seeding)
DROP TABLE IF EXISTS ai_activity_logs CASCADE;
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
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'delivery_partner')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE orders (
  id VARCHAR(50) PRIMARY KEY,
  customer VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of item strings
  status VARCHAR(50) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'in-transit', 'delayed', 'delivered', 'cancelled')),
  priority VARCHAR(50) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  partner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  estimated_delivery DATE,
  original_estimate DATE,
  placed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  timeline JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of objects: { time: ISO_STRING, event: string, status: string }
  customer_update TEXT
);

-- Complaints Table
CREATE TABLE complaints (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
  customer VARCHAR(255) NOT NULL,
  issue_type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved')),
  urgency VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
  ai_summary TEXT,
  ai_suggestion TEXT,
  requires_approval BOOLEAN DEFAULT true,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tasks Table
CREATE TABLE tasks (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
  partner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  priority VARCHAR(50) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  scheduled_time TIMESTAMPTZ,
  notes TEXT
);

-- Notifications Table
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('delivery', 'complaint', 'performance')),
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- AI Activity Logs Table
CREATE TABLE ai_activity_logs (
  id VARCHAR(50) PRIMARY KEY,
  action TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('auto-reply', 'escalation', 'resolution', 'insight', 'categorization')),
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  related_to VARCHAR(50) NOT NULL
);
