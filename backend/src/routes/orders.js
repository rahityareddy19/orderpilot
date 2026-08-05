const express = require('express');
const router = express.Router();
const { z } = require('zod');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const createOrderSchema = z.object({
  id: z.string().min(3, 'Order ID is too short').regex(/^ORD-\d+$/, 'ID must match ORD-XXXX format'),
  customer: z.string().min(2, 'Customer name is required'),
  address: z.string().min(5, 'Delivery address is required'),
  items: z.array(z.string()).nonempty('Order must contain at least one item'),
  amount: z.number().positive('Amount must be positive'),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  partner_id: z.number().nullable().optional(),
  estimated_delivery: z.string().optional(),
  original_estimate: z.string().optional()
});

const updateStatusSchema = z.object({
  status: z.enum(['processing', 'in-transit', 'delayed', 'delivered', 'cancelled']),
  eventMessage: z.string().optional()
});

// POST /api/orders (Owner only)
router.post('/', authenticate, requireRole(['owner']), async (req, res, next) => {
  try {
    const validated = createOrderSchema.parse(req.body);

    // Check uniqueness of Order ID
    const exists = await db.query('SELECT id FROM orders WHERE id = $1', [validated.id]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: `Order with ID ${validated.id} already exists` });
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
      validated.id,
      validated.customer,
      validated.address,
      JSON.stringify(validated.items),
      'processing',
      validated.priority,
      validated.partner_id || null,
      validated.estimated_delivery || new Date().toISOString().split('T')[0],
      validated.original_estimate || new Date().toISOString().split('T')[0],
      new Date().toISOString(),
      validated.amount,
      JSON.stringify(defaultTimeline)
    ]);

    res.status(201).json({
      message: 'Order created successfully',
      order: result.rows[0]
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
    if (req.user.role === 'owner') {
      result = await db.query(`
        SELECT o.*, u.name as partner_name 
        FROM orders o 
        LEFT JOIN users u ON o.partner_id = u.id 
        ORDER BY o.placed_at DESC
      `);
    } else {
      // Delivery Partner: only see assigned orders
      result = await db.query(`
        SELECT o.*, u.name as partner_name 
        FROM orders o 
        LEFT JOIN users u ON o.partner_id = u.id 
        WHERE o.partner_id = $1 
        ORDER BY o.placed_at DESC
      `, [req.user.id]);
    }

    res.json({ orders: result.rows });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id (Authenticated/Public-friendly)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT o.*, u.name as partner_name 
      FROM orders o 
      LEFT JOIN users u ON o.partner_id = u.id 
      WHERE o.id = $1
    `, [id.toUpperCase()]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = result.rows[0];

    // Check access rules if authentication header exists
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // If logged in as partner, ensure order is assigned
        if (decoded.role === 'delivery_partner' && order.partner_id !== decoded.id) {
          return res.status(403).json({ error: 'Forbidden. Order is not assigned to you.' });
        }
      } catch (tokenErr) {
        // Continue as public tracking
      }
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/orders/:id/status (Authenticated)
router.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = updateStatusSchema.parse(req.body);

    const orderResult = await db.query('SELECT * FROM orders WHERE id = $1', [id.toUpperCase()]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Access control
    if (req.user.role === 'delivery_partner' && order.partner_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden. Order is not assigned to you.' });
    }

    // Append to timeline JSONB
    const timeline = order.timeline || [];
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
      order: updateResult.rows[0]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

module.exports = router;
