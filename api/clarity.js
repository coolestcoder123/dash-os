export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { config: c } = req.body;
  if (!c) return res.status(400).json({ error: 'No config provided' });

  const prompt = `
You are an expert startup advisor. Someone has shared their business idea with you. Analyse it honestly and write a specific clarity report.

Here is their data:
- Name: ${c.name}
- Idea: ${c.idea}
- Stage: ${c.stage}
- Industry: ${c.industry}
- Who it's for: ${c.who}
- Problem it solves: ${c.problem}
- Current alternatives: ${c.alternatives}
- Why they're the right person: ${c.whyYou}
- Biggest uncertainty: ${c.uncertainty}
- Success in 12 months: ${c.success}

Return only a valid JSON object, no preamble, no markdown, no backticks:

{
  "insightQuote": "One powerful sentence spoken directly to ${c.name} about their specific idea. Be honest, direct, and encouraging. Reference their actual idea. Max 40 words.",
  "strengths": [
    {"key": "label", "value": "finding", "pill": "green or null"}
  ],
  "gaps": [
    {"key": "label", "value": "finding", "pill": "red or null"}
  ],
  "positioning": [
    {"key": "label", "value": "finding", "pill": null}
  ],
  "firstMove": [
    {"key": "label", "value": "specific action", "pill": "red or green or null"}
  ],
  "nextStepDesc": "One sentence telling ${c.name} specifically what to do before moving to The Real Audit. Reference their idea directly. Include the words 'The Real Audit'."
}

Rules:
- Each array must have exactly 4 items
- pill must be exactly "red", "green", or null
- Every item must reference their specific idea, not generic advice
- The firstMove card should give concrete, actionable steps specific to their situation
- Be honest about gaps — don't be falsely positive
- Return only the JSON object
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
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text;
    let parsed;
    try { parsed = JSON.parse(text); }
    catch (e) { parsed = JSON.parse(text.replace(/```json|```/g, '').trim()); }
    return res.status(200).json(parsed);

  } catch (error) {
    console.error('Clarity API error:', error);
    return res.status(500).json({ error: 'Failed to generate clarity report' });
  }
}
