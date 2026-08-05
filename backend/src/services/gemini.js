const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize the Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (err) {
    console.error('Failed to initialize Gemini API:', err);
  }
} else {
  console.warn('GEMINI_API_KEY not found in environment variables. Running in Mock AI mode.');
}

async function analyzeComplaint(order, complaintMessage) {
  if (!genAI) {
    console.log('Gemini API key not configured. Using Mock AI response fallback.');
    return getFallbackAnalysis(order, complaintMessage);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const orderContext = {
      orderId: order.id,
      customer: order.customer,
      items: order.items,
      status: order.status,
      priority: order.priority,
      address: order.address,
      placedAt: order.placed_at,
      timeline: order.timeline,
      estimatedDelivery: order.estimated_delivery,
      originalEstimate: order.original_estimate
    };

    const prompt = `
You are the AI assistant for "OrderPilot AI", a delivery management SaaS.
Your job is to analyze a customer complaint for an order and provide structured intelligence.

Order Details:
${JSON.stringify(orderContext, null, 2)}

Customer Complaint Message:
"${complaintMessage}"

You must respond with a JSON object containing exactly the following keys:
1. "issueType": string - must be one of: ["Delivery Delay", "Wrong Item", "Damaged Package", "Missing Item", "Payment Issue", "Other"]
2. "urgency": string - must be one of: ["low", "medium", "high"]
3. "aiSummary": string - A concise, empathetic summary of what happened to explain to the customer. Max 2 sentences.
4. "aiSuggestion": string - An actionable, step-by-step internal suggestion for the business owner to resolve the issue. Max 2 sentences.
5. "requiresApproval": boolean - true if human business owner approval is recommended before performing the suggestion, false if it can be auto-executed.

Response format must be valid, parseable JSON. Do not include markdown formatting or backticks.
`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = result.response.text();
    console.log('Gemini raw response:', responseText);

    const parsed = JSON.parse(responseText);
    
    // Ensure properties exist and values are validated
    return {
      issueType: parsed.issueType || 'Other',
      urgency: parsed.urgency || 'medium',
      aiSummary: parsed.aiSummary || 'We have received your complaint and our support team is looking into it.',
      aiSuggestion: parsed.aiSuggestion || 'Review complaint details and check with the delivery partner.',
      requiresApproval: parsed.requiresApproval !== undefined ? parsed.requiresApproval : true
    };
  } catch (error) {
    console.error('Error with Gemini API, falling back to local analysis:', error);
    return getFallbackAnalysis(order, complaintMessage);
  }
}

function getFallbackAnalysis(order, message) {
  const msg = message.toLowerCase();
  
  let issueType = 'Other';
  let urgency = 'medium';
  let aiSummary = 'We are investigating the status of your order and will provide updates shortly.';
  let aiSuggestion = 'Contact the delivery partner and verify the current parcel status.';
  let requiresApproval = true;

  if (msg.includes('delay') || msg.includes('late') || msg.includes('arrive') || msg.includes('wait')) {
    issueType = 'Delivery Delay';
    urgency = order.priority === 'high' ? 'high' : 'medium';
    aiSummary = `Your order ${order.id} was delayed. We are scheduling an expedited delivery window for you.`;
    aiSuggestion = `Contact delivery partner to prioritize order ${order.id}. Offer customer a 10% coupon for the delay.`;
  } else if (msg.includes('wrong') || msg.includes('color') || msg.includes('incorrect') || msg.includes('different')) {
    issueType = 'Wrong Item';
    urgency = 'medium';
    aiSummary = 'We apologize for sending the wrong item. We are arranging a replacement shipment and a free return label.';
    aiSuggestion = 'Create a return shipment label for wrong items. Ship correct order items from stock.';
    requiresApproval = false;
  } else if (msg.includes('damage') || msg.includes('broken') || msg.includes('torn') || msg.includes('defective')) {
    issueType = 'Damaged Package';
    urgency = 'high';
    aiSummary = 'We are sorry that your order arrived damaged. We will initiate a direct replacement order immediately.';
    aiSuggestion = 'Submit product inventory replacement. Flag product line for quality inspection.';
    requiresApproval = true;
  } else if (msg.includes('missing') || msg.includes('lost') || msg.includes('short')) {
    issueType = 'Missing Item';
    urgency = 'high';
    aiSummary = 'We apologize for the missing item in your package. We will dispatch the remaining items as a high-priority shipment.';
    aiSuggestion = 'Crosscheck package shipment weight metrics. Dispatch missing items immediately.';
    requiresApproval = false;
  }

  return {
    issueType,
    urgency,
    aiSummary,
    aiSuggestion,
    requiresApproval
  };
}

module.exports = {
  analyzeComplaint
};
