const express = require('express');
const router = express.Router();
const { z } = require('zod');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const updateTaskStatusSchema = z.object({
  status: z.enum(['pending', 'in-progress', 'completed'])
});

function parseItems(itemsVal) {
  if (Array.isArray(itemsVal)) return itemsVal;
  if (typeof itemsVal === 'string') {
    try { return JSON.parse(itemsVal); } catch (e) { return [itemsVal]; }
  }
  return [];
}

// GET /api/tasks (Authenticated)
router.get('/', authenticate, async (req, res, next) => {
  try {
    let result;
    const userId = req.user.userId || req.user.id;

    if (req.user.role === 'owner') {
      result = await db.query(`
        SELECT t.*, o.customer, o.address, o.items, o.priority as order_priority, u.name as partner_name
        FROM tasks t
        JOIN orders o ON t.order_id = o.id
        LEFT JOIN users u ON t.partner_id = u.id
        ORDER BY t.scheduled_time ASC
      `);
    } else {
      // Delivery Partner: only see tasks assigned to their userId
      result = await db.query(`
        SELECT t.*, o.customer, o.address, o.items, o.priority as order_priority, u.name as partner_name
        FROM tasks t
        JOIN orders o ON t.order_id = o.id
        LEFT JOIN users u ON t.partner_id = u.id
        WHERE t.partner_id = $1
        ORDER BY t.scheduled_time ASC
      `, [userId]);
    }

    const tasks = result.rows.map(row => ({
      id: row.id,
      orderId: row.order_id,
      order_id: row.order_id,
      customer: row.customer,
      address: row.address,
      items: parseItems(row.items),
      status: row.status,
      priority: row.priority,
      scheduledTime: row.scheduled_time,
      scheduled_time: row.scheduled_time,
      notes: row.notes,
      partnerName: row.partner_name
    }));

    res.json({ tasks });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tasks/:id/status (Authenticated)
router.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = updateTaskStatusSchema.parse(req.body);
    const userId = req.user.userId || req.user.id;

    const taskResult = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Access control: Delivery Partner can only update tasks assigned to their userId
    if (req.user.role === 'delivery_partner' && task.partner_id !== userId) {
      return res.status(403).json({ error: 'Forbidden. Task is not assigned to your account.' });
    }

    // Update task status
    const updateResult = await db.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
      [validated.status, id]
    );

    // Sync order status and timeline
    let mappedOrderStatus;
    let timelineMessage;
    if (validated.status === 'in-progress') {
      mappedOrderStatus = 'in-transit';
      timelineMessage = 'Out for delivery with delivery partner';
    } else if (validated.status === 'completed') {
      mappedOrderStatus = 'delivered';
      timelineMessage = 'Delivered successfully by delivery partner';
    }

    if (mappedOrderStatus) {
      const orderResult = await db.query('SELECT * FROM orders WHERE id = $1', [task.order_id]);
      if (orderResult.rows.length > 0) {
        const order = orderResult.rows[0];
        let timeline = [];
        if (Array.isArray(order.timeline)) {
          timeline = order.timeline;
        } else if (typeof order.timeline === 'string') {
          try { timeline = JSON.parse(order.timeline); } catch (e) { timeline = []; }
        }

        timeline.push({
          time: new Date().toISOString(),
          event: timelineMessage,
          status: validated.status === 'completed' ? 'completed' : 'in-progress'
        });

        await db.query(
          'UPDATE orders SET status = $1, timeline = $2 WHERE id = $3',
          [mappedOrderStatus, JSON.stringify(timeline), task.order_id]
        );
      }
    }

    res.json({
      message: 'Task status updated successfully',
      task: updateResult.rows[0]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

module.exports = router;
