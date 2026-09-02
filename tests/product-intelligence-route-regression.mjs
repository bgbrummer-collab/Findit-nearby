import fs from 'node:fs';
const cfg=JSON.parse(fs.readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
const routes=Array.isArray(cfg.routes)?cfg.routes:[];
const route=routes.find(r=>r?.src==='/api/product-intelligence');
if(!route)throw new Error('Missing /api/product-intelligence route');
if(route.dest!=='/api/product-intelligence-v2')throw new Error(`Unexpected product intelligence destination: ${route.dest}`);
console.log('PRODUCT_INTELLIGENCE_ROUTE_REGRESSION_PASS');
