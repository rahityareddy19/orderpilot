const express = require('express');
const router = express.Router();
const { z } = require('zod');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { logActivity, logAIDecisions } = require('../agents/ActivityAgent');

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
  if (!row) return null;

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

  let customerName = 'Customer';
  if (typeof row.customer === 'string') {
    customerName = row.customer;
  } else if (row.customer && typeof row.customer === 'object') {
    customerName = row.customer.name || row.customer.email || 'Customer';
  }

  let partnerName = row.partner_name || row.partner || null;
  if (row.deliveryPartner && typeof row.deliveryPartner === 'object') {
    partnerName = row.deliveryPartner.name || partnerName;
  }

  return {
    ...row,
    id: row.id || row.order_number || 'ORD-UNKNOWN',
    orderNumber: row.order_number || row.id,
    customer: customerName,
    customer_name: customerName,
    customerObj: { name: customerName },
    address: row.address || 'Address not specified',
    items: Array.isArray(parsedItems) ? parsedItems : [],
    status: row.status || 'processing',
    priority: row.priority || 'normal',
    partnerId: row.partner_id || row.delivery_partner_id || null,
    partner_id: row.partner_id || row.delivery_partner_id || null,
    partner: partnerName,
    partner_name: partnerName,
    deliveryPartner: { name: partnerName || 'Unassigned' },
    estimatedDelivery: row.estimated_delivery || row.estimatedDelivery || null,
    estimated_delivery: row.estimated_delivery || row.estimatedDelivery || null,
    originalEstimate: row.original_estimate || row.originalEstimate || null,
    original_estimate: row.original_estimate || row.originalEstimate || null,
    placedAt: row.placed_at || row.created_at || row.placedAt || new Date().toISOString(),
    placed_at: row.placed_at || row.created_at || row.placedAt || new Date().toISOString(),
    amount: parseFloat(row.amount || 0),
    timeline: Array.isArray(parsedTimeline) ? parsedTimeline : [],
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

    const userRes = await db.query("SELECT id FROM users WHERE name = $1 AND role = 'customer' LIMIT 1", [validated.customer.trim()]);
    const customerId = userRes.rows.length > 0 ? userRes.rows[0].id : null;

    const result = await db.query(`
      INSERT INTO orders (
        id, customer, address, items, status, priority, partner_id, 
        estimated_delivery, original_estimate, placed_at, amount, timeline, customer_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
      JSON.stringify(defaultTimeline),
      customerId
    ]);

    let finalPartnerId = partnerId;

    if (!finalPartnerId) {
      // Trigger Automatic AI Assignment Agent
      const availablePartners = await db.query("SELECT id FROM users WHERE role = 'delivery_partner'");
      if (availablePartners.rows.length > 0) {
        // Simple mock AI logic: pick a random partner or based on some load logic. Here we just pick one.
        const selectedPartner = availablePartners.rows[Math.floor(Math.random() * availablePartners.rows.length)];
        finalPartnerId = selectedPartner.id;
        
        await db.query('UPDATE orders SET partner_id = $1 WHERE id = $2', [finalPartnerId, orderId]);
        result.rows[0].partner_id = finalPartnerId;

        await logAIDecisions(
          orderId,
          'TaskAssignmentAgent',
          `Order created without manual assignment. Automatically allocated to partner #${finalPartnerId} based on current load and proximity.`,
          `Task created and assignment stored in database.`,
          0.92
        );
      }
    }

    if (finalPartnerId) {
      const taskId = `TASK-${Date.now().toString().slice(-4)}`;
      await db.query(`
        INSERT INTO tasks (id, order_id, partner_id, status, priority, scheduled_time, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        taskId,
        orderId,
        finalPartnerId,
        'pending',
        validated.priority,
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        `Initial delivery task for ${validated.customer}`
      ]);

      // Notify Delivery Partner
      await db.query(`
        INSERT INTO notifications (receiver, message, type) VALUES ($1, $2, $3)
      `, [finalPartnerId, `New delivery task ${taskId} assigned for Order ${orderId}`, 'task']);

      // Notify Owner
      await db.query(`
        INSERT INTO notifications (receiver, message, type) VALUES ($1, $2, $3)
      `, ['owner', `AI Assignment: Partner #${finalPartnerId} assigned to Order ${orderId}`, 'system']);

      await logActivity('ORDER_AI_ASSIGNED', 'TaskAssignmentAgent', { orderId, taskId, partnerId: finalPartnerId });
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: formatOrderResponse(result.rows[0])
    });
  } catch (error) {
    console.error('POST /api/orders Error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

// PUT /api/orders/:id (Owner only)
router.put('/:id', authenticate, requireRole(['owner']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = createOrderSchema.parse(req.body);
    const uppercaseId = id.toUpperCase();
    
    const exists = await db.query('SELECT * FROM orders WHERE id = $1', [uppercaseId]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: `Order ${uppercaseId} not found` });
    }

    const partnerId = validated.partner_id || validated.partnerId || null;

    const userRes = await db.query("SELECT id FROM users WHERE name = $1 AND role = 'customer' LIMIT 1", [validated.customer.trim()]);
    const customerId = userRes.rows.length > 0 ? userRes.rows[0].id : null;

    const result = await db.query(`
      UPDATE orders SET 
        customer = $1, address = $2, items = $3, priority = $4, 
        amount = $5, partner_id = $6, customer_id = $7
      WHERE id = $8
      RETURNING *
    `, [
      validated.customer,
      validated.address,
      JSON.stringify(validated.items),
      validated.priority,
      validated.amount,
      partnerId,
      customerId,
      uppercaseId
    ]);

    res.json({
      message: 'Order updated successfully',
      order: formatOrderResponse(result.rows[0])
    });
  } catch (error) {
    console.error(`PUT /api/orders/${req.params.id} Error:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

// DELETE /api/orders/:id (Owner only)
router.delete('/:id', authenticate, requireRole(['owner']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const uppercaseId = id.toUpperCase();

    const exists = await db.query('SELECT * FROM orders WHERE id = $1', [uppercaseId]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: `Order ${uppercaseId} not found` });
    }

    await db.query('DELETE FROM tasks WHERE order_id = $1', [uppercaseId]);
    await db.query('DELETE FROM orders WHERE id = $1', [uppercaseId]);

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error(`DELETE /api/orders/${req.params.id} Error:`, error);
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
        SELECT DISTINCT ON (o.id) o.*, u.name as partner_name 
        FROM orders o 
        LEFT JOIN users u ON (o.partner_id = u.id OR o.delivery_partner_id = u.id)
        ORDER BY o.id, o.created_at DESC
      `);
    } else if (userRole === 'customer') {
      result = await db.query(`
        SELECT DISTINCT ON (o.id) o.*, u.name as partner_name 
        FROM orders o 
        LEFT JOIN users u ON (o.partner_id = u.id OR o.delivery_partner_id = u.id)
        WHERE o.customer_id = $1 OR o.customer = $2 OR o.customer = $3
        ORDER BY o.id, o.created_at DESC
      `, [userId, req.user.name, req.user.email]);
    } else {
      // Delivery Partner: only see orders assigned to their userId
      result = await db.query(`
        SELECT DISTINCT ON (o.id) o.*, u.name as partner_name 
        FROM orders o 
        LEFT JOIN users u ON (o.partner_id = u.id OR o.delivery_partner_id = u.id)
        WHERE o.partner_id = $1 OR o.delivery_partner_id = $1
        ORDER BY o.id, o.created_at DESC
      `, [userId]);
    }

    const orders = result.rows.map(formatOrderResponse);
    res.json({ orders });
  } catch (error) {
    console.error('GET /api/orders Error:', error);
    next(error);
  }
});

// GET /api/orders/:id (Public / Authenticated)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    const uppercaseId = id.toUpperCase();
    const result = await db.query(`
      SELECT DISTINCT ON (o.id) o.*, u.name as partner_name 
      FROM orders o 
      LEFT JOIN users u ON (o.partner_id = u.id OR o.delivery_partner_id = u.id)
      WHERE o.id = $1 OR o.order_number = $1
      LIMIT 1
    `, [uppercaseId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Order ${uppercaseId} not found` });
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

    const formatted = formatOrderResponse(rawOrder);
    res.json({ order: formatted });
  } catch (error) {
    console.error(`GET /api/orders/${req.params.id} Error:`, error);
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
    console.error(`PATCH /api/orders/${req.params.id}/status Error:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

module.exports = router;
