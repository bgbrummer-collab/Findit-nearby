(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const getState=()=>{try{return state}catch{return null}};

function ensureStyle(){if($('#finditCommercePolishStyle'))return;const s=document.createElement('style');s.id='finditCommercePolishStyle';s.textContent=`
#nearbyPanel.findit-polished-likely .findit-likely-store:nth-of-type(n+5){display:none!important}
.findit-nearby-note{margin:0 0 12px;padding:12px 14px;border-radius:14px;background:#ffffff05;border:1px solid #ffffff10;color:#94a4bb;font-size:12px;line-height:1.45}
`;document.head.appendChild(s)}

function removeLegacySecondLookup(){document.getElementById('finditLiveCommerce')?.remove();document.getElementById('finditPriceCheckBox')?.remove()}
function cleanNearby(){const panel=$('#nearbyPanel'),el=$('#nearbyStores');if(!panel||!el)return;panel.classList.add('findit-polished-likely');const st=getState(),stores=Array.isArray(st?.stores)?st.stores:[];qa('[data-store]',el).forEach(card=>{const idx=Number(card.dataset.store),s=Number.isInteger(idx)?stores[idx]:null;const exact=s?.exactProductMatch===true&&s?.stockVerified===true&&s?.branchStockVerified===true;card.querySelectorAll('a,button').forEach(x=>{if(/direction|get directions/i.test(x.textContent||'')&&!exact){x.removeAttribute('href');x.style.display='none'}})});qa('.findit-likely-store a,.findit-likely-store button',el).forEach(x=>{if(/direction|get directions/i.test(x.textContent||'')){x.removeAttribute('href');x.style.display='none'}});let note=$('.findit-nearby-note',panel);if(!note){note=document.createElement('div');note.className='findit-nearby-note';const head=$('.nearby-head',panel)||panel.firstElementChild;head?.insertAdjacentElement('afterend',note)}note.textContent='Nearby stores are shown for convenience. Directions only unlock when FindIt has verified the exact item and stock at that physical branch.'}
function compactExactSection(){const exact=$('#exactSellerResults');if(!exact)return;qa('.premium-insights',exact).forEach(x=>x.remove());}
let timer;function sync(){clearTimeout(timer);timer=setTimeout(()=>{removeLegacySecondLookup();compactExactSection();cleanNearby()},120)}
function init(){ensureStyle();document.addEventListener('findit:results-rendered',sync);new MutationObserver(sync).observe(document.body,{childList:true,subtree:true});setTimeout(sync,700);setTimeout(sync,1800)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();