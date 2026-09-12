/* FindIt modal polish — fixes native-looking controls and modal spacing without changing truth rules. */
(()=>{
'use strict';
if(window.__finditModalPolishFix)return;window.__finditModalPolishFix=true;
const STYLE_ID='fxModalPolishStyle';
let bodyObserver=null;
let attachedBody=null;
function ensureStyle(){
 if(document.getElementById(STYLE_ID))return;
 const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
#fxStableModal .fx-stable-card{box-sizing:border-box;overflow-x:hidden;padding:26px!important}
#fxStableModal #fxStableBody{min-width:0;width:100%;padding-bottom:2px}
#fxStableModal .fx-stable-title{margin:0 44px 10px 0;font-size:24px;line-height:1.2}
#fxStableModal .fx-stable-sub{margin:0 0 16px;color:#93a4ba;line-height:1.5}
#fxStableModal .fx-stable-list{display:grid;gap:10px;min-width:0}
#fxStableModal .fx-stable-row{box-sizing:border-box;min-width:0;width:100%;padding:12px;border:1px solid #1f3853;border-radius:12px;background:#0a1829;grid-template-columns:minmax(0,1fr) auto}
#fxStableModal .fx-stable-row>div{min-width:0}
#fxStableModal .fx-stable-row b,#fxStableModal .fx-stable-row small,#fxStableModal .fx-stable-row div{overflow-wrap:break-word;word-break:normal;white-space:normal}
#fxStableModal #fxStableResearch,#fxStableModal [data-product-research],#fxStableModal .fx-product-research{grid-template-columns:minmax(0,1fr)!important}
#fxStableModal .fx-stable-row h4{margin:18px 0 8px}
#fxStableModal .fx-stable-row ul{margin:8px 0 2px;padding-left:22px;line-height:1.5}
#fxStableModal .fx-stable-actions{display:flex!important;align-items:center;gap:10px;flex-wrap:wrap;margin-top:16px!important}
#fxStableModal #fxStableBody button:not(.fx-stable-close),
#fxStableModal #fxStableBody a:not(.fx-stable-close){appearance:none;-webkit-appearance:none;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:40px;max-width:100%;border:1px solid #315274!important;border-radius:10px!important;padding:9px 13px!important;background:#0d2036!important;color:#fff!important;font:600 13px/1.2 inherit!important;text-decoration:none!important;cursor:pointer;box-shadow:none;transition:transform .15s ease,border-color .15s ease,background .15s ease,filter .15s ease;white-space:normal;overflow-wrap:break-word}
#fxStableModal #fxStableBody button:not(.fx-stable-close):hover,
#fxStableModal #fxStableBody a:not(.fx-stable-close):hover{border-color:#587ca2!important;background:#102944!important;transform:translateY(-1px)}
#fxStableModal #fxStableBody button.fx-primary,
#fxStableModal #fxStableBody button.fx-ask-send,
#fxStableModal #fxStableBody #fxAskSend{background:linear-gradient(90deg,#306cff,#7a39ff)!important;background-image:linear-gradient(90deg,#306cff,#7a39ff)!important;border-color:transparent!important;color:#fff!important;box-shadow:0 8px 24px #5c42ff38!important}
#fxStableModal #fxStableBody button.fx-primary:hover,
#fxStableModal #fxStableBody button.fx-ask-send:hover,
#fxStableModal #fxStableBody #fxAskSend:hover{background:linear-gradient(90deg,#3976ff,#8448ff)!important;background-image:linear-gradient(90deg,#3976ff,#8448ff)!important;border-color:transparent!important}
#fxStableModal #fxStableBody button:disabled{opacity:.6;cursor:wait;transform:none!important}
#fxStableModal #fxPriceStatus{margin:12px 0 16px}
#fxStableModal h3{margin:20px 0 10px}
@media(max-width:620px){#fxStableModal .fx-stable-card{padding:20px!important}#fxStableModal .fx-stable-row{grid-template-columns:minmax(0,1fr)!important}#fxStableModal .fx-stable-actions{display:grid!important;grid-template-columns:1fr}#fxStableModal #fxStableBody button:not(.fx-stable-close),#fxStableModal #fxStableBody a:not(.fx-stable-close){width:100%}}
`;
 document.head.appendChild(s);
}
function normalizeActions(){
 ensureStyle();
 const body=document.querySelector('#fxStableBody');if(!body)return;
 const loose=[...body.children].filter(el=>el.tagName==='BUTTON'||el.tagName==='A');
 if(loose.length){let wrap=body.querySelector(':scope > .fx-stable-actions.fx-auto-actions');if(!wrap){wrap=document.createElement('div');wrap.className='fx-stable-actions fx-auto-actions';body.insertBefore(wrap,loose[0])}loose.forEach(el=>wrap.appendChild(el))}
 [...body.querySelectorAll('button,a')].forEach(el=>{if(!el.classList.contains('fx-stable-close'))el.classList.add('fx-polished-action')});
}
function attach(){
 ensureStyle();
 const body=document.querySelector('#fxStableBody');
 if(!body)return false;
 if(attachedBody===body)return true;
 bodyObserver?.disconnect();
 attachedBody=body;
 bodyObserver=new MutationObserver(normalizeActions);
 bodyObserver.observe(body,{childList:true,subtree:true});
 normalizeActions();
 return true;
}
function schedule(){if(attach())return;setTimeout(attach,50);setTimeout(attach,250);setTimeout(attach,1000)}
ensureStyle();
document.addEventListener('findit:dashboard-sync',()=>{schedule();normalizeActions()});
document.addEventListener('findit:results-rendered',()=>{schedule();normalizeActions()});
window.addEventListener('click',e=>{if(e.target?.closest?.('#finditExactShell [data-fx],#finditExactShell [data-fxnav],#fxStableModal'))schedule()},{passive:true});
schedule();
})();
