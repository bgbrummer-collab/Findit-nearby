// Some themes label their native Shopify product JSON as JSON-LD without a
// schema.org type. Accept only the canonical page's single, unambiguous variant.
// Shopify's product prices are integer subunits (including currencies such as JPY).
export function shopifyPageProduct(product, html) {
  if (!product || product['@type'] || !Number.isSafeInteger(product.id) || !product.title || !product.handle || !Array.isArray(product.variants) || product.variants.length !== 1) return null;
  const tags = [...String(html).matchAll(/<(?:link|meta)\b[^>]*>/gi)].map(m => {
    const a = {}; for (const x of m[0].matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)) a[x[1].toLowerCase()] = x[2]; return a;
  });
  const canonical = tags.find(t => t.rel === 'canonical')?.href;
  try { const u = new URL(canonical); if (u.protocol !== 'https:' || u.pathname.replace(/\/$/, '') !== '/products/' + product.handle) return null; } catch { return null; }
  const currency = tags.find(t => (t.property || '').toLowerCase() === 'og:price:currency')?.content;
  const active = String(html).match(/Shopify\.currency\s*=\s*\{\s*"active"\s*:\s*"([A-Z]{3})"/i)?.[1];
  if (!/^[A-Z]{3}$/.test(currency || '') || !active || active !== currency) return null;
  const variant = product.variants[0];
  if (!Number.isSafeInteger(variant.id) || !Number.isSafeInteger(variant.price) || variant.price <= 0 || typeof variant.available !== 'boolean') return null;
  const price = variant.price / 100;
  if (price >= 1e8) return null;
  const name = variant.name || [product.title, variant.title === 'Default Title' ? '' : variant.title].filter(Boolean).join(' - ');
  const barcode = String(variant.barcode || '');
  return {'@type':'Product', name, description:product.description || '', sku:variant.sku || '', ...( /^\d{8,14}$/.test(barcode) ? {gtin:barcode} : {} ), offers:{'@type':'Offer',price,priceCurrency:currency,availability:'https://schema.org/' + (variant.available ? 'InStock' : 'OutOfStock'),url:canonical}};
}
