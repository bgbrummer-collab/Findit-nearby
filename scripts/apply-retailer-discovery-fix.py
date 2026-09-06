from pathlib import Path
p=Path('lib/retailer-coverage.js')
s=p.read_text()
marker="async function duckOffer(body,p){"
insert=r'''async function webSearchOffer(body,p){const q=clean(body.searchQuery||body.query||body.name||body.model||body.object);if(!q)return null;const queries=[`https://www.google.com/search?hl=en&gl=za&num=8&q=${encodeURIComponent(`site:${p.domain} \"${q}\"`)}`,`https://www.bing.com/search?count=8&q=${encodeURIComponent(`site:${p.domain} \"${q}\"`)}`];for(const search of queries){try{const r=await fetch(search,{headers:{'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36','accept-language':'en-ZA,en;q=0.9'},redirect:'follow',signal:AbortSignal.timeout(6500)});if(!r.ok)continue;const html=(await r.text()).slice(0,650000),urls=[];for(const m of html.matchAll(/href=[\"']([^\"']+)[\"']/gi)){let x=m[1].replace(/&amp;/g,'&');try{const u=new URL(x,search);if(u.hostname.includes('google.')&&u.pathname==='/url')x=u.searchParams.get('q')||u.searchParams.get('url')||'';else if(u.hostname.includes('bing.com')){const target=u.searchParams.get('u')||u.searchParams.get('url');if(target&&/^https?:/i.test(target))x=target}}catch{}if(directProductUrl(x,p.domain)&&!urls.includes(x))urls.push(x);if(urls.length>=5)break}for(const x of urls){const t=await read(x,8500),o=pageOffer(t,x,body,p,'Verified retailer page discovered from public web search');if(o)return o}}catch{}}return null}
'''
if marker not in s: raise SystemExit('duckOffer marker missing')
s=s.replace(marker,insert+marker,1)
old="const discovered=await batched(missing,async p=>(await duckOffer(body,p))||(await catalogOffer(body,p)),6);"
new="const discovered=await batched(missing,async p=>(await duckOffer(body,p))||(await webSearchOffer(body,p))||(await catalogOffer(body,p)),6);"
if old not in s: raise SystemExit('discovery chain target missing')
s=s.replace(old,new,1)
p.write_text(s)
print('patched lib/retailer-coverage.js')
