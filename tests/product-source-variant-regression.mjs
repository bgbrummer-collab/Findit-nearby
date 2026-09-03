import handler from '../api/product-insights.js';

const oldFetch = global.fetch;
const oldKey = process.env.GEMINI_API_KEY;
delete process.env.GEMINI_API_KEY;

const wrong = 'https://example.com/twinsaver-1-ply-48-rolls';
const exact = 'https://example.com/twinsaver-2-ply-18-rolls';

global.fetch = async url => {
  const u = String(url);
  if (u === `https://r.jina.ai/${wrong}` || u === wrong) {
    return new Response('Title: Twinsaver 1 Ply Premium Toilet Tissue 48 Rolls\nTwinsaver toilet tissue is designed for everyday bathroom use. Related Twinsaver Twin Ply 18 Rolls products offer softness, strength and absorbency.', { status: 200 });
  }
  if (u === `https://r.jina.ai/${exact}` || u === exact) {
    return new Response('Title: Twinsaver 2 Ply Toilet Paper 18 Rolls\nTwinsaver 2 Ply Toilet Paper 18 Rolls is designed for everyday household bathroom use with two-ply sheets for softness and strength. The pack contains 18 rolls.', { status: 200 });
  }
  if (u.startsWith('https://r.jina.ai/')) {
    return new Response(`Title: Search\n[Twinsaver 1 Ply Premium Toilet Tissue 48 Rolls](${wrong})\n[Twinsaver 2 Ply Toilet Paper 18 Rolls](${exact})`, { status: 200 });
  }
  if (/google\.com\/search|bing\.com\/search|duckduckgo\.com\/html/i.test(u)) {
    return new Response(`<a href="${wrong}">Twinsaver 1 Ply Premium Toilet Tissue 48 Rolls</a><a href="${exact}">Twinsaver 2 Ply Toilet Paper 18 Rolls</a>`, { status: 200 });
  }
  return new Response('Not found', { status: 404 });
};

let status = 200, payload = null;
const req = { method:'POST', query:{}, body:{ identification:{ brand:'Twinsaver', model:'Twin Ply 18 Rolls', name:'Twinsaver Twin Ply 18 Rolls Toilet Paper Pack', object:'toilet paper', retailCategory:'household', searchQuery:'Twinsaver Twin Ply 18 Rolls Toilet Paper Pack' }, offers:[] } };
const res = { setHeader(){}, status(n){ status=n; return this; }, json(v){ payload=v; return this; } };
await handler(req,res);
global.fetch = oldFetch;
if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey;

if (status !== 200 || !payload?.researched) throw new Error(`research failed: ${status} ${JSON.stringify(payload)}`);
if ((payload.sources || []).some(s => s.url === wrong)) throw new Error(`conflicting 1-ply/48-roll source accepted: ${JSON.stringify(payload.sources)}`);
if (!(payload.sources || []).some(s => s.url === exact)) throw new Error(`exact 2-ply/18-roll source missing: ${JSON.stringify(payload.sources)}`);
console.log('PRODUCT_SOURCE_VARIANT_REGRESSION_PASS');
