async function assignTask(order, complaintId, priority, plan) {
  const taskId = `TASK-${Date.now().toString().slice(-4)}`;
  const partnerId = order.delivery_partner_id || order.partner_id || null;
  const minutes = plan.estimatedResolutionMinutes || 120;
  const dueTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();

  const description = `Prioritize order ${order.id} resolution: ${plan.ownerRecommendation || 'Execute expedited delivery attempt.'}`;

  return {
    taskId,
    complaintId,
    assignedTo: partnerId,
    priority: priority.urgency,
    description,
    dueTime,
    completed: false
  };
}

module.exports = { assignTask };
