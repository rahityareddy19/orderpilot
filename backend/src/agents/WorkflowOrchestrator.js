const db = require('../db');
const { analyzeComplaint } = require('./ComplaintAnalysisAgent');
const { determinePriority } = require('./PriorityAgent');
const { createPlan } = require('./PlanningAgent');
const { assignTask } = require('./TaskAssignmentAgent');
const { generateNotifications } = require('./NotificationAgent');
const { logAIDecisions, logActivity } = require('./ActivityAgent');

async function executeAgentWorkflow(order, complaintText, customerId = null) {
  console.log(`[WorkflowOrchestrator] Initiating Multi-Agent Pipeline for Order #${order.id}...`);

  // 1. Complaint Analysis Agent
  const analysis = await analyzeComplaint(order, complaintText);
  const complaintId = `CMP-${Date.now().toString().slice(-4)}`;

  // Save complaint record to DB
  await db.query(`
    INSERT INTO complaints (id, order_id, customer_id, complaint_text, category, urgency, sentiment, ai_summary, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [
    complaintId,
    order.id,
    customerId || order.customer_id || null,
    complaintText,
    analysis.category,
    'medium', // Updated next by PriorityAgent
    analysis.sentiment,
    analysis.summary,
    'open'
  ]);

  await logAIDecisions(
    complaintId,
    'ComplaintAnalysisAgent',
    `Analyzed complaint message. Detected category '${analysis.category}' and sentiment '${analysis.sentiment}'.`,
    `Generated executive summary: ${analysis.summary}`,
    0.98
  );

  // 2. Priority Agent
  const priority = await determinePriority(analysis, order);
  await db.query(`
    UPDATE complaints SET urgency = $1 WHERE id = $2
  `, [priority.urgency, complaintId]);

  await logAIDecisions(
    complaintId,
    'PriorityAgent',
    priority.reasoning,
    `Assigned '${priority.urgency}' urgency status to complaint #${complaintId}.`,
    0.95
  );

  // 3. Planning Agent
  const plan = await createPlan(order, complaintText, analysis, priority);
  await db.query(`
    UPDATE complaints 
    SET ai_suggestion = $1, requires_approval = $2
    WHERE id = $3
  `, [plan.ownerRecommendation, true, complaintId]);

  await logAIDecisions(
    complaintId,
    'PlanningAgent',
    `Formulated ${plan.steps.length}-step execution plan with ${plan.estimatedResolutionMinutes} mins resolution window.`,
    `Recommendation: ${plan.ownerRecommendation}`,
    plan.confidenceScore || 0.94
  );

  // 4. Task Assignment Agent
  const taskData = await assignTask(order, complaintId, priority, plan);
  await db.query(`
    INSERT INTO tasks (id, complaint_id, assigned_to, priority, description, due_time, completed)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    taskData.taskId,
    complaintId,
    taskData.assignedTo,
    taskData.priority,
    taskData.description,
    taskData.dueTime,
    false
  ]);

  await logAIDecisions(
    complaintId,
    'TaskAssignmentAgent',
    `Generated operational task #${taskData.taskId} assigned to delivery partner ${taskData.assignedTo || 'Default Partner'}.`,
    `Task created with deadline ${taskData.dueTime}`,
    0.93
  );

  // 5. Notification Agent
  const notifications = await generateNotifications(order, { ...analysis, id: complaintId }, priority, taskData);
  for (const n of notifications) {
    await db.query(`
      INSERT INTO notifications (receiver, message, type)
      VALUES ($1, $2, $3)
    `, [n.receiver, n.message, n.type]);
  }

  await logAIDecisions(
    complaintId,
    'NotificationAgent',
    `Dispatched ${notifications.length} targeted alert notifications to stakeholders.`,
    'Notifications saved to DB feed.',
    0.99
  );

  // 6. Activity Agent
  await logActivity(
    'MULTI_AGENT_WORKFLOW_COMPLETE',
    'WorkflowOrchestrator',
    { complaintId, orderId: order.id, urgency: priority.urgency, taskId: taskData.taskId }
  );

  console.log(`[WorkflowOrchestrator] Multi-Agent Pipeline Completed for Complaint #${complaintId}`);

  return {
    complaintId,
    category: analysis.category,
    sentiment: analysis.sentiment,
    urgency: priority.urgency,
    summary: analysis.summary,
    plan,
    task: taskData,
    notifications
  };
}

module.exports = { executeAgentWorkflow };
