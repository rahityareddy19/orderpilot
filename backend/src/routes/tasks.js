const express = require('express');
const router = express.Router();
const { z } = require('zod');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const updateTaskStatusSchema = z.object({
  status: z.enum(['pending', 'in-progress', 'completed'])
});

// GET /api/tasks (Authenticated)
router.get('/', authenticate, async (req, res, next) => {
  try {
    let result;
    if (req.user.role === 'owner') {
      result = await db.query(`
        SELECT t.*, o.customer, o.address, o.items, o.priority as order_priority, u.name as partner_name
        FROM tasks t
        JOIN orders o ON t.order_id = o.id
        LEFT JOIN users u ON t.partner_id = u.id
        ORDER BY t.scheduled_time ASC
      `);
    } else {
      // Delivery Partner
      result = await db.query(`
        SELECT t.*, o.customer, o.address, o.items, o.priority as order_priority, u.name as partner_name
        FROM tasks t
        JOIN orders o ON t.order_id = o.id
        LEFT JOIN users u ON t.partner_id = u.id
        WHERE t.partner_id = $1
        ORDER BY t.scheduled_time ASC
      `, [req.user.id]);
    }

    // Map DB fields to match frontend's expected properties
    const tasks = result.rows.map(row => ({
      id: row.id,
      orderId: row.order_id,
      customer: row.customer,
      address: row.address,
      items: row.items,
      status: row.status,
      priority: row.priority,
      scheduledTime: row.scheduled_time,
      notes: row.notes
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

    const taskResult = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Access control
    if (req.user.role === 'delivery_partner' && task.partner_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden. Task is not assigned to you.' });
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
      timelineMessage = 'Out for delivery with partner';
    } else if (validated.status === 'completed') {
      mappedOrderStatus = 'delivered';
      timelineMessage = 'Delivered successfully by partner';
    }

    if (mappedOrderStatus) {
      const orderResult = await db.query('SELECT * FROM orders WHERE id = $1', [task.order_id]);
      if (orderResult.rows.length > 0) {
        const order = orderResult.rows[0];
        const timeline = order.timeline || [];
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
