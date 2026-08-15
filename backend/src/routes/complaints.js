const express = require('express');
const router = express.Router();
const { z } = require('zod');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { analyzeComplaint } = require('../services/gemini');

const createComplaintSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  issueType: z.string().optional(),
  message: z.string().min(5, 'Complaint details must be at least 5 characters')
});

function formatComplaintResponse(row) {
  return {
    id: row.id,
    orderId: row.order_id || row.orderId,
    order_id: row.order_id || row.orderId,
    customer: row.customer,
    issueType: row.issue_type || row.category || row.issueType,
    issue_type: row.issue_type || row.category || row.issueType,
    category: row.category || row.issue_type || row.issueType,
    message: row.message || row.complaint_text,
    complaint_text: row.complaint_text || row.message,
    status: row.status,
    urgency: row.urgency,
    aiSummary: row.ai_summary || row.aiSummary,
    ai_summary: row.ai_summary || row.aiSummary,
    aiSuggestion: row.ai_suggestion || row.aiSuggestion,
    ai_suggestion: row.ai_suggestion || row.aiSuggestion,
    requiresApproval: row.requires_approval !== false,
    requires_approval: row.requires_approval !== false,
    approved: Boolean(row.approved),
    createdAt: row.created_at || row.createdAt,
    created_at: row.created_at || row.createdAt
  };
}

// POST /api/complaints (Public Route)
router.post('/', async (req, res, next) => {
  try {
    const validated = createComplaintSchema.parse(req.body);
    const orderId = validated.orderId.toUpperCase();

    // 1. Find corresponding order
    const orderResult = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: `Order ${orderId} not found. Please verify the ID.` });
    }

    const order = orderResult.rows[0];

    // 2. Send details to Gemini for analysis
    console.log(`Analyzing complaint for order ${orderId} via Gemini...`);
    const aiAnalysis = await analyzeComplaint(order, validated.message);

    // Generate unique Complaint ID
    const complaintId = `CMP-${Date.now().toString().slice(-4)}`;

    // 3. Save complaint
    const complaintResult = await db.query(`
      INSERT INTO complaints (
        id, order_id, customer, issue_type, message, status, urgency, ai_summary, ai_suggestion, requires_approval, approved
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      complaintId,
      orderId,
      order.customer,
      aiAnalysis.issueType,
      validated.message,
      'open',
      aiAnalysis.urgency,
      aiAnalysis.aiSummary,
      aiAnalysis.aiSuggestion,
      aiAnalysis.requiresApproval,
      false
    ]);

    const complaint = complaintResult.rows[0];

    // 4. Update order with customer_update & priority
    await db.query(`
      UPDATE orders 
      SET customer_update = $1, priority = $2
      WHERE id = $3
    `, [aiAnalysis.aiSummary, aiAnalysis.urgency === 'high' ? 'high' : order.priority, orderId]);

    // 5. Automatically create a task if not delivered/cancelled
    if (order.status !== 'delivered' && order.status !== 'cancelled') {
      const taskId = `TASK-${Date.now().toString().slice(-3)}`;
      const taskNotes = `AI Generated task following complaint: ${aiAnalysis.aiSuggestion}`;
      await db.query(`
        INSERT INTO tasks (id, order_id, partner_id, status, priority, scheduled_time, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
      `, [
        taskId,
        orderId,
        order.partner_id || null,
        'pending',
        aiAnalysis.urgency === 'high' ? 'high' : 'normal',
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        taskNotes
      ]);
    }

    // 6. Create notification
    const notificationTitle = `Customer complaint: ${order.customer} — ${aiAnalysis.issueType}`;
    await db.query(`
      INSERT INTO notifications (receiver, message, type)
      VALUES ('owner@orderpilot.ai', $1, 'complaint')
    `, [notificationTitle]);

    res.status(201).json({
      message: 'Complaint submitted and processed by AI pilot successfully',
      complaint: formatComplaintResponse(complaint)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

// GET /api/complaints (Authenticated)
router.get('/', authenticate, async (req, res, next) => {
  try {
    let result;
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;

    if (userRole === 'owner') {
      result = await db.query('SELECT * FROM complaints ORDER BY created_at DESC');
    } else if (userRole === 'customer') {
      result = await db.query(`
        SELECT c.* 
        FROM complaints c
        WHERE c.customer_id = $1
        ORDER BY c.created_at DESC
      `, [userId]);
    } else {
      // Delivery partner
      result = await db.query(`
        SELECT c.* 
        FROM complaints c
        JOIN orders o ON c.order_id = o.id
        WHERE o.partner_id = $1 OR o.delivery_partner_id = $1
        ORDER BY c.created_at DESC
      `, [userId]);
    }

    res.json({ complaints: result.rows.map(formatComplaintResponse) });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/complaints/:id/approve (Owner only)
router.patch('/:id/approve', authenticate, requireRole(['owner']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const complaintResult = await db.query('SELECT * FROM complaints WHERE id = $1', [id]);
    if (complaintResult.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = complaintResult.rows[0];

    const updatedResult = await db.query(`
      UPDATE complaints
      SET approved = true, status = 'resolved'
      WHERE id = $1
      RETURNING *
    `, [id]);

    res.json({
      message: 'Action plan approved and complaint marked resolved',
      complaint: formatComplaintResponse(updatedResult.rows[0])
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
