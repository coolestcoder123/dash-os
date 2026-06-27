export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { config } = req.body;

  if (!config) {
    return res.status(400).json({ error: 'No config provided' });
  }

  const prompt = `
You are an expert business advisor. A solo business owner has shared their business data with you. Analyse their specific situation and write a personalised business diagnosis. 

Here is their data:
- Business name: ${config.brand}
- Owner name: ${config.name}
- Business type: ${config.type}
- Monthly revenue now: ${config.currency}${config.revNow}
- Main monthly cost: ${config.currency}${config.costNow}
- Revenue target (low): ${config.currency}${config.targetLow}
- Revenue target (high): ${config.currency}${config.targetHigh}
- Active clients: ${config.clients}
- Services/products: ${config.services.map(s => `${s.name} (current price: ${config.currency}${s.currentPrice}, target price: ${config.currency}${s.targetPrice})`).join(', ')}
- Ideal client: ${config.idealClient}
- Biggest problem: ${config.problem}
- Biggest strength: ${config.strength}
- Long-term vision: ${config.vision}

Write a diagnosis in JSON format only. No preamble, no markdown, no backticks. Return only a valid JSON object with exactly these fields:

{
  "insightQuote": "A single powerful sentence spoken directly to ${config.name} about their specific situation. Reference their actual numbers and problem. Max 40 words. Start with their first name.",
  "problemRows": [
    {"key": "label", "value": "finding", "pill": "red or green or null"}
  ],
  "assetRows": [
    {"key": "label", "value": "finding", "pill": "red or green or null"}
  ],
  "gapRows": [
    {"key": "label", "value": "finding", "pill": "red or green or null"}
  ],
  "opportunityRows": [
    {"key": "label", "value": "finding", "pill": "red or green or null"}
  ],
  "phase1Actions": [
    {"title": "action title", "desc": "specific action description referencing their actual situation", "priority": "now"}
  ],
  "phase2Actions": [
    {"title": "action title", "desc": "specific action description", "priority": "soon"}
  ],
  "phase3Actions": [
    {"title": "action title", "desc": "specific action description", "priority": "later"}
  ]
}

Rules:
- Each rows array must have exactly 4 items
- Each phase must have exactly 4 actions
- pill must be exactly "red", "green", or null — nothing else
- priority must be exactly "now", "soon", or "later"
- Every single field must reference the user's specific situation, numbers, services, or vision — nothing generic
- The insight quote must feel like it was written specifically for this person, not a template
- Do not use placeholder text
- Return only the JSON object, nothing else
`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text;

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const clean = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    }

    return res.status(200).json(parsed);

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Failed to generate insight' });
  }
}
