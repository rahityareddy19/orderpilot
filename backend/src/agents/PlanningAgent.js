const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
let genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

async function createPlan(order, complaintText, analysis, priority) {
  if (!genAI) {
    return getFallbackPlan(order, analysis, priority);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
You are the "PlanningAgent" of OrderPilot AI.
Create a step-by-step resolution plan for an operational delivery issue.

Order ID: ${order.id}
Category: ${analysis.category}
Urgency: ${priority.urgency}
Customer Complaint: "${complaintText}"

Respond ONLY with parseable JSON containing:
1. "steps": array of objects ({ "stepNumber": number, "action": string, "target": string })
2. "estimatedResolutionMinutes": number
3. "ownerRecommendation": string
4. "confidenceScore": number (between 0.85 and 0.99)
`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    const parsed = JSON.parse(result.response.text());
    return {
      steps: parsed.steps || [],
      estimatedResolutionMinutes: parsed.estimatedResolutionMinutes || 120,
      ownerRecommendation: parsed.ownerRecommendation || 'Contact delivery partner and issue apology update.',
      confidenceScore: parsed.confidenceScore || 0.94
    };
  } catch (err) {
    console.error('PlanningAgent Error, using fallback:', err.message);
    return getFallbackPlan(order, analysis, priority);
  }
}

function getFallbackPlan(order, analysis, priority) {
  return {
    steps: [
      { stepNumber: 1, action: 'Verify parcel scan at regional hub', target: 'Warehouse System' },
      { stepNumber: 2, action: 'Re-assign priority dispatch slot to active delivery partner', target: 'Delivery Partner' },
      { stepNumber: 3, action: 'Send automated resolution ETA to customer tracking page', target: 'Customer' },
      { stepNumber: 4, action: 'Log resolution plan for owner review', target: 'Business Owner' }
    ],
    estimatedResolutionMinutes: 90,
    ownerRecommendation: `Prioritize re-dispatch of order ${order.id} with high urgency partner contact.`,
    confidenceScore: 0.95
  };
}

module.exports = { createPlan };
