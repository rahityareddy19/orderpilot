const express = require('express');
const router = express.Router();
const { z } = require('zod');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const createOrderSchema = z.object({
  id: z.string().optional(),
  customer: z.string().min(2, 'Customer name is required'),
  address: z.string().min(5, 'Delivery address is required'),
  items: z.union([z.array(z.string()), z.string()]).transform(val => {
    if (typeof val === 'string') {
      return val.split(',').map(s => s.trim()).filter(Boolean);
    }
    return val;
  }),
  amount: z.coerce.number().positive('Amount must be positive'),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  partner_id: z.coerce.number().nullable().optional(),
  partnerId: z.coerce.number().nullable().optional(),
  estimated_delivery: z.string().optional(),
  estimatedDelivery: z.string().optional()
});

const updateStatusSchema = z.object({
  status: z.enum(['processing', 'in-transit', 'delayed', 'delivered', 'cancelled']),
  eventMessage: z.string().optional()
});

function formatOrderResponse(row) {
  let parsedItems = [];
  if (Array.isArray(row.items)) {
    parsedItems = row.items;
  } else if (typeof row.items === 'string') {
    try {
      parsedItems = JSON.parse(row.items);
    } catch (e) {
      parsedItems = [row.items];
    }
  }

  let parsedTimeline = [];
  if (Array.isArray(row.timeline)) {
    parsedTimeline = row.timeline;
  } else if (typeof row.timeline === 'string') {
    try {
      parsedTimeline = JSON.parse(row.timeline);
    } catch (e) {
      parsedTimeline = [];
    }
  }

  return {
    ...row,
    id: row.id,
    customer: row.customer,
    address: row.address,
    items: parsedItems,
    status: row.status,
    priority: row.priority,
    partnerId: row.partner_id || row.delivery_partner_id,
    partner_id: row.partner_id || row.delivery_partner_id,
    partner: row.partner_name || row.partner || null,
    partner_name: row.partner_name || row.partner || null,
    estimatedDelivery: row.estimated_delivery || row.estimatedDelivery,
    estimated_delivery: row.estimated_delivery || row.estimatedDelivery,
    originalEstimate: row.original_estimate || row.originalEstimate,
    original_estimate: row.original_estimate || row.originalEstimate,
    placedAt: row.placed_at || row.created_at || row.placedAt,
    placed_at: row.placed_at || row.created_at || row.placedAt,
    amount: parseFloat(row.amount || 0),
    timeline: parsedTimeline,
    customerUpdate: row.customer_update || row.customerUpdate || null,
    customer_update: row.customer_update || row.customerUpdate || null
  };
}

// POST /api/orders (Owner only)
router.post('/', authenticate, requireRole(['owner']), async (req, res, next) => {
  try {
    const validated = createOrderSchema.parse(req.body);

    const orderId = validated.id ? validated.id.toUpperCase() : `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const partnerId = validated.partner_id || validated.partnerId || null;
    const estDelivery = validated.estimated_delivery || validated.estimatedDelivery || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Check uniqueness of Order ID
    const exists = await db.query('SELECT id FROM orders WHERE id = $1', [orderId]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: `Order with ID ${orderId} already exists` });
    }

    const defaultTimeline = [
      { time: new Date().toISOString(), event: 'Order placed', status: 'completed' },
      { time: new Date().toISOString(), event: 'Payment confirmed', status: 'completed' }
    ];

    const result = await db.query(`
      INSERT INTO orders (
        id, customer, address, items, status, priority, partner_id, 
        estimated_delivery, original_estimate, placed_at, amount, timeline
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      orderId,
      validated.customer,
      validated.address,
      JSON.stringify(validated.items),
      'processing',
      validated.priority,
      partnerId,
      estDelivery,
      estDelivery,
      new Date().toISOString(),
      validated.amount,
      JSON.stringify(defaultTimeline)
    ]);

    // If assigned to a partner, create initial task
    if (partnerId) {
      const taskId = `TASK-${Date.now().toString().slice(-3)}`;
      await db.query(`
        INSERT INTO tasks (id, order_id, partner_id, status, priority, scheduled_time, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        taskId,
        orderId,
        partnerId,
        'pending',
        validated.priority,
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        `Initial delivery task for ${validated.customer}`
      ]);
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: formatOrderResponse(result.rows[0])
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

// GET /api/orders (Authenticated)
router.get('/', authenticate, async (req, res, next) => {
  try {
    let result;
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;

    if (userRole === 'owner') {
      result = await db.query(`
        SELECT o.*, u.name as partner_name 
        FROM orders o 
        LEFT JOIN users u ON (o.partner_id = u.id OR o.delivery_partner_id = u.id)
        ORDER BY o.created_at DESC
      `);
    } else if (userRole === 'customer') {
      result = await db.query(`
        SELECT o.*, u.name as partner_name 
        FROM orders o 
        LEFT JOIN users u ON (o.partner_id = u.id OR o.delivery_partner_id = u.id)
        WHERE o.customer_id = $1 OR o.customer = $2 OR o.customer = $3
        ORDER BY o.created_at DESC
      `, [userId, req.user.name, req.user.email]);
    } else {
      // Delivery Partner: only see orders assigned to their userId
      result = await db.query(`
        SELECT o.*, u.name as partner_name 
        FROM orders o 
        LEFT JOIN users u ON (o.partner_id = u.id OR o.delivery_partner_id = u.id)
        WHERE o.partner_id = $1 OR o.delivery_partner_id = $1
        ORDER BY o.created_at DESC
      `, [userId]);
    }

    const orders = result.rows.map(formatOrderResponse);
    res.json({ orders });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id (Public / Authenticated)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT o.*, u.name as partner_name 
      FROM orders o 
      LEFT JOIN users u ON (o.partner_id = u.id OR o.delivery_partner_id = u.id)
      WHERE o.id = $1
    `, [id.toUpperCase()]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Order ${id.toUpperCase()} not found` });
    }

    const rawOrder = result.rows[0];

    // Check access rules if authentication token is present
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'orderpilot_secret_jwt_key');
        const userId = decoded.userId || decoded.id;
        
        // If logged in as partner, verify order is assigned to partner
        if (decoded.role === 'delivery_partner' && (rawOrder.partner_id !== userId && rawOrder.delivery_partner_id !== userId)) {
          return res.status(403).json({ error: 'Forbidden. Order is not assigned to your account.' });
        }
      } catch (tokenErr) {
        // Ignore invalid token for public tracking
      }
    }

    res.json({ order: formatOrderResponse(rawOrder) });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/orders/:id/status (Authenticated)
router.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = updateStatusSchema.parse(req.body);
    const userId = req.user.userId || req.user.id;

    const orderResult = await db.query('SELECT * FROM orders WHERE id = $1', [id.toUpperCase()]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Access control: Delivery Partner can only update assigned orders
    if (req.user.role === 'delivery_partner' && (order.partner_id !== userId && order.delivery_partner_id !== userId)) {
      return res.status(403).json({ error: 'Forbidden. Order is not assigned to your account.' });
    }

    let timeline = [];
    if (Array.isArray(order.timeline)) {
      timeline = order.timeline;
    } else if (typeof order.timeline === 'string') {
      try { timeline = JSON.parse(order.timeline); } catch (e) { timeline = []; }
    }

    const eventMsg = validated.eventMessage || `Status updated to ${validated.status}`;
    timeline.push({
      time: new Date().toISOString(),
      event: eventMsg,
      status: validated.status === 'delivered' ? 'completed' : 'in-progress'
    });

    const updateResult = await db.query(`
      UPDATE orders 
      SET status = $1, timeline = $2 
      WHERE id = $3 
      RETURNING *
    `, [validated.status, JSON.stringify(timeline), id.toUpperCase()]);

    res.json({
      message: 'Order status updated successfully',
      order: formatOrderResponse(updateResult.rows[0])
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

module.exports = router;
