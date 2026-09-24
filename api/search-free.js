// FindIt Nearby no-key search fallback.
// Photo uploads are accepted but never guessed. Typed/barcode queries are
// converted into an explicit identification so the verified retailer pipeline
// can continue without a paid vision provider.

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const HF_MODELS = ['CohereLabs/aya-vision-32b:cohere','CohereLabs/command-a-vision-07-2025:cohere'];
const HF_URL = 'https://router.huggingface.co/v1/chat/completions';
const BLOCKED = /\b(firearm|gun|rifle|pistol|ammunition|ammo|weapon|knife|knives|machete|sword|switchblade|taser|stun gun|pepper spray|mace|brass knuckles|fireworks|explosive|vape|nicotine|cigarette|cigar|alcohol|beer|wine|liquor|cannabis|marijuana|thc|cbd|psilocybin|magic mushroom|gambling|sports betting|casino|pornography|adult sex toy)\b/i;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function clean(v) {
  return String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, 240);
}

function typedIdentification(query, barcode = '') {
  const q = clean(query);
  const code = clean(barcode);
  const label = q || (code ? `Barcode ${code}` : '');
  if (!label) return null;
  return {
    name: label,
    object: q || 'product',
    brand: '',
    model: code || '',
    category: 'product',
    retailCategory: 'general',
    searchQuery: q || code,
    barcode: code || null,
    confidence: null,
    identificationMethod: code ? 'barcode-user-input' : 'typed-user-input',
    userConfirmed: true
  };
}


function netlifyEnv(name) {
  try { const v = globalThis.Netlify?.env?.get?.(name); if (v) return clean(v); } catch {}
  try { return clean(process?.env?.[name]); } catch { return ''; }
}

function parseVisionJson(text) {
  if (Array.isArray(text)) text = text.map(part => part?.text || part?.content || '').join(' ');
  else if (text && typeof text === 'object') text = text.text || text.content || JSON.stringify(text);
  const raw = String(text || '').trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(raw.slice(start, end + 1)); } catch { return null; }
}

function normalizeVision(v) {
  if (!v || typeof v !== 'object') return null;
  const name = clean(v.name || v.productName || v.object);
  if (!name) return null;
  const brand = clean(v.brand);
  const model = clean(v.model || v.variant);
  const object = clean(v.object || v.category || 'product');
  const barcode = clean(v.barcode || v.gtin || v.ean);
  const searchQuery = clean(v.searchQuery || [brand, name, model].filter(Boolean).join(' '));
  const confidence = Math.max(0, Math.min(1, Number(v.confidence) || 0));
  if (BLOCKED.test([name, brand, model, object, searchQuery].join(' '))) return { blocked: true };
  return { name, brand, model, object, category: clean(v.category || 'product'), retailCategory: clean(v.retailCategory || v.category || 'general'), searchQuery: searchQuery || name, barcode: barcode || null, confidence, identificationMethod: 'huggingface-vision', userConfirmed: false };
}

async function identifyWithHuggingFace(image) {
  const token = netlifyEnv('HF_TOKEN');
  if (!token) return { identification: null, reason: 'HF_TOKEN_MISSING' };
  const bytes = Buffer.from(await image.arrayBuffer());
  const dataUrl = 'data:' + (image.type || 'image/jpeg') + ';base64,' + bytes.toString('base64');
  const prompt = 'Identify the ordinary retail product in this image. Read every visible word on the package first. Return ONLY JSON with keys name, brand, model, object, category, retailCategory, searchQuery, barcode, confidence. Do not invent hidden text, size, barcode, or variant. If brand and product-line text are clearly visible, include them even if size is unknown. confidence is 0 to 1.';
  let lastStatus = null;
  for (const model of HF_MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 22000);
    try {
      const response = await fetch(HF_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: dataUrl } }] }],
          temperature: 0,
          max_tokens: 350
        })
      });
      lastStatus = response.status;
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) { console.error('FindIt vision provider failed', { model, status: response.status }); continue; }
      const identification = normalizeVision(parseVisionJson(payload?.choices?.[0]?.message?.content));
      if (identification?.blocked) return { blocked: true, identification: null };
      if (identification && identification.confidence >= 0.30) return { identification, model };
    } catch (error) {
      if (error?.name === 'AbortError') lastStatus = 408;
    } finally {
      clearTimeout(timer);
    }
  }
  return { identification: null, reason: lastStatus === 408 ? 'HF_TIMEOUT' : 'HF_INFERENCE_FAILED', status: lastStatus };
}
async function readInput(request) {
  const type = String(request.headers.get('content-type') || '').toLowerCase();
  if (type.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    return { query: clean(body.query || body.searchQuery || body.product || body.name), barcode: clean(body.barcode || body.gtin || body.ean), image: null };
  }
  const form = await request.formData();
  return {
    query: clean(form.get('query') || form.get('searchQuery') || form.get('product') || form.get('name')),
    barcode: clean(form.get('barcode') || form.get('gtin') || form.get('ean')),
    image: form.get('image')
  };
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405);

    try {
      const { query, barcode, image } = await readInput(request);
      const text = `${query} ${barcode}`.trim();
      if (text && BLOCKED.test(text)) {
        return json({ blocked: true, identification: null, offers: [], code: 'RESTRICTED_PRODUCT', message: 'FindIt cannot help locate this product.' }, 403);
      }

      const identification = typedIdentification(query, barcode);
      if (identification) {
        return json({
          identification,
          offers: [],
          blocked: false,
          verified: false,
          userConfirmed: true,
          identitySource: 'user-confirmed',
          visualVerification: false,
          provider: 'user-input',
          imageAccepted: false,
          needsVision: false,
          needsRetailerVerification: true,
          code: 'USER_CONFIRMED_PRODUCT',
          message: 'Product accepted. FindIt can now verify retailer pages, prices and availability for this exact search.'
        });
      }

      if (!image || typeof image.arrayBuffer !== 'function') {
        return json({ error: 'Add a product name, barcode or image.', code: 'PRODUCT_INPUT_REQUIRED' }, 400);
      }
      if (!String(image.type || '').startsWith('image/')) {
        return json({ error: 'Uploaded file must be an image.' }, 400);
      }
      if (Number(image.size || 0) > MAX_IMAGE_BYTES) {
        return json({ error: 'Image must be smaller than 8 MB.' }, 413);
      }

      const vision = await identifyWithHuggingFace(image);
      if (vision.blocked) {
        return json({ blocked: true, identification: null, offers: [], code: 'RESTRICTED_PRODUCT', message: 'FindIt cannot help locate this product.' }, 403);
      }
      if (vision.identification) {
        return json({
          identification: vision.identification,
          offers: [],
          blocked: false,
          verified: false,
          userConfirmed: false,
          identitySource: 'huggingface-vision',
          visualVerification: true,
          provider: 'huggingface',
          imageAccepted: true,
          needsVision: false,
          needsRetailerVerification: true,
          confidence: vision.identification.confidence,
          code: 'PHOTO_IDENTIFIED',
          message: 'Photo identified. FindIt can now verify retailer pages, prices and availability for this product.'
        });
      }
      return json({
        identification: null,
        offers: [],
        blocked: false,
        verified: false,
        visualVerification: false,
        provider: 'huggingface',
        imageAccepted: true,
        needsVision: false,
        requiresUserInput: true,
        confidence: null,
        code: vision.reason || 'PHOTO_NOT_IDENTIFIED',
        providerStatus: vision.status || null,
        message: 'FindIt could not identify this photo confidently enough to search exact retailers. Try a clearer photo, product name or barcode.'
      });
    } catch (error) {
      console.error('FindIt no-key search error', error);
      return json({
        error: 'FindIt could not read this search.',
        message: 'Try the product name, barcode or another image.',
        retryable: true
      }, 400);
    }
  }
};
