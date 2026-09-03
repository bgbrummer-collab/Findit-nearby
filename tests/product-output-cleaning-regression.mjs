import handler from '../api/product-insights.js';

const oldFetch = global.fetch;
const oldKey = process.env.GEMINI_API_KEY;
delete process.env.GEMINI_API_KEY;

const exactUrl = 'https://example.com/proar-usb-microphone';
const noisyPage = `Title: PROAR USB Condenser Microphone
PROAR USB condenser microphone is a plug-and-play microphone for voice recording, streaming, gaming and online calls.
The USB connection supports straightforward setup on compatible computers and the desktop stand allows adjustable positioning.
Some users report static noise in the background and tripod stability issues.
We are working to provide an accessible version shortly. data-testid="pictureHighQuality" src="https://example.com/image.jpg"`;

global.fetch = async url => {
  const u = String(url);
  if (u === `https://r.jina.ai/${exactUrl}` || u === exactUrl) {
    return new Response(noisyPage, { status: 200, headers: { 'content-type': 'text/plain' } });
  }
  if (u.startsWith('https://r.jina.ai/')) {
    return new Response(`Title: Search\n\n[PROAR USB Condenser Microphone](${exactUrl})`, { status: 200, headers: { 'content-type': 'text/plain' } });
  }
  if (/google\.com\/search|bing\.com\/search|duckduckgo\.com\/html/i.test(u)) {
    return new Response(`<a href="${exactUrl}">PROAR USB Condenser Microphone</a>`, { status: 200, headers: { 'content-type': 'text/html' } });
  }
  return new Response('Not found', { status: 404 });
};

let status = 200;
let payload = null;
const req = {
  method: 'POST',
  query: {},
  body: {
    identification: {
      brand: 'PROAAR',
      model: 'USB Condenser Microphone',
      name: 'PROAAR USB Condenser Microphone',
      object: 'microphone',
      retailCategory: 'electronics',
      searchQuery: 'PROAAR USB Condenser Microphone'
    },
    offers: []
  }
};
const res = { setHeader() {}, status(n) { status = n; return this; }, json(v) { payload = v; return this; } };

await handler(req, res);
global.fetch = oldFetch;
if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey;

if (status !== 200) throw new Error(`status ${status}`);
if (!payload?.researched) throw new Error(`research missing: ${JSON.stringify(payload)}`);
const visible = [payload.whatItDoes, ...(payload.pros || []), ...(payload.cons || [])].join(' ');
if (/accessible version|data-testid|picturehighquality|src=|https?:\/\//i.test(visible)) throw new Error(`web junk leaked into Product Info: ${visible}`);
if ((payload.pros || []).some(x => /static noise|breaks? within|stability issues|drawback|problem/i.test(x))) throw new Error(`negative evidence leaked into Pros: ${JSON.stringify(payload.pros)}`);
if (!(payload.cons || []).some(x => /static noise|stability/i.test(x))) throw new Error(`real drawback was not classified as a con: ${JSON.stringify(payload.cons)}`);
if (!/microphone|record|stream/i.test(payload.whatItDoes || '')) throw new Error(`bad What it does: ${payload.whatItDoes}`);
console.log('PRODUCT_OUTPUT_CLEANING_REGRESSION_PASS');
