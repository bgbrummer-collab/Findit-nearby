import search from '../../api/search-free.js';
import nearby from '../../api/nearby.js';
import assistant from '../../api/assistant.js';
import productInsights from '../../api/product-insights.js';
import productIntelligenceV2 from '../../api/product-intelligence-v2.js';
import officialBrandIntelligence from '../../api/official-brand-intelligence.js';
import schoolUniformIdentify from '../../api/school-uniform-identify.js';
import healthRouter from '../../api/health-router.js';
import telemetryRouter from '../../api/telemetry-router.js';
import catalogRouter from '../../api/catalog-router.js';
import realpayRouter from '../../api/realpay-router.js';

const direct = {
  '/api/search': search,
  '/api/nearby': nearby,
  '/api/assistant': assistant,
  '/api/product-insights': productInsights,
  '/api/product-intelligence-v2': productIntelligenceV2,
  '/api/official-brand-intelligence': officialBrandIntelligence,
  '/api/school-uniform-identify': schoolUniformIdentify,
  '/api/health-router': healthRouter,
  '/api/telemetry-router': telemetryRouter,
  '/api/catalog-router': catalogRouter,
  '/api/realpay-router': realpayRouter,
};

const aliases = {
  '/api/product-intelligence': [productIntelligenceV2, null],
  '/api/fx': [productInsights, 'fx'],
  '/api/health': [healthRouter, 'health'],
  '/api/feedback-health': [healthRouter, 'feedback'],
  '/api/realpay-init': [realpayRouter, 'init'],
  '/api/realpay-verify': [realpayRouter, 'verify'],
  '/api/realpay-status': [realpayRouter, 'status'],
  '/api/realpay-manage': [realpayRouter, 'manage'],
  '/api/catalog-import': [catalogRouter, 'catalog'],
  '/api/awin-feed-import': [catalogRouter, 'awin'],
  '/api/exact-product-identify': [officialBrandIntelligence, 'exact'],
  '/api/analytics': [telemetryRouter, 'analytics'],
  '/api/feedback': [telemetryRouter, 'feedback'],
};

function withAction(request, action) {
  if (!action) return request;
  const url = new URL(request.url);
  url.searchParams.set('action', action);
  return new Request(url, request);
}

async function legacyRequest(request) {
  const url = new URL(request.url);
  const headers = Object.fromEntries(request.headers.entries());
  let body = undefined;
  if (!['GET', 'HEAD'].includes(request.method)) {
    const type = request.headers.get('content-type') || '';
    try {
      if (type.includes('application/json')) body = await request.clone().json();
      else if (type.includes('application/x-www-form-urlencoded')) body = Object.fromEntries(new URLSearchParams(await request.clone().text()));
      else if (type.includes('multipart/form-data')) body = Object.fromEntries((await request.clone().formData()).entries());
      else {
        const text = await request.clone().text();
        body = text || undefined;
      }
    } catch { body = undefined; }
  }
  return { method: request.method, headers, body, query: Object.fromEntries(url.searchParams.entries()), url: url.pathname + url.search };
}

async function invokeLegacy(handler, request) {
  const req = await legacyRequest(request);
  let statusCode = 200;
  const headers = new Headers();
  let payload = '';
  let finished = false;
  const res = {
    setHeader(name, value) { headers.set(name, Array.isArray(value) ? value.join(', ') : String(value)); return res; },
    getHeader(name) { return headers.get(name); },
    status(code) { statusCode = Number(code) || 200; return res; },
    json(value) { headers.set('content-type', 'application/json; charset=utf-8'); payload = JSON.stringify(value); finished = true; return res; },
    send(value) { payload = typeof value === 'string' ? value : JSON.stringify(value); finished = true; return res; },
    end(value = '') { payload = String(value ?? ''); finished = true; return res; },
  };
  const returned = await handler(req, res);
  if (returned instanceof Response) return returned;
  if (!finished && returned !== undefined && returned !== res) payload = typeof returned === 'string' ? returned : JSON.stringify(returned);
  return new Response(payload, { status: statusCode, headers });
}

async function invoke(mod, request) {
  if (!mod) return new Response(JSON.stringify({ error: 'API route not found.' }), { status: 404, headers: { 'content-type': 'application/json' } });
  if (typeof mod?.fetch === 'function') return mod.fetch(request);
  if (typeof mod === 'function') return invokeLegacy(mod, request);
  return new Response(JSON.stringify({ error: 'API handler is unavailable.' }), { status: 500, headers: { 'content-type': 'application/json' } });
}

export default async (request) => {
  const path = new URL(request.url).pathname.replace(/\/$/, '') || '/';
  if (direct[path]) return invoke(direct[path], request);
  const alias = aliases[path];
  if (alias) return invoke(alias[0], withAction(request, alias[1]));
  return new Response(JSON.stringify({ error: 'API route not found.', path }), { status: 404, headers: { 'content-type': 'application/json' } });
};

export const config = { path: '/api/*' };
