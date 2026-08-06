const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/dashboard/stats (Owner only)
router.get('/stats', authenticate, requireRole(['owner']), async (req, res, next) => {
  try {
    const totalOrdersRes = await db.query('SELECT COUNT(*) FROM orders');
    const delayedOrdersRes = await db.query("SELECT COUNT(*) FROM orders WHERE status = 'delayed'");
    const openComplaintsRes = await db.query("SELECT COUNT(*) FROM complaints WHERE status = 'open'");
    const aiActionsRes = await db.query('SELECT COUNT(*) FROM ai_activity_logs');

    res.json({
      stats: {
        totalOrders: parseInt(totalOrdersRes.rows[0].count, 10),
        delayedOrders: parseInt(delayedOrdersRes.rows[0].count, 10),
        openComplaints: parseInt(openComplaintsRes.rows[0].count, 10),
        aiActions: parseInt(aiActionsRes.rows[0].count, 10)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/urgent-issues (Owner only)
router.get('/urgent-issues', authenticate, requireRole(['owner']), async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT id, title, type, severity 
      FROM notifications 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    res.json({ urgentIssues: result.rows });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/ai-activity (Owner only)
router.get('/ai-activity', authenticate, requireRole(['owner']), async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT id, action, type, timestamp, related_to as "relatedTo"
      FROM ai_activity_logs 
      ORDER BY timestamp DESC 
      LIMIT 15
    `);

    res.json({ aiActivity: result.rows });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/approvals (Owner only)
router.get('/approvals', authenticate, requireRole(['owner']), async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT id, order_id as "orderId", customer, issue_type as "issueType", message, urgency, ai_summary as "aiSummary", ai_suggestion as "aiSuggestion", created_at as "createdAt"
      FROM complaints
      WHERE requires_approval = true AND approved = false
      ORDER BY created_at DESC
    `);

    res.json({ approvalRequests: result.rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
