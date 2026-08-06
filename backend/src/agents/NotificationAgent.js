async function generateNotifications(order, complaint, priority, task) {
  const notifications = [
    {
      receiver: 'owner@orderpilot.ai',
      message: `${priority.urgency.toUpperCase()} Complaint filed for Order #${order.id}: ${complaint.category}`,
      type: 'complaint'
    },
    {
      receiver: 'partner@orderpilot.ai',
      message: `New ${priority.urgency} task assigned for Order #${order.id}: ${task.description}`,
      type: 'delivery'
    },
    {
      receiver: 'customer@orderpilot.ai',
      message: `OrderPilot AI has assigned resolution plan for Order #${order.id}. Estimated resolution in 90 mins.`,
      type: 'info'
    }
  ];

  return notifications;
}

module.exports = { generateNotifications };
