const db = require('../db');
const { logActivity } = require('./ActivityAgent');

async function checkAndEscalateOverdue() {
  try {
    const overdueTasks = await db.query(`
      SELECT t.*, c.customer_id, c.order_id
      FROM tasks t
      JOIN complaints c ON t.complaint_id = c.id
      WHERE t.completed = false AND t.due_time < NOW()
    `);

    for (const task of overdueTasks.rows) {
      await db.query(`
        UPDATE complaints SET status = 'escalated', urgency = 'critical' WHERE id = $1
      `, [task.complaint_id]);

      await db.query(`
        INSERT INTO notifications (receiver, message, type)
        VALUES ('owner@orderpilot.ai', $1, 'alert')
      `, [`ESCALATION WARNING: Task #${task.id} for order #${task.order_id} has passed its resolution deadline.`]);

      await logActivity('AUTOMATED_TASK_ESCALATION', 'MonitoringAgent', { taskId: task.id, complaintId: task.complaint_id });
    }
  } catch (err) {
    console.error('MonitoringAgent error during audit run:', err.message);
  }
}

module.exports = { checkAndEscalateOverdue };
