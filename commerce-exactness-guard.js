/* FindIt commerce exactness guard — never let an adjacent/wrong product masquerade as the exact item. */
(()=>{
'use strict';
if(window.__finditCommerceExactnessGuard)return;window.__finditCommerceExactnessGuard=true;
const clean=v=>String(v??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const state=()=>{try{return window.finditState||window.state||{}}catch{return{}}};
function genericPage(o){try{const u=new URL(o?.product_url||o?.url||''),p=u.pathname.toLowerCase(),h=u.hostname.toLowerCase();if(/\/(search|category|categories|collections?|brands?|browse|shop\/c)(\/|$)/.test(p))return true;if(/logitech/.test(h)&&/\/shop\/c\//.test(p))return true;return false}catch{return true}}
function conflict(o){const i=state()?.result?.identification||{},wanted=clean([i.object,i.name,i.model,i.category,i.retailCategory,i.searchQuery].join(' ')),candidate=clean([o?.product_name,o?.title,o?.product_url,o?.url].join(' '));
 if(!wanted||!candidate)return false;
 const wantHeadset=/\b(headset|headphone|headphones|earbud|earbuds)\b/.test(wanted),candAudio=/\b(headset|headphone|headphones|earbud|earbuds)\b/.test(candidate);
 if(wantHeadset&&!candAudio)return true;
 if(wantHeadset&&/\b(mouse|keyboard|webcam|speaker|controller)\b/.test(candidate)&&!candAudio)return true;
 const wantMouse=/\bmouse\b/.test(wanted);if(wantMouse&&!/\bmouse\b/.test(candidate))return true;
 const wantKeyboard=/\bkeyboard\b/.test(wanted);if(wantKeyboard&&!/\bkeyboard\b/.test(candidate))return true;
 const wantMic=/\b(microphone|\bmic\b)\b/.test(wanted);if(wantMic&&!/\b(microphone|\bmic\b)\b/.test(candidate))return true;
 const wantShampoo=/\bshampoo\b/.test(wanted),wantConditioner=/\bconditioner\b/.test(wanted);if(wantShampoo&&/\bconditioner\b/.test(candidate)&&!/\bshampoo\b/.test(candidate))return true;if(wantConditioner&&/\bshampoo\b/.test(candidate)&&!/\bconditioner\b/.test(candidate))return true;
 return false}
function safe(o){if(!o)return false;if(genericPage(o))return false;if(conflict(o))return false;return true}
function cleanState(){const s=state();if(Array.isArray(s?.offers))s.offers=s.offers.filter(safe);if(window.productIntelligence&&Array.isArray(window.productIntelligence.offers)){window.productIntelligence.offers=window.productIntelligence.offers.filter(safe);window.productIntelligence.verifiedOfferCount=window.productIntelligence.offers.filter(o=>o?.verified===true||o?.sourcePageVerified===true).length;window.productIntelligence.priceVerifiedCount=window.productIntelligence.offers.filter(o=>Number.isFinite(Number(o?.price))&&Number(o.price)>0).length}}
document.addEventListener('findit:dashboard-sync',cleanState);document.addEventListener('findit:results-rendered',()=>setTimeout(cleanState,0));setTimeout(cleanState,500);setTimeout(cleanState,1600);
window.finditCommerceOfferIsExact=safe;
})();
