const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const apiKey = process.env.GEMINI_API_KEY;
let genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

async function analyzeComplaint(orderOrOrders, complaintText, customerName) {
  const orders = Array.isArray(orderOrOrders) ? orderOrOrders : [orderOrOrders];
  const primaryOrder = orders[0] || { id: 'ORD-GENERIC', customer: 'Customer', items: [] };

  // Use the real logged-in customer name if provided, fall back to order customer field
  const resolvedName = customerName || primaryOrder.customer || 'Customer';

  if (!genAI) {
    return getFallbackAnalysis(orders, complaintText, resolvedName);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
You are the "ComplaintAnalysisAgent" of OrderPilot AI, a friendly and warm customer support assistant.
Analyze the following customer query or delivery complaint, match it to the correct order if multiple orders exist, and return structured JSON.

Customer Name: ${resolvedName}

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
1. "category": string (One of: "Delivery Delay", "Wrong Item", "Damaged Package", "Missing Item", "Billing/Payment", "Greeting", "Other")
2. "sentiment": string (One of: "frustrated", "angry", "concerned", "neutral", "happy")
3. "summary": string (Max 2 sentence clear executive summary for internal/owner use)
4. "keyIssues": array of strings
5. "customerReply": string (A warm, conversational, and direct response to the customer in the first-person from you, the AI support assistant. Keep it extremely concise: strictly 1-2 short sentences. If it's a greeting (hi, hello, hey etc.), respond warmly by name, wish them well, and ask how you can help. Otherwise address the customer by first name, locate which product or order they are asking about from the list, mention the status and location of that specific order clearly and succinctly.)
`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    const parsed = JSON.parse(result.response.text());
    return {
      category: parsed.category || 'Other',
      sentiment: parsed.sentiment || 'neutral',
      summary: parsed.summary || 'Customer reached out via AI support assistant.',
      keyIssues: parsed.keyIssues || ['Support query received'],
      customerReply: parsed.customerReply || `Hi ${resolvedName.split(' ')[0]}! How can I help you today?`
    };
  } catch (err) {
    console.error('ComplaintAnalysisAgent Error, using fallback:', err.message);
    return getFallbackAnalysis(orders, complaintText, resolvedName);
  }
}

function getFallbackAnalysis(orders, text, customerName) {
  const primaryOrder = orders[0] || { id: 'ORD-GENERIC', customer: 'Customer', items: [] };
  const t = text.toLowerCase().trim();
  let category = 'Other';
  let sentiment = 'neutral';
  // Use the passed customerName (real user) or fall back to order field
  const resolvedName = customerName || primaryOrder.customer || 'Customer';
  const firstName = resolvedName.split(' ')[0];
  
  // Try to find if any order matches a keyword in the text
  let matchedOrder = primaryOrder;
  for (const o of orders) {
    const itemsStr = JSON.stringify(o.items || []).toLowerCase();
    if (t.includes('watch') || t.includes('fitness')) {
      if (itemsStr.includes('watch') || itemsStr.includes('fitness')) { matchedOrder = o; break; }
    } else if (t.includes('earbud') || t.includes('phone') || t.includes('case')) {
      if (itemsStr.includes('earbud') || itemsStr.includes('phone') || itemsStr.includes('case')) { matchedOrder = o; break; }
    }
  }

  // --- Greeting detection ---
  const greetingWords = ['hi', 'hello', 'hey', 'howdy', 'hiya', 'greetings', 'good morning', 'good afternoon', 'good evening', 'sup', 'what\'s up', 'wassup'];
  const isGreeting = greetingWords.some(g => t === g || t.startsWith(g + ' ') || t.startsWith(g + ',') || t.startsWith(g + '!'));

  if (isGreeting) {
    return {
      category: 'Greeting',
      sentiment: 'happy',
      summary: `Customer greeted the AI assistant.`,
      keyIssues: [],
      customerReply: `Hello ${firstName}! 😊 Great to hear from you! How was your day? Feel free to ask me about your orders, delivery timelines, or anything else I can help with.`
    };
  }

  let customerReply = `Hi ${firstName}! I've received your query. Let me look into this for you.`;

  if (t.includes('delay') || t.includes('late') || t.includes('wait') || t.includes('arrive')) {
    category = 'Delivery Delay'; sentiment = 'frustrated';
    customerReply = `Hi ${firstName}, order ${matchedOrder.id} is delayed. I'll check its status at ${matchedOrder.current_location || 'the local hub'} right away.`;
  } else if (t.includes('wrong') || t.includes('incorrect') || t.includes('color')) {
    category = 'Wrong Item'; sentiment = 'frustrated';
    customerReply = `Hi ${firstName}, I apologize for the mix-up with order ${matchedOrder.id}. We'll get the correct items to you quickly.`;
  } else if (t.includes('damage') || t.includes('broken') || t.includes('torn')) {
    category = 'Damaged Package'; sentiment = 'angry';
    customerReply = `Hi ${firstName}, I'm sorry your package for order ${matchedOrder.id} arrived damaged. We are arranging a replacement.`;
  } else if (t.includes('missing') || t.includes('lost')) {
    category = 'Missing Item'; sentiment = 'angry';
    customerReply = `Hi ${firstName}, I apologize for the missing item in order ${matchedOrder.id}. We will dispatch it immediately.`;
  } else if (t.includes('water') || t.includes('bottle') || t.includes('steel')) {
    category = 'Other'; sentiment = 'concerned';
    let found = false;
    for (const o of orders) {
      if (JSON.stringify(o.items || []).toLowerCase().includes('bottle') || JSON.stringify(o.items || []).toLowerCase().includes('water')) {
        customerReply = `Hi ${firstName}! Order ${o.id} containing your water bottle is ${o.status || 'processing'}.`;
        found = true; break;
      }
    }
    if (!found) {
      const itemsList = matchedOrder.items && matchedOrder.items.length > 0 ? matchedOrder.items.join(', ') : 'your ordered items';
      customerReply = `Hi ${firstName}, none of your active orders contain a water bottle (order ${matchedOrder.id} has ${itemsList}).`;
    }
  } else if (t.includes('watch') || t.includes('fitness')) {
    category = 'Other'; sentiment = 'neutral';
    customerReply = `Hi ${firstName}! Your Smart Fitness Watch (${matchedOrder.id}) is currently ${matchedOrder.status || 'in-transit'} and estimated for delivery on ${matchedOrder.estimatedDelivery || matchedOrder.estimated_delivery || 'soon'}.`;
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
