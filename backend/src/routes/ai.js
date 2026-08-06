const express = require('express');
const router = express.Router();
const db = require('../db');
const { analyzeComplaint } = require('../agents/ComplaintAnalysisAgent');
const { determinePriority } = require('../agents/PriorityAgent');
const { createPlan } = require('../agents/PlanningAgent');
const { assignTask } = require('../agents/TaskAssignmentAgent');
const { executeAgentWorkflow } = require('../agents/WorkflowOrchestrator');
const { authenticate, requireRole } = require('../middleware/auth');

// POST /api/ai/workflow (Main Agentic Workflow Endpoint)
router.post('/workflow', async (req, res, next) => {
  try {
    const { orderId, complaintText, customerId } = req.body;
    if (!orderId || !complaintText) {
      return res.status(400).json({ error: 'orderId and complaintText are required' });
    }

    const orderRes = await db.query('SELECT * FROM orders WHERE id = $1', [orderId.toUpperCase()]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: `Order #${orderId} not found` });
    }

    const order = orderRes.rows[0];
    const result = await executeAgentWorkflow(order, complaintText, customerId);

    res.json({
      message: 'Autonomous AI workflow executed successfully',
      result
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/analyze
router.post('/analyze', async (req, res, next) => {
  try {
    const { orderId, complaintText } = req.body;
    const orderRes = await db.query('SELECT * FROM orders WHERE id = $1', [orderId?.toUpperCase()]);
    const order = orderRes.rows[0] || { id: orderId || 'ORD-GENERIC', customer: 'Customer', items: [] };

    const analysis = await analyzeComplaint(order, complaintText || '');
    res.json({ analysis });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/plan
router.post('/plan', async (req, res, next) => {
  try {
    const { orderId, complaintText, category, sentiment } = req.body;
    const orderRes = await db.query('SELECT * FROM orders WHERE id = $1', [orderId?.toUpperCase()]);
    const order = orderRes.rows[0] || { id: orderId || 'ORD-GENERIC', customer: 'Customer', items: [] };

    const analysis = { category: category || 'Delivery Delay', sentiment: sentiment || 'frustrated' };
    const priority = await determinePriority(analysis, order);
    const plan = await createPlan(order, complaintText || '', analysis, priority);

    res.json({ plan, priority });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/assign
router.post('/assign', authenticate, requireRole(['owner']), async (req, res, next) => {
  try {
    const { orderId, complaintId, priorityLevel } = req.body;
    const orderRes = await db.query('SELECT * FROM orders WHERE id = $1', [orderId?.toUpperCase()]);
    const order = orderRes.rows[0] || { id: orderId };

    const task = await assignTask(order, complaintId, { urgency: priorityLevel || 'high' }, { estimatedResolutionMinutes: 90 });
    res.json({ task });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/recommend (Owner Insights)
router.post('/recommend', authenticate, requireRole(['owner']), async (req, res, next) => {
  try {
    const complaintsRes = await db.query("SELECT * FROM complaints WHERE status = 'open' LIMIT 5");
    const recommendations = complaintsRes.rows.map(c => ({
      complaintId: c.id,
      recommendation: `Auto-escalate ${c.category} issue for order #${c.order_id}. Issue severity marked as ${c.urgency}.`
    }));

    res.json({ recommendations });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
