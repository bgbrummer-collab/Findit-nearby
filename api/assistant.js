const PRIMARY_MODEL = 'gemini-3.6-flash';
const FALLBACK_MODEL = 'gemini-3.5-flash-lite';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: 'FindIt Assistant is not configured.' });

  const { message, context = {}, history = [] } = req.body || {};
  const text = String(message || '').trim();
  if (!text) return res.status(400).json({ error: 'Message required' });

  const safeHistory = Array.isArray(history) ? history.slice(-10).map(x => ({
    role: x?.role === 'assistant' ? 'assistant' : 'user',
    text: String(x?.text || '').slice(0, 2000)
  })) : [];

  const system = `You are FindIt Assistant, a capable general-purpose AI assistant built into FindIt Nearby.
You can answer normal everyday questions, explain concepts, help write and plan, compare options, and help with FindIt products, stores, prices, saved finds, search results and app features.
Use the supplied FindIt context whenever the question concerns the current item or nearby results.
Do not invent live facts such as a retailer price, branch stock, quantity remaining, exact location, product match or availability. Only call these verified when the context explicitly proves them.
If the user asks a general question unrelated to FindIt, answer it normally and helpfully.
Keep answers clear and useful. For simple questions be concise; for harder questions explain enough to be useful.
Never claim you checked a website unless the supplied context contains the result of that check.`;

  const contents = [
    { role: 'user', parts: [{ text: `${system}\n\nCurrent FindIt context:\n${JSON.stringify(context).slice(0, 16000)}` }] },
    { role: 'model', parts: [{ text: 'Understood. I will answer broadly while keeping FindIt live-data claims evidence-based.' }] },
    ...safeHistory.map(x => ({ role: x.role === 'assistant' ? 'model' : 'user', parts: [{ text: x.text }] })),
    { role: 'user', parts: [{ text }] }
  ];

  let lastError;
  for (const model of [PRIMARY_MODEL, FALLBACK_MODEL]) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 18000);
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({ contents, generationConfig: { temperature: 0.45, maxOutputTokens: 1200 } })
      });
      clearTimeout(timer);
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error?.message || `${model} failed`);
      const answer = (d.candidates?.[0]?.content?.parts || []).map(part => part.text || '').join('').trim();
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
