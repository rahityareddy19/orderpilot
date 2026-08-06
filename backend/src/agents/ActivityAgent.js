const db = require('../db');

async function logAIDecisions(complaintId, agentName, reasoning, actionTaken, confidence = 0.95) {
  const decisionId = `AID-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 10)}`;
  try {
    await db.query(`
      INSERT INTO ai_decisions (id, complaint_id, agent_name, reasoning, action_taken, confidence)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [decisionId, complaintId, agentName, reasoning, actionTaken, confidence]);
  } catch (err) {
    console.error(`Error logging decision for ${agentName}:`, err.message);
  }
}

async function logActivity(action, performedBy, details = {}) {
  try {
    await db.query(`
      INSERT INTO activity_logs (action, performed_by, details)
      VALUES ($1, $2, $3)
    `, [action, performedBy, JSON.stringify(details)]);
  } catch (err) {
    console.error('Error logging activity log:', err.message);
  }
}

module.exports = { logAIDecisions, logActivity };
