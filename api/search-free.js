// FindIt Nearby no-key search fallback.
// Photo uploads are accepted but never guessed. Typed/barcode queries are
// converted into an explicit identification so the verified retailer pipeline
// can continue without a paid vision provider.

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
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
          verified: true,
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

      return json({
        identification: null,
        offers: [],
        blocked: false,
        verified: false,
        visualVerification: false,
        provider: 'none',
        imageAccepted: true,
        needsVision: true,
        requiresUserInput: true,
        confidence: null,
        code: 'VISION_PROVIDER_NOT_CONFIGURED',
        message: 'Photo received, but exact photo identification is not available right now. FindIt will not guess. Enter the product name or scan its barcode to continue with verified retailer results.'
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
