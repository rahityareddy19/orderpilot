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
  console.warn('DATABASE_URL not set or contains placeholder. Running with Resilient In-Memory Database Store.');
  useMock = true;
}

// Enterprise Seeded Mock Database
const mockDb = {
  users: [
    { id: 1, name: 'Priya Customer', email: 'customer@orderpilot.ai', password: '$2b$10$kowd2V2zMpxHvhvTzUDzeejUvpo92sghou1EOENFMdN37hLPjVtRG', role: 'customer' },
    { id: 2, name: 'Business Owner', email: 'owner@orderpilot.ai', password: '$2b$10$kowd2V2zMpxHvhvTzUDzeejUvpo92sghou1EOENFMdN37hLPjVtRG', role: 'owner' },
    { id: 3, name: 'Ravi Kumar', email: 'partner@orderpilot.ai', password: '$2b$10$kowd2V2zMpxHvhvTzUDzeejUvpo92sghou1EOENFMdN37hLPjVtRG', role: 'delivery_partner' },
    { id: 4, name: 'Suresh Reddy', email: 'suresh@orderpilot.ai', password: '$2b$10$kowd2V2zMpxHvhvTzUDzeejUvpo92sghou1EOENFMdN37hLPjVtRG', role: 'delivery_partner' },
    { id: 5, name: 'Anish Sharma', email: 'anish@orderpilot.ai', password: '$2b$10$kowd2V2zMpxHvhvTzUDzeejUvpo92sghou1EOENFMdN37hLPjVtRG', role: 'delivery_partner' }
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
      original_estimate: '2026-08-04',
      current_location: 'Indiranagar Regional Hub, Bangalore',
      items: ['Wireless Earbuds', 'Phone Case'],
      amount: 2499.00,
      timeline: [
        { time: '2026-08-05T10:00:00Z', event: 'Order placed', status: 'completed' },
        { time: '2026-08-05T12:00:00Z', event: 'Dispatched to Indiranagar Hub', status: 'completed' },
        { time: '2026-08-05T14:30:00Z', event: 'SLA Window Missed - Heavy Traffic Corridor', status: 'issue' }
      ],
      customer_update: 'AI Pilot: Priority re-dispatch authorized by owner.',
      placed_at: '2026-08-05T10:00:00Z',
      created_at: '2026-08-05T10:00:00Z'
    },
    {
      id: 'ORD-1027',
      order_number: 'ORD-1027',
      customer: 'Kavita Sundaram',
      customer_id: 1,
      partner_id: 3,
      delivery_partner_id: 3,
      partner_name: 'Ravi Kumar',
      address: '44, Cambridge Layout, Ulsoor, Bangalore',
      status: 'in-transit',
      priority: 'high',
      estimated_delivery: '2026-08-06',
      original_estimate: '2026-08-06',
      current_location: 'Ulsoor Transit Point',
      items: ['Smart Fitness Watch Series 5'],
      amount: 6999.00,
      timeline: [
        { time: '2026-08-06T07:30:00Z', event: 'Order dispatched', status: 'completed' },
        { time: '2026-08-06T09:00:00Z', event: 'Out for express delivery', status: 'in-progress' }
      ],
      placed_at: '2026-08-06T07:30:00Z',
      created_at: '2026-08-06T07:30:00Z'
    },
    {
      id: 'ORD-1025',
      order_number: 'ORD-1025',
      customer: 'Vikram Sethi',
      customer_id: 1,
      partner_id: 3,
      delivery_partner_id: 3,
      partner_name: 'Ravi Kumar',
      address: '88, Inner Ring Road, Domlur, Bangalore',
      status: 'processing',
      priority: 'high',
      estimated_delivery: '2026-08-06',
      original_estimate: '2026-08-06',
      current_location: 'Central Sorting Facility',
      items: ['Aluminium Laptop Stand', '7-in-1 USB-C Hub'],
      amount: 3499.00,
      timeline: [
        { time: '2026-08-06T08:15:00Z', event: 'Order verified & packed', status: 'completed' }
      ],
      placed_at: '2026-08-06T08:15:00Z',
      created_at: '2026-08-06T08:15:00Z'
    },
    {
      id: 'ORD-1022',
      order_number: 'ORD-1022',
      customer: 'Sneha Verma',
      customer_id: 1,
      partner_id: 3,
      delivery_partner_id: 3,
      partner_name: 'Ravi Kumar',
      address: '78, Koramangala 4th Block, Bangalore',
      status: 'in-transit',
      priority: 'normal',
      estimated_delivery: '2026-08-06',
      original_estimate: '2026-08-06',
      current_location: 'MG Road Express Transit Hub',
      items: ['Yoga Mat', 'Steel Water Bottle'],
      amount: 1849.00,
      timeline: [
        { time: '2026-08-06T08:00:00Z', event: 'Order dispatched from warehouse', status: 'in-progress' }
      ],
      placed_at: '2026-08-06T08:00:00Z',
      created_at: '2026-08-06T08:00:00Z'
    },
    {
      id: 'ORD-1029',
      order_number: 'ORD-1029',
      customer: 'Rohan Deshmukh',
      customer_id: 1,
      partner_id: 3,
      delivery_partner_id: 3,
      partner_name: 'Ravi Kumar',
      address: '56, Trinity Circle, MG Road, Bangalore',
      status: 'processing',
      priority: 'normal',
      estimated_delivery: '2026-08-07',
      original_estimate: '2026-08-07',
      current_location: 'Central Distribution Warehouse',
      items: ['Noise Cancelling Wireless Headphones'],
      amount: 8999.00,
      timeline: [
        { time: '2026-08-06T09:45:00Z', event: 'Order scheduled for evening dispatch', status: 'completed' }
      ],
      placed_at: '2026-08-06T09:45:00Z',
      created_at: '2026-08-06T09:45:00Z'
    },
    {
      id: 'ORD-1026',
      order_number: 'ORD-1026',
      customer: 'Meera Iyer',
      customer_id: 1,
      partner_id: 3,
      delivery_partner_id: 3,
      partner_name: 'Ravi Kumar',
      address: '15, Bellandur Lake Road, Bangalore',
      status: 'delivered',
      priority: 'normal',
      estimated_delivery: '2026-08-05',
      original_estimate: '2026-08-05',
      current_location: 'Delivered at Security Desk',
      items: ['Organic Coffee Beans (1kg)', 'French Press'],
      amount: 1450.00,
      timeline: [
        { time: '2026-08-05T08:00:00Z', event: 'Order placed', status: 'completed' },
        { time: '2026-08-05T11:30:00Z', event: 'Delivered to recipient', status: 'completed' }
      ],
      placed_at: '2026-08-05T08:00:00Z',
      created_at: '2026-08-05T08:00:00Z'
    },
    {
      id: 'ORD-1028',
      order_number: 'ORD-1028',
      customer: 'Arjun Menon',
      customer_id: 1,
      partner_id: 3,
      delivery_partner_id: 3,
      partner_name: 'Ravi Kumar',
      address: '22, Victoria Layout, Bangalore',
      status: 'delivered',
      priority: 'high',
      estimated_delivery: '2026-08-05',
      original_estimate: '2026-08-05',
      current_location: 'Handed Over to Customer',
      items: ['GPS Trail Tracker Watch'],
      amount: 4500.00,
      timeline: [
        { time: '2026-08-05T13:00:00Z', event: 'Dispatched for priority delivery', status: 'completed' },
        { time: '2026-08-05T15:45:00Z', event: 'Delivered & verified with OTP', status: 'completed' }
      ],
      placed_at: '2026-08-05T13:00:00Z',
      created_at: '2026-08-05T13:00:00Z'
    }
  ],
  complaints: [
    {
      id: 'CMP-301',
      order_id: 'ORD-1024',
      customer: 'Priya Customer',
      customer_id: 1,
      complaint_text: 'My order was supposed to arrive yesterday but it still has not been delivered. I need it urgently for a birthday gift.',
      message: 'My order was supposed to arrive yesterday but it still has not been delivered. I need it urgently for a birthday gift.',
      category: 'Delivery Delay',
      issue_type: 'Delivery Delay',
      urgency: 'critical',
      sentiment: 'frustrated',
      ai_summary: 'Customer experienced delivery failure due to missed SLA window in Indiranagar corridor.',
      ai_suggestion: 'Re-assign priority task to partner Ravi Kumar with direct customer dispatch before 6 PM today.',
      requires_approval: true,
      approved: false,
      status: 'open',
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'CMP-304',
      order_id: 'ORD-1027',
      customer: 'Kavita Sundaram',
      customer_id: 1,
      complaint_text: 'Recipient requested pre-delivery call 15 minutes before arrival.',
      message: 'Recipient requested pre-delivery call 15 minutes before arrival.',
      category: 'Delivery Instructions',
      issue_type: 'Delivery Instructions',
      urgency: 'high',
      sentiment: 'neutral',
      ai_summary: 'Special dispatch call request attached to delivery profile.',
      ai_suggestion: 'Prompt delivery partner Ravi Kumar with automated IVR call before doorstep approach.',
      requires_approval: false,
      approved: true,
      status: 'in_progress',
      created_at: new Date(Date.now() - 5400000).toISOString()
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
      description: 'Prioritize express re-delivery attempt of ORD-1024 to Indiranagar address before 6 PM today.',
      notes: 'Customer requested urgency for birthday gift. Call customer before arrival.',
      due_time: new Date(Date.now() + 18000000).toISOString(),
      scheduled_time: new Date(Date.now() + 3600000).toISOString(),
      completed: false,
      status: 'in-progress',
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'TASK-106',
      complaint_id: 'CMP-304',
      order_id: 'ORD-1027',
      assigned_to: 3,
      partner_id: 3,
      partner_name: 'Ravi Kumar',
      priority: 'high',
      description: 'Express delivery of Smart Fitness Watch (ORD-1027) to Cambridge Layout.',
      notes: 'Call recipient 15 minutes prior to arrival as requested.',
      due_time: new Date(Date.now() + 21600000).toISOString(),
      scheduled_time: new Date(Date.now() + 5400000).toISOString(),
      completed: false,
      status: 'in-progress',
      created_at: new Date(Date.now() - 5400000).toISOString()
    },
    {
      id: 'TASK-104',
      complaint_id: null,
      order_id: 'ORD-1025',
      assigned_to: 3,
      partner_id: 3,
      partner_name: 'Ravi Kumar',
      priority: 'high',
      description: 'Deliver ORD-1025 (Laptop Stand & USB-C Hub) to Domlur Inner Ring Road.',
      notes: 'Corporate office reception delivery.',
      due_time: new Date(Date.now() + 28800000).toISOString(),
      scheduled_time: new Date(Date.now() + 7200000).toISOString(),
      completed: false,
      status: 'pending',
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'TASK-102',
      complaint_id: null,
      order_id: 'ORD-1022',
      assigned_to: 3,
      partner_id: 3,
      partner_name: 'Ravi Kumar',
      priority: 'normal',
      description: 'Deliver ORD-1022 (Yoga Mat & Water Bottle) to Koramangala 4th Block.',
      notes: 'Standard afternoon delivery slot.',
      due_time: new Date(Date.now() + 43200000).toISOString(),
      scheduled_time: new Date(Date.now() + 14400000).toISOString(),
      completed: false,
      status: 'pending',
      created_at: new Date(Date.now() - 10800000).toISOString()
    },
    {
      id: 'TASK-107',
      complaint_id: null,
      order_id: 'ORD-1029',
      assigned_to: 3,
      partner_id: 3,
      partner_name: 'Ravi Kumar',
      priority: 'normal',
      description: 'Evening slot dispatch for ORD-1029 (Headphones) to Trinity Circle, MG Road.',
      notes: 'Customer available after 5 PM.',
      due_time: new Date(Date.now() + 57600000).toISOString(),
      scheduled_time: new Date(Date.now() + 21600000).toISOString(),
      completed: false,
      status: 'pending',
      created_at: new Date(Date.now() - 12000000).toISOString()
    },
    {
      id: 'TASK-105',
      complaint_id: null,
      order_id: 'ORD-1026',
      assigned_to: 3,
      partner_id: 3,
      partner_name: 'Ravi Kumar',
      priority: 'normal',
      description: 'Deliver ORD-1026 (Coffee Beans & French Press) to Bellandur.',
      notes: 'Delivered to security desk as instructed.',
      due_time: new Date(Date.now() - 86400000).toISOString(),
      scheduled_time: new Date(Date.now() - 90000000).toISOString(),
      completed: true,
      status: 'completed',
      created_at: new Date(Date.now() - 93600000).toISOString()
    },
    {
      id: 'TASK-108',
      complaint_id: null,
      order_id: 'ORD-1028',
      assigned_to: 3,
      partner_id: 3,
      partner_name: 'Ravi Kumar',
      priority: 'high',
      description: 'Priority hand-off for ORD-1028 (GPS Trail Tracker Watch) to Victoria Layout.',
      notes: 'Verified via OTP with customer.',
      due_time: new Date(Date.now() - 43200000).toISOString(),
      scheduled_time: new Date(Date.now() - 50000000).toISOString(),
      completed: true,
      status: 'completed',
      created_at: new Date(Date.now() - 54000000).toISOString()
    }
  ],
  notifications: [
    { id: 1, receiver: 'partner@orderpilot.ai', title: 'Critical Task Escalation', message: 'Express re-delivery assigned for ORD-1024 (Indiranagar)', type: 'delivery', severity: 'critical', read: false, created_at: new Date().toISOString() },
    { id: 2, receiver: 'partner@orderpilot.ai', title: 'Special Delivery Instructions', message: 'Recipient requested 15-min advance call for ORD-1027 (Ulsoor)', type: 'info', severity: 'high', read: false, created_at: new Date().toISOString() },
    { id: 3, receiver: 'partner@orderpilot.ai', title: 'New Route Added', message: '3 new delivery tasks added to your daily schedule.', type: 'info', severity: 'normal', read: true, created_at: new Date().toISOString() }
  ],
  activity_logs: [
    {
      id: 1,
      action: 'AI_ACTION_PLAN_GENERATED',
      performed_by: 'PlanningAgent (AI)',
      details: { complaintId: 'CMP-301', orderId: 'ORD-1024', summary: 'Customer experienced delivery failure due to missed SLA window.', actionPlan: 'Contact delivery partner Ravi Kumar and re-dispatch order before 6 PM today.' },
      timestamp: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 2,
      action: 'PRIORITY_EVALUATION_COMPLETED',
      performed_by: 'PriorityAgent (AI)',
      details: { complaintId: 'CMP-301', calculatedUrgency: 'critical', sentiment: 'frustrated', confidence: 0.98 },
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 3,
      action: 'AUTOMATED_TASK_ASSIGNED',
      performed_by: 'TaskAssignmentAgent (AI)',
      details: { taskId: 'TASK-106', partnerId: 3, partnerName: 'Ravi Kumar', orderId: 'ORD-1027', priority: 'high' },
      timestamp: new Date(Date.now() - 5400000).toISOString()
    },
    {
      id: 4,
      action: 'CUSTOMER_NOTIFICATION_SENT',
      performed_by: 'NotificationAgent (AI)',
      details: { recipient: 'customer@orderpilot.ai', orderId: 'ORD-1024', channel: 'SMS/In-App', status: 'delivered' },
      timestamp: new Date(Date.now() - 9000000).toISOString()
    },
    {
      id: 5,
      action: 'SYSTEM_INITIALIZATION',
      performed_by: 'System',
      details: { message: 'OrderPilot AI Enterprise Engine initialized with multi-agent coordination.' },
      timestamp: new Date(Date.now() - 14400000).toISOString()
    }
  ],
  ai_decisions: [
    { id: 'AID-101', complaint_id: 'CMP-301', agent_name: 'ComplaintAnalysisAgent', reasoning: 'Detected severe delivery delay on high priority order for customer birthday requirement.', action_taken: 'Categorized as Delivery Delay with Frustrated sentiment.', confidence: 0.98, timestamp: new Date(Date.now() - 5400000).toISOString() },
    { id: 'AID-102', complaint_id: 'CMP-301', agent_name: 'PriorityAgent', reasoning: 'Delivery window elapsed >24 hours with negative sentiment.', action_taken: 'Assigned CRITICAL urgency level.', confidence: 0.95, timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'AID-103', complaint_id: 'CMP-301', agent_name: 'PlanningAgent', reasoning: 'Order requires immediate re-route and partner priority contact.', action_taken: 'Generated 4-step dispatch execution plan.', confidence: 0.92, timestamp: new Date(Date.now() - 1800000).toISOString() }
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
    
    // --- Dashboard Metrics: Handle COUNT(*) Aggregate Queries ---
    if (lowerSql.includes('count(*)')) {
      if (lowerSql.includes('from orders')) {
        if (lowerSql.includes("status = 'delayed'")) {
          const count = mockDb.orders.filter(o => o.status === 'delayed').length;
          return { rows: [{ count: String(count) }], rowCount: 1 };
        }
        return { rows: [{ count: String(mockDb.orders.length) }], rowCount: 1 };
      }
      if (lowerSql.includes('from complaints')) {
        if (lowerSql.includes("status = 'open'")) {
          const count = mockDb.complaints.filter(c => c.status === 'open' || c.status === 'open').length;
          return { rows: [{ count: String(count) }], rowCount: 1 };
        }
        return { rows: [{ count: String(mockDb.complaints.length) }], rowCount: 1 };
      }
      if (lowerSql.includes('from activity_logs')) {
        return { rows: [{ count: String(mockDb.activity_logs.length) }], rowCount: 1 };
      }
      return { rows: [{ count: '0' }], rowCount: 1 };
    }

    // --- Standard SELECT Queries ---
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
      if (/o\.id\s*=\s*\$1/i.test(sql) || /id\s*=\s*\$1/i.test(sql) || /o\.order_number\s*=\s*\$1/i.test(sql)) {
        const idParam = (params[0] || '').toUpperCase();
        const found = mockDb.orders.filter(o => o.id.toUpperCase() === idParam || o.order_number === idParam);
        return { rows: found, rowCount: found.length };
      }
      if (/o\.partner_id\s*=\s*\$1/i.test(sql) || /o\.delivery_partner_id\s*=\s*\$1/i.test(sql)) {
        const partnerId = parseInt(params[0], 10);
        const found = mockDb.orders.filter(o => o.partner_id === partnerId || o.delivery_partner_id === partnerId);
        return { rows: found, rowCount: found.length };
      }
      if (/o\.customer_id\s*=\s*\$1/i.test(sql) || /o\.customer\s*=\s*\$2/i.test(sql)) {
        const customerId = parseInt(params[0], 10);
        const customerName = params[1] || '';
        const customerEmail = params[2] || '';
        const found = mockDb.orders.filter(o => o.customer_id === customerId || o.customer === customerName || o.customer === customerEmail);
        return { rows: found, rowCount: found.length };
      }
      return { rows: mockDb.orders, rowCount: mockDb.orders.length };
    }

    if (lowerSql.includes('from complaints')) {
      if (/id\s*=\s*\$1/i.test(sql) || /c\.id\s*=\s*\$1/i.test(sql)) {
        const idParam = params[0];
        const found = mockDb.complaints.filter(c => c.id === idParam);
        return { rows: found, rowCount: found.length };
      }
      if (/c\.customer_id\s*=\s*\$1/i.test(sql) || /c\.customer\s*=\s*\$2/i.test(sql)) {
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
      if (/t\.partner_id\s*=\s*\$1/i.test(sql) || /t\.assigned_to\s*=\s*\$1/i.test(sql)) {
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
      timeline: params[11],
      customer_id: params[12]
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
      details: typeof params[2] === 'string' ? JSON.parse(params[2]) : params[2],
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
    const found = mockDb.orders.find(o => o.id === id || o.order_number === id);
    if (found) {
      if (lowerSql.includes('customer = $1')) {
        // Edit order query
        found.customer = params[0];
        found.address = params[1];
        found.items = typeof params[2] === 'string' ? JSON.parse(params[2]) : params[2];
        found.priority = params[3];
        found.amount = params[4];
        found.partner_id = params[5];
        found.delivery_partner_id = params[5];
        found.customer_id = params[6];
      } else if (lowerSql.includes('partner_id = $1')) {
        // Auto assign query
        found.partner_id = params[0];
        found.delivery_partner_id = params[0];
      } else {
        // Status update query
        found.status = params[0];
      }
    }
    return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
  }

  if (lowerSql.startsWith('delete from tasks')) {
    const id = params[0];
    const beforeCount = mockDb.tasks.length;
    mockDb.tasks = mockDb.tasks.filter(t => t.order_id !== id && t.id !== id);
    return { rows: [], rowCount: beforeCount - mockDb.tasks.length };
  }

  if (lowerSql.startsWith('delete from orders')) {
    const id = params[0];
    const beforeCount = mockDb.orders.length;
    mockDb.orders = mockDb.orders.filter(o => o.id !== id && o.order_number !== id);
    return { rows: [], rowCount: beforeCount - mockDb.orders.length };
  }

  return { rows: [], rowCount: 0 };
}

module.exports = {
  query: (text, params) => executeQuery(text, params),
  pool
};
