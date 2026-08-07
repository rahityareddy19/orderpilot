const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
let genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

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

async function assignPartner(order, availablePartners) {
  if (!genAI) {
    return {
      partnerId: availablePartners[0].id,
      reasoning: "Fallback to first available partner due to missing AI credentials.",
      confidence: 0.5
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
You are the "TaskAssignmentAgent" of OrderPilot AI.
Given a new order and a list of available delivery partners, select the best partner to assign to this order.

Order Details:
Customer: ${order.customer}
Address: ${order.address}
Items: ${JSON.stringify(order.items)}
Priority: ${order.priority}

Available Partners:
${JSON.stringify(availablePartners, null, 2)}

Analyze the data and choose the most appropriate partner ID.
Respond ONLY with parseable JSON containing:
1. "partnerId": number (The ID of the chosen partner)
2. "reasoning": string (A brief sentence explaining why this partner was selected)
3. "confidence": number (Between 0.0 and 1.0)
`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    const parsed = JSON.parse(result.response.text());
    return parsed;
  } catch (error) {
    console.error('TaskAssignmentAgent error:', error);
    return {
      partnerId: availablePartners[0].id,
      reasoning: "Fallback to first available partner due to AI error.",
      confidence: 0.1
    };
  }
}

module.exports = { assignTask, assignPartner };
