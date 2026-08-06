async function determinePriority(analysisResult, order) {
  const { category, sentiment } = analysisResult;
  let urgency = 'medium';
  let reasoning = 'Standard priority evaluated based on general complaint indicators.';

  if (category === 'Damaged Package' || category === 'Missing Item' || sentiment === 'angry' || order.status === 'delayed') {
    urgency = 'critical';
    reasoning = `Assigned CRITICAL urgency due to ${category} with ${sentiment} sentiment on a ${order.status} shipment.`;
  } else if (category === 'Delivery Delay' || sentiment === 'frustrated') {
    urgency = 'high';
    reasoning = `Assigned HIGH urgency due to ${category} and customer escalation risk.`;
  } else if (sentiment === 'neutral') {
    urgency = 'low';
    reasoning = `Assigned LOW urgency as customer query is routine and neutral.`;
  }

  return {
    urgency,
    reasoning
  };
}

module.exports = { determinePriority };
