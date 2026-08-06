const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
let genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

async function analyzeComplaint(order, complaintText) {
  if (!genAI) {
    return getFallbackAnalysis(order, complaintText);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
You are the "ComplaintAnalysisAgent" of OrderPilot AI.
Analyze the following delivery complaint for an order and return structured JSON.

Order Details:
ID: ${order.id}
Customer: ${order.customer}
Items: ${JSON.stringify(order.items)}
Status: ${order.status}
Location: ${order.current_location || order.address}

Complaint Text:
"${complaintText}"

Respond ONLY with parseable JSON containing:
1. "category": string (One of: "Delivery Delay", "Wrong Item", "Damaged Package", "Missing Item", "Billing/Payment", "Other")
2. "sentiment": string (One of: "frustrated", "angry", "concerned", "neutral")
3. "summary": string (Max 2 sentence clear executive summary)
4. "keyIssues": array of strings
`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    const parsed = JSON.parse(result.response.text());
    return {
      category: parsed.category || 'Delivery Delay',
      sentiment: parsed.sentiment || 'frustrated',
      summary: parsed.summary || 'Customer reported a delivery issue with their shipment.',
      keyIssues: parsed.keyIssues || ['Unresolved shipment update']
    };
  } catch (err) {
    console.error('ComplaintAnalysisAgent Error, using fallback:', err.message);
    return getFallbackAnalysis(order, complaintText);
  }
}

function getFallbackAnalysis(order, text) {
  const t = text.toLowerCase();
  let category = 'Other';
  let sentiment = 'concerned';

  if (t.includes('delay') || t.includes('late') || t.includes('wait') || t.includes('arrive')) {
    category = 'Delivery Delay';
    sentiment = 'frustrated';
  } else if (t.includes('wrong') || t.includes('incorrect') || t.includes('color')) {
    category = 'Wrong Item';
    sentiment = 'frustrated';
  } else if (t.includes('damage') || t.includes('broken') || t.includes('torn')) {
    category = 'Damaged Package';
    sentiment = 'angry';
  } else if (t.includes('missing') || t.includes('lost')) {
    category = 'Missing Item';
    sentiment = 'angry';
  }

  return {
    category,
    sentiment,
    summary: `Customer expressed concerns regarding ${category.toLowerCase()} for order ${order.id}.`,
    keyIssues: [`Issue categorized as ${category}`]
  };
}

module.exports = { analyzeComplaint };
