const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
let genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

async function analyzeComplaint(orderOrOrders, complaintText) {
  const orders = Array.isArray(orderOrOrders) ? orderOrOrders : [orderOrOrders];
  const primaryOrder = orders[0] || { id: 'ORD-GENERIC', customer: 'Customer', items: [] };

  if (!genAI) {
    return getFallbackAnalysis(orders, complaintText);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
You are the "ComplaintAnalysisAgent" of OrderPilot AI.
Analyze the following customer query or delivery complaint, match it to the correct order if multiple orders exist, and return structured JSON.

Customer Name: ${primaryOrder.customer || 'Customer'}

Customer's Active Orders:
${orders.map(o => `
- ID: ${o.id || o.orderNumber}
  Status: ${o.status}
  Items: ${JSON.stringify(o.items || [])}
  Location: ${o.current_location || o.address || 'Unknown'}
  Estimated Delivery: ${o.estimatedDelivery || o.estimated_delivery || 'Unknown'}
`).join('\n')}

Customer's Message/Query:
"${complaintText}"

Respond ONLY with parseable JSON containing:
1. "category": string (One of: "Delivery Delay", "Wrong Item", "Damaged Package", "Missing Item", "Billing/Payment", "Other")
2. "sentiment": string (One of: "frustrated", "angry", "concerned", "neutral")
3. "summary": string (Max 2 sentence clear executive summary for internal/owner use)
4. "keyIssues": array of strings
5. "customerReply": string (A very short, sweet, conversational, and direct response to the customer in the first-person from you, the AI support assistant. Keep it extremely concise: strictly 1-2 short sentences. Address the customer by name if available. Locate which product or order they are asking about from the list, mention the status and location of that specific order clearly and succinctly. If they ask about an item not present in any of their orders, politely and briefly state that none of their active orders contain that item and name what they did order.)
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
      keyIssues: parsed.keyIssues || ['Unresolved shipment update'],
      customerReply: parsed.customerReply || 'Thank you for reaching out. We have received your query and are looking into it.'
    };
  } catch (err) {
    console.error('ComplaintAnalysisAgent Error, using fallback:', err.message);
    return getFallbackAnalysis(orders, complaintText);
  }
}

function getFallbackAnalysis(orders, text) {
  const primaryOrder = orders[0] || { id: 'ORD-GENERIC', customer: 'Customer', items: [] };
  const t = text.toLowerCase();
  let category = 'Other';
  let sentiment = 'concerned';
  const customerName = primaryOrder.customer ? primaryOrder.customer.split(' ')[0] : 'there';
  
  // Try to find if any order matches a keyword in the text
  let matchedOrder = primaryOrder;
  for (const o of orders) {
    const itemsStr = JSON.stringify(o.items || []).toLowerCase();
    if (t.includes('watch') || t.includes('fitness')) {
      if (itemsStr.includes('watch') || itemsStr.includes('fitness')) {
        matchedOrder = o;
        break;
      }
    } else if (t.includes('earbud') || t.includes('phone') || t.includes('case')) {
      if (itemsStr.includes('earbud') || itemsStr.includes('phone') || itemsStr.includes('case')) {
        matchedOrder = o;
        break;
      }
    }
  }

  let customerReply = `Hi ${customerName}! I've received your query. Let me look into this for you.`;

  if (t.includes('delay') || t.includes('late') || t.includes('wait') || t.includes('arrive')) {
    category = 'Delivery Delay';
    sentiment = 'frustrated';
    customerReply = `Hi ${customerName}, order ${matchedOrder.id} is delayed. I'll check its status at ${matchedOrder.current_location || 'the local hub'} immediately.`;
  } else if (t.includes('wrong') || t.includes('incorrect') || t.includes('color')) {
    category = 'Wrong Item';
    sentiment = 'frustrated';
    customerReply = `Hi ${customerName}, I apologize for the mix-up with order ${matchedOrder.id}. We'll get the correct items to you quickly.`;
  } else if (t.includes('damage') || t.includes('broken') || t.includes('torn')) {
    category = 'Damaged Package';
    sentiment = 'angry';
    customerReply = `Hi ${customerName}, I'm sorry your package for order ${matchedOrder.id} arrived damaged. We are arranging a replacement.`;
  } else if (t.includes('missing') || t.includes('lost')) {
    category = 'Missing Item';
    sentiment = 'angry';
    customerReply = `Hi ${customerName}, I apologize for the missing item in order ${matchedOrder.id}. We will dispatch it immediately.`;
  } else if (t.includes('water') || t.includes('bottle') || t.includes('steel')) {
    category = 'Other';
    sentiment = 'concerned';
    let found = false;
    for (const o of orders) {
      if (JSON.stringify(o.items || []).toLowerCase().includes('bottle') || JSON.stringify(o.items || []).toLowerCase().includes('water')) {
        customerReply = `Hi ${customerName}! Order ${o.id} containing your water bottle is ${o.status || 'processing'}.`;
        found = true;
        break;
      }
    }
    if (!found) {
      const itemsList = matchedOrder.items && matchedOrder.items.length > 0 ? matchedOrder.items.join(', ') : 'Wireless Earbuds, Phone Case';
      customerReply = `Hi ${customerName}, none of your active orders contain a steel water bottle (order ${matchedOrder.id} has ${itemsList}).`;
    }
  } else if (t.includes('watch') || t.includes('fitness')) {
    category = 'Other';
    sentiment = 'neutral';
    customerReply = `Hi ${customerName}! Your Smart Fitness Watch (${matchedOrder.id}) is currently ${matchedOrder.status || 'in-transit'} and estimated for delivery on ${matchedOrder.estimatedDelivery || matchedOrder.estimated_delivery || '2026-08-06'}.`;
  }

  return {
    category,
    sentiment,
    summary: `Customer expressed concerns regarding ${category.toLowerCase()} for order ${matchedOrder.id}.`,
    keyIssues: [`Issue categorized as ${category}`],
    customerReply
  };
}

module.exports = { analyzeComplaint };
