const PRIMARY_MODEL = 'gemini-3.6-flash';
const FALLBACK_MODEL = 'gemini-3.5-flash-lite';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: 'FindIt Assistant is not configured.' });

  const { message, context = {} } = req.body || {};
  const text = String(message || '').trim();
  if (!text) return res.status(400).json({ error: 'Message required' });

  const prompt = `You are FindIt Assistant inside the FindIt Nearby app.
Help the user with identified items, FindIt features, nearby results, search tips, prices, stock labels, Premium tools, saved items and comparisons.
Be concise and practical.
Never invent a store, price, exact branch stock, product match or availability.
Only call a price/stock verified if the supplied context explicitly says it is verified.
If data is unavailable, say so clearly.

Current FindIt context:
${JSON.stringify(context).slice(0, 12000)}

User:
${text}`;

  let lastError;
  for (const model of [PRIMARY_MODEL, FALLBACK_MODEL]) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': key
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.35, maxOutputTokens: 500 }
        })
      });

      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error?.message || `${model} failed`);

      const answer = (d.candidates?.[0]?.content?.parts || [])
        .map(part => part.text || '')
        .join('')
        .trim();

      if (!answer) throw new Error(`${model} returned no answer`);
      return res.status(200).json({ ok: true, answer, modelUsed: model });
    } catch (error) {
      console.error(`FindIt Assistant ${model}`, error);
      lastError = error;
    }
  }

  console.error('FindIt Assistant unavailable', lastError);
  return res.status(502).json({ error: 'FindIt Assistant is temporarily unavailable. Please try again.' });
}
