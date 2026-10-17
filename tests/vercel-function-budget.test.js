import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync,existsSync} from 'node:fs';
test('the existing Hobby deployment stays within twelve functions and keeps every configured API destination',()=>{
 const root=new URL('../',import.meta.url),functions=readdirSync(new URL('api/',root)).filter(x=>/\.(?:[cm]?js|ts)$/.test(x));
 assert.ok(functions.length<=12,`Existing project supports 12 functions; found ${functions.length}`);
 const config=JSON.parse(readFileSync(new URL('vercel.json',root),'utf8'));
 for(const route of config.routes){if(!route.dest?.startsWith('/api/'))continue;const path=route.dest.split('?')[0].slice(1)+'.js';assert.ok(existsSync(new URL(path,root)),`Missing route destination ${path}`);}
 assert.equal(config.routes.find(r=>r.src==='/api/product-intelligence')?.dest,'/api/product-intelligence-v2');
});
