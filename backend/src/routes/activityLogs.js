const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/activity-logs (Owner only)
router.get('/', authenticate, requireRole(['owner']), async (req, res, next) => {
  try {
    const logsRes = await db.query(`
      SELECT id, action, performed_by as "performedBy", details, timestamp
      FROM activity_logs
      ORDER BY timestamp DESC
      LIMIT 50
    `);

    const decisionsRes = await db.query(`
      SELECT id, complaint_id as "complaintId", agent_name as "agentName", reasoning, action_taken as "actionTaken", confidence, timestamp
      FROM ai_decisions
      ORDER BY timestamp DESC
      LIMIT 50
    `);

    res.json({
      activityLogs: logsRes.rows,
      aiDecisions: decisionsRes.rows
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
