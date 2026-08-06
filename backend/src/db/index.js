const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
let pool = null;
let useMock = false;

if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('[YOUR-PASSWORD]')) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
  } catch (err) {
    console.warn('PostgreSQL pool creation failed, activating Resilient Mock Database Store:', err.message);
    useMock = true;
  }
} else {
  console.warn('DATABASE_URL not set or contains placeholder password. Running with Resilient In-Memory Database Store.');
  useMock = true;
}

// In-Memory Fallback Database Store
const mockDb = {
  users: [
    { id: 1, name: 'Priya Customer', email: 'customer@orderpilot.ai', password: '$2b$10$WqU1J8.vE8uG0W4Gz9Vb3e5r1xK4L6m7n8o9p0q1r2s3t4u5v6w7x', role: 'customer' },
    { id: 2, name: 'Business Owner', email: 'owner@orderpilot.ai', password: '$2b$10$WqU1J8.vE8uG0W4Gz9Vb3e5r1xK4L6m7n8o9p0q1r2s3t4u5v6w7x', role: 'owner' },
    { id: 3, name: 'Ravi Kumar', email: 'partner@orderpilot.ai', password: '$2b$10$WqU1J8.vE8uG0W4Gz9Vb3e5r1xK4L6m7n8o9p0q1r2s3t4u5v6w7x', role: 'delivery_partner' },
    { id: 4, name: 'Suresh Reddy', email: 'suresh@orderpilot.ai', password: '$2b$10$WqU1J8.vE8uG0W4Gz9Vb3e5r1xK4L6m7n8o9p0q1r2s3t4u5v6w7x', role: 'delivery_partner' }
  ],
  orders: [
    {
      id: 'ORD-1024',
      order_number: 'ORD-1024',
      customer: 'Priya Customer',
      customer_id: 1,
      partner_id: 3,
      delivery_partner_id: 3,
      partner_name: 'Ravi Kumar',
      address: '12, 100ft Road, Indiranagar, Bangalore',
      status: 'delayed',
      priority: 'critical',
      estimated_delivery: '2026-08-05',
      current_location: 'Indiranagar Hub, Bangalore',
      items: ['Wireless Earbuds', 'Phone Case'],
      amount: 2499.00,
      timeline: [
        { time: '2026-08-05T10:00:00Z', event: 'Order placed', status: 'completed' },
        { time: '2026-08-05T14:30:00Z', event: 'Delayed at Indiranagar Hub', status: 'issue' }
      ],
      customer_update: 'Customer reported severe delivery delay.',
      placed_at: '2026-08-05T10:00:00Z',
      created_at: '2026-08-05T10:00:00Z'
    },
    {
      id: 'ORD-1023',
      order_number: 'ORD-1023',
      customer: 'Priya Customer',
      customer_id: 1,
      partner_id: 4,
      delivery_partner_id: 4,
      partner_name: 'Suresh Reddy',
      address: '45, MG Road, Bangalore',
      status: 'delivered',
      priority: 'normal',
      estimated_delivery: '2026-08-04',
      current_location: 'Delivered at Doorstep',
      items: ['Running Shoes'],
      amount: 3999.00,
      timeline: [
        { time: '2026-08-04T09:00:00Z', event: 'Order placed', status: 'completed' },
        { time: '2026-08-04T16:00:00Z', event: 'Delivered successfully', status: 'completed' }
      ],
      placed_at: '2026-08-04T09:00:00Z',
      created_at: '2026-08-04T09:00:00Z'
    },
    {
      id: 'ORD-1022',
      order_number: 'ORD-1022',
      customer: 'Priya Customer',
      customer_id: 1,
      partner_id: 3,
      delivery_partner_id: 3,
      partner_name: 'Ravi Kumar',
      address: '78, Koramangala 4th Block, Bangalore',
      status: 'in-transit',
      priority: 'normal',
      estimated_delivery: '2026-08-06',
      current_location: 'MG Road Express Transit',
      items: ['Yoga Mat', 'Water Bottle'],
      amount: 1849.00,
      timeline: [
        { time: '2026-08-06T08:00:00Z', event: 'Order dispatched', status: 'in-progress' }
      ],
      placed_at: '2026-08-06T08:00:00Z',
      created_at: '2026-08-06T08:00:00Z'
    }
  ],
  complaints: [
    {
      id: 'CMP-301',
      order_id: 'ORD-1024',
      customer: 'Priya Customer',
      customer_id: 1,
      complaint_text: 'My order was supposed to arrive yesterday but it still has not been delivered. I need it urgently.',
      message: 'My order was supposed to arrive yesterday but it still has not been delivered. I need it urgently.',
      category: 'Delivery Delay',
      issue_type: 'Delivery Delay',
      urgency: 'critical',
      sentiment: 'frustrated',
      ai_summary: 'Customer experienced delivery failure due to missed SLA window.',
      ai_suggestion: 'Contact delivery partner Ravi Kumar and re-dispatch order before 6 PM today.',
      requires_approval: true,
      approved: false,
      status: 'open',
      created_at: new Date().toISOString()
    }
  ],
  tasks: [
    {
      id: 'TASK-101',
      complaint_id: 'CMP-301',
      order_id: 'ORD-1024',
      assigned_to: 3,
      partner_id: 3,
      partner_name: 'Ravi Kumar',
      priority: 'critical',
      description: 'Prioritize re-delivery attempt of ORD-1024 to Indiranagar address before 6 PM today.',
      notes: 'Prioritize re-delivery attempt of ORD-1024 to Indiranagar address before 6 PM today.',
      due_time: '2026-08-06T18:00:00Z',
      scheduled_time: '2026-08-06T18:00:00Z',
      completed: false,
      status: 'pending',
      created_at: new Date().toISOString()
    }
  ],
  notifications: [
    { id: 1, receiver: 'owner@orderpilot.ai', title: 'Urgent Issue', message: 'Critical complaint filed for ORD-1024: Delivery Delay', type: 'complaint', severity: 'high', read: false, created_at: new Date().toISOString() },
    { id: 2, receiver: 'partner@orderpilot.ai', title: 'Task Assigned', message: 'New critical task assigned for order ORD-1024', type: 'delivery', severity: 'high', read: false, created_at: new Date().toISOString() },
    { id: 3, receiver: 'customer@orderpilot.ai', title: 'Order Update', message: 'OrderPilot AI has updated your order resolution timeline for ORD-1024', type: 'info', severity: 'medium', read: true, created_at: new Date().toISOString() }
  ],
  activity_logs: [
    { id: 1, action: 'SYSTEM_INITIALIZATION', performed_by: 'System', details: { message: 'Database initialized with resilience fallback.' }, timestamp: new Date().toISOString() }
  ],
  ai_decisions: [
    { id: 'AID-101', complaint_id: 'CMP-301', agent_name: 'ComplaintAnalysisAgent', reasoning: 'Detected severe delay on high priority order for customer gift requirement.', action_taken: 'Categorized as Delivery Delay with Frustrated sentiment.', confidence: 0.98, timestamp: new Date().toISOString() },
    { id: 'AID-102', complaint_id: 'CMP-301', agent_name: 'PriorityAgent', reasoning: 'Delivery window elapsed >24 hours with negative sentiment.', action_taken: 'Assigned CRITICAL urgency level.', confidence: 0.95, timestamp: new Date().toISOString() },
    { id: 'AID-103', complaint_id: 'CMP-301', agent_name: 'PlanningAgent', reasoning: 'Order requires immediate re-route and partner priority contact.', action_taken: 'Generated 4-step dispatch execution plan.', confidence: 0.92, timestamp: new Date().toISOString() }
  ]
};

async function executeQuery(text, params = []) {
  if (pool && !useMock) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.warn(`PostgreSQL Query Failed (${err.code || err.message}). Switching session to Resilient Mock Store.`);
      useMock = true;
    }
  }

  // Fallback Mock Query Engine
  const sql = text.trim();
  const lowerSql = sql.toLowerCase();

  if (lowerSql.startsWith('select')) {
    if (lowerSql.includes('from users')) {
      if (lowerSql.includes('where email =')) {
        const emailParam = params[0]?.toLowerCase();
        const found = mockDb.users.filter(u => u.email.toLowerCase() === emailParam);
        return { rows: found, rowCount: found.length };
      }
      if (lowerSql.includes('where id =')) {
        const idParam = parseInt(params[0], 10);
        const found = mockDb.users.filter(u => u.id === idParam);
        return { rows: found, rowCount: found.length };
      }
      if (lowerSql.includes("role = 'delivery_partner'")) {
        const found = mockDb.users.filter(u => u.role === 'delivery_partner');
        return { rows: found, rowCount: found.length };
      }
      return { rows: mockDb.users, rowCount: mockDb.users.length };
    }

    if (lowerSql.includes('from orders')) {
      if (lowerSql.includes('where o.id = $1') || lowerSql.includes('where id = $1') || lowerSql.includes('o.order_number = $1')) {
        const idParam = (params[0] || '').toUpperCase();
        const found = mockDb.orders.filter(o => o.id.toUpperCase() === idParam || o.order_number === idParam);
        return { rows: found, rowCount: found.length };
      }
      if (lowerSql.includes('where o.partner_id = $1') || lowerSql.includes('o.delivery_partner_id = $1')) {
        const partnerId = parseInt(params[0], 10);
        const found = mockDb.orders.filter(o => o.partner_id === partnerId || o.delivery_partner_id === partnerId);
        return { rows: found, rowCount: found.length };
      }
      if (lowerSql.includes('where o.customer_id = $1') || lowerSql.includes('o.customer = $2')) {
        const customerId = parseInt(params[0], 10);
        const customerName = params[1] || '';
        const customerEmail = params[2] || '';
        const found = mockDb.orders.filter(o => o.customer_id === customerId || o.customer === customerName || o.customer === customerEmail);
        return { rows: found, rowCount: found.length };
      }
      return { rows: mockDb.orders, rowCount: mockDb.orders.length };
    }

    if (lowerSql.includes('from complaints')) {
      if (lowerSql.includes('where id = $1')) {
        const idParam = params[0];
        const found = mockDb.complaints.filter(c => c.id === idParam);
        return { rows: found, rowCount: found.length };
      }
      if (lowerSql.includes('where c.customer_id = $1') || lowerSql.includes('c.customer = $2')) {
        const customerId = parseInt(params[0], 10);
        const found = mockDb.complaints.filter(c => c.customer_id === customerId || c.customer === params[1]);
        return { rows: found, rowCount: found.length };
      }
      if (lowerSql.includes('requires_approval = true')) {
        const found = mockDb.complaints.filter(c => c.requires_approval && !c.approved);
        return { rows: found, rowCount: found.length };
      }
      return { rows: mockDb.complaints, rowCount: mockDb.complaints.length };
    }

    if (lowerSql.includes('from tasks')) {
      if (lowerSql.includes('where t.partner_id = $1') || lowerSql.includes('t.assigned_to = $1')) {
        const partnerId = parseInt(params[0], 10);
        const found = mockDb.tasks.filter(t => t.partner_id === partnerId || t.assigned_to === partnerId);
        return { rows: found, rowCount: found.length };
      }
      return { rows: mockDb.tasks, rowCount: mockDb.tasks.length };
    }

    if (lowerSql.includes('from notifications')) {
      return { rows: mockDb.notifications, rowCount: mockDb.notifications.length };
    }

    if (lowerSql.includes('from activity_logs')) {
      return { rows: mockDb.activity_logs, rowCount: mockDb.activity_logs.length };
    }

    if (lowerSql.includes('from ai_decisions')) {
      return { rows: mockDb.ai_decisions, rowCount: mockDb.ai_decisions.length };
    }

    if (lowerSql.includes('count(*)')) {
      return { rows: [{ count: '3' }], rowCount: 1 };
    }
  }

  if (lowerSql.startsWith('insert into users')) {
    const newUser = {
      id: mockDb.users.length + 1,
      name: params[0],
      email: params[1],
      password: params[2],
      role: params[3],
      created_at: new Date().toISOString()
    };
    mockDb.users.push(newUser);
    return { rows: [newUser], rowCount: 1 };
  }

  if (lowerSql.startsWith('insert into orders')) {
    const newOrder = {
      id: params[0],
      order_number: params[0],
      customer: params[1],
      address: params[2],
      items: params[3],
      status: params[4],
      priority: params[5],
      partner_id: params[6],
      delivery_partner_id: params[6],
      estimated_delivery: params[7],
      original_estimate: params[8],
      placed_at: params[9],
      amount: params[10],
      timeline: params[11]
    };
    mockDb.orders.unshift(newOrder);
    return { rows: [newOrder], rowCount: 1 };
  }

  if (lowerSql.startsWith('insert into complaints')) {
    const newComplaint = {
      id: params[0],
      order_id: params[1],
      customer: params[2],
      customer_id: params[2],
      issue_type: params[3],
      category: params[3],
      message: params[4],
      complaint_text: params[4],
      status: params[5] || 'open',
      urgency: params[6] || 'medium',
      ai_summary: params[7],
      ai_suggestion: params[8],
      requires_approval: params[9] !== false,
      approved: params[10] || false,
      created_at: new Date().toISOString()
    };
    mockDb.complaints.unshift(newComplaint);
    return { rows: [newComplaint], rowCount: 1 };
  }

  if (lowerSql.startsWith('insert into tasks')) {
    const newTask = {
      id: params[0],
      order_id: params[1],
      complaint_id: params[1],
      partner_id: params[2],
      assigned_to: params[2],
      status: params[3] || 'pending',
      priority: params[4] || 'medium',
      due_time: params[5],
      scheduled_time: params[5],
      notes: params[6],
      description: params[6],
      completed: false,
      created_at: new Date().toISOString()
    };
    mockDb.tasks.unshift(newTask);
    return { rows: [newTask], rowCount: 1 };
  }

  if (lowerSql.startsWith('insert into notifications')) {
    const newNotif = {
      id: mockDb.notifications.length + 1,
      receiver: params[0],
      message: params[1],
      type: params[2] || 'info',
      read: false,
      created_at: new Date().toISOString()
    };
    mockDb.notifications.unshift(newNotif);
    return { rows: [newNotif], rowCount: 1 };
  }

  if (lowerSql.startsWith('insert into activity_logs')) {
    const newLog = {
      id: mockDb.activity_logs.length + 1,
      action: params[0],
      performed_by: params[1],
      details: params[2],
      timestamp: new Date().toISOString()
    };
    mockDb.activity_logs.unshift(newLog);
    return { rows: [newLog], rowCount: 1 };
  }

  if (lowerSql.startsWith('insert into ai_decisions')) {
    const newDecision = {
      id: params[0],
      complaint_id: params[1],
      agent_name: params[2],
      reasoning: params[3],
      action_taken: params[4],
      confidence: params[5],
      timestamp: new Date().toISOString()
    };
    mockDb.ai_decisions.unshift(newDecision);
    return { rows: [newDecision], rowCount: 1 };
  }

  if (lowerSql.startsWith('update complaints')) {
    const id = params[params.length - 1];
    const found = mockDb.complaints.find(c => c.id === id);
    if (found) {
      if (lowerSql.includes('approved = true')) {
        found.approved = true;
        found.status = 'resolved';
      }
      if (lowerSql.includes('urgency =')) {
        found.urgency = params[0];
      }
    }
    return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
  }

  if (lowerSql.startsWith('update tasks')) {
    const id = params[1];
    const found = mockDb.tasks.find(t => t.id === id);
    if (found) {
      found.status = params[0];
      if (params[0] === 'completed') found.completed = true;
    }
    return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
  }

  if (lowerSql.startsWith('update orders')) {
    const id = params[params.length - 1];
    const found = mockDb.orders.find(o => o.id === id);
    if (found) {
      found.status = params[0];
    }
    return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
  }

  return { rows: [], rowCount: 0 };
}

module.exports = {
  query: (text, params) => executeQuery(text, params),
  pool
};
