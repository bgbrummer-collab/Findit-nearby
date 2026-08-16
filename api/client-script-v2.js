const ENHANCEMENTS=`
;(()=>{
  const cleanWords=v=>String(v||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().split(/\s+/).filter(Boolean);
  function compactProductQuery(i){
    const brand=String(i?.brand||"").trim(),model=String(i?.model||"").trim(),name=String(i?.name||i?.object||"").trim(),search=String(i?.searchQuery||"").trim();
    const out=[],seen=new Set();
    const add=v=>{for(const w of cleanWords(v)){if(!seen.has(w)){seen.add(w);out.push(w)}}};
    add(brand);add(model);add(name);add(search);
    return out.slice(0,16).join(" ")||"product";
  }
  function exactSearchUrl(domain,q){return "https://www.google.com/search?q="+encodeURIComponent("site:"+domain+" \""+q+"\"")}
  async function addRetailerSearches(i){
    if(!i||Number(i.confidence||0)<.55)return;
    const host=document.getElementById("productIntelligenceResults")||document.getElementById("freeActions");
    if(!host)return;
    let box=document.getElementById("finditRetailerSearches");
    if(!box){box=document.createElement("div");box.id="finditRetailerSearches";box.className="findit-retailer-searches";host.parentNode.insertBefore(box,host.nextSibling)}
    try{
      const r=await fetch("/api/retailer-links",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({brand:i.brand,model:i.model,name:i.name||i.object,object:i.object,query:compactProductQuery(i),category:i.category,retailCategory:i.retailCategory})});
      const d=await r.json();if(!r.ok||!Array.isArray(d.links))throw Error();
      box.innerHTML='<div class="findit-retailer-head"><strong>Search this exact product at retailers</strong><small>These links search retailer websites. Stock is only confirmed when FindIt has verified data.</small></div><div class="findit-retailer-grid">'+d.links.map(x=>'<a target="_blank" rel="noopener noreferrer" href="'+esc(x.url)+'">'+esc(x.name)+' <span>Search →</span></a>').join("")+'</div>';
    }catch{box.innerHTML=""}
  }
  if(typeof takealotQuery==="function")window.finditOldTakealotQuery=takealotQuery;
  window.finditCompactProductQuery=compactProductQuery;
  window.finditExactSearchUrl=exactSearchUrl;
  const oldRender=typeof renderIdentification==="function"?renderIdentification:null;
  if(oldRender){renderIdentification=function(i){const out=oldRender(i);setTimeout(()=>addRetailerSearches(i),0);return out}}
  const style=document.createElement("style");style.textContent=`
    .findit-retailer-searches{margin:18px 0;padding:16px;border:1px solid rgba(120,130,255,.24);border-radius:18px;background:rgba(15,23,42,.72)}
    .findit-retailer-head strong,.findit-retailer-head small{display:block}.findit-retailer-head small{margin-top:5px;color:#8d9ab0;font-size:11px;line-height:1.5}
    .findit-retailer-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}.findit-retailer-grid a{padding:11px 12px;border:1px solid rgba(255,255,255,.09);border-radius:12px;text-decoration:none;background:#111a2d;font-size:11px;font-weight:800}.findit-retailer-grid a span{float:right;color:#9b8fff}
    @media(max-width:700px){.findit-retailer-grid{grid-template-columns:1fr}.premium-fab{right:12px!important;bottom:92px!important;padding:10px 14px!important;font-size:14px!important}.assistant-fab{right:12px!important;bottom:24px!important;padding:10px 14px!important;font-size:14px!important}.mobile-nav{padding-right:150px!important}.results-shell{padding-bottom:115px!important}}
    @media(max-width:430px){.premium-fab,.assistant-fab{max-width:142px!important}.assistant-fab{font-size:13px!important}.mobile-nav{padding-right:145px!important}}
  `;document.head.appendChild(style);
})();
`;

export default async function handler(req,res){
  if(req.method!=="GET")return res.status(405).send("Method not allowed");
  try{
    const origin=`${req.headers['x-forwarded-proto']||'https'}://${req.headers.host}`;
    const r=await fetch(origin+"/api/client-script",{headers:{Accept:"text/plain"}});
    if(!r.ok)throw Error("Base client script failed: "+r.status);
    const core=await r.text();
    res.setHeader("Content-Type","application/javascript; charset=utf-8");
    res.setHeader("Cache-Control","no-store, max-age=0");
    return res.status(200).send(core+ENHANCEMENTS);
  }catch(e){console.error("client-script-v2",e);return res.status(500).send("console.error("+JSON.stringify(String(e.message||e))+");")}
}
