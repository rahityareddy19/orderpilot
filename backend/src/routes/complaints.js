const express = require('express');
const router = express.Router();
const { z } = require('zod');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { analyzeComplaint } = require('../services/gemini');

const createComplaintSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  issueType: z.string().optional(), // Can be analyzed/updated by AI
  message: z.string().min(5, 'Complaint details must be at least 5 characters')
});

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
    console.log('Gemini Analysis Result:', aiAnalysis);

    // Generate unique Complaint ID
    const complaintId = `CMP-${Date.now().toString().slice(-4)}`;

    // 3. Save complaint
    const complaintResult = await db.query(`
      INSERT INTO complaints (
        id, order_id, customer, issue_type, message, status, urgency, ai_summary, ai_suggestion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
      aiAnalysis.aiSuggestion
    ]);

    const complaint = complaintResult.rows[0];

    // 4. Update the order with the AI summary in customer_update
    await db.query(`
      UPDATE orders 
      SET customer_update = $1, priority = $2
      WHERE id = $3
    `, [aiAnalysis.aiSummary, aiAnalysis.urgency === 'high' ? 'high' : order.priority, orderId]);

    // 5. Automatically create a task if not delivered or cancelled, and assign to partner
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
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // scheduled for tomorrow
        taskNotes
      ]);
    }

    // 6. Create notification
    const notificationTitle = `Customer complaint: ${order.customer} — ${aiAnalysis.issueType}`;
    await db.query(`
      INSERT INTO notifications (title, type, severity)
      VALUES ($1, $2, $3)
    `, [
      notificationTitle,
      'complaint',
      aiAnalysis.urgency === 'high' ? 'high' : 'medium'
    ]);

    // 7. Create AI activity logs
    const logId1 = `AI-${Date.now().toString().slice(-3)}A`;
    const logId2 = `AI-${Date.now().toString().slice(-3)}B`;
    
    await db.query(`
      INSERT INTO ai_activity_logs (id, action, type, related_to)
      VALUES 
        ($1, $2, 'categorization', $3),
        ($4, $5, 'auto-reply', $3)
    `, [
      logId1,
      `Auto-categorized complaint ${complaintId} as "${aiAnalysis.issueType}" and assigned "${aiAnalysis.urgency}" urgency.`,
      complaintId,
      logId2,
      `Auto-replied to ${order.customer} with updated delivery ETA and apology message.`,
    ]);

    res.status(201).json({
      message: 'Complaint submitted and processed by AI pilot successfully',
      complaint
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

// GET /api/complaints (Owner only)
router.get('/', authenticate, requireRole(['owner']), async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM complaints ORDER BY created_at DESC');
    res.json({ complaints: result.rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
