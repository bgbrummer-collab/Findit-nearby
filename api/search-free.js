// FindIt Nearby no-key image-search fallback.
// This endpoint deliberately does not guess product identity, price or stock.
// Typed search, nearby discovery and the rest of FindIt remain available while
// image recognition has no configured vision provider.

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405);

    try {
      const form = await request.formData();
      const image = form.get('image');
      if (!image || typeof image.arrayBuffer !== 'function') {
        return json({ error: 'No image uploaded.' }, 400);
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
        code: 'VISION_PROVIDER_NOT_CONFIGURED',
        message: 'Photo received. Exact image identification is temporarily unavailable, so FindIt will not guess the product, price or stock. Use Search Product to continue with a product name.'
      }, 200);
    } catch (error) {
      console.error('FindIt no-key image search error', error);
      return json({
        error: 'FindIt could not read this image.',
        message: 'Try another image or use Search Product.',
        retryable: true
      }, 400);
    }
  }
};
