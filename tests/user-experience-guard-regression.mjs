import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const fail=msg=>{throw new Error(msg)};

const modalOwner=read('commerce-modal-action-owner.js');
const modalPolish=read('modal-polish-fix.js');
const bootstrap=read('product-info-enhance.js');
const structureGuard=read('product-info-structure-guard.js');
const commerce=read('commerce-ui-v4.js');
const dashboardRuntime=read('dashboard-runtime-stable.js');
const dashboardAudit=read('dashboard-audit-controls.js');

if(/observe\(document\.documentElement/.test(modalOwner))fail('commerce modal owner must not observe the whole document');
if(/observe\(document\.documentElement/.test(modalPolish))fail('modal polish must not observe the whole document');
if(/observe\(document\.documentElement/.test(structureGuard))fail('Product Information structure guard must not observe the whole document');
if(/observe\(document\.documentElement/.test(dashboardRuntime))fail('dashboard runtime must not observe the whole document for Live Stock wiring');
if(/new MutationObserver/.test(modalOwner))fail('commerce modal owner must not rewrite or observe modal DOM; stale async work uses generation tokens instead');
if(!/finditCommerceActionIsCurrent/.test(modalOwner))fail('commerce modal owner must expose a generation-token current-action guard');
if(!/isCurrent\(token\)/.test(commerce))fail('commerce UI must ignore stale async price refreshes');
if(!/activeController\?\.abort\(\)/.test(commerce))fail('commerce UI must abort stale price refreshes');
if(!/setTimeout\(\(\)=>\{if\(!isCurrent\(token\)\)return;doRefresh/.test(commerce))fail('Compare Prices must defer network refresh until after the click/render path returns');
if(/stopImmediatePropagation/.test(bootstrap))fail('Product Information bootstrap must not duplicate ownership of Compare/Stock clicks');
if(!/a==='compare'\|\|a==='stock'/.test(dashboardAudit)||!/setTimeout\(\(\)=>route\(a\),0\)/.test(dashboardAudit))fail('dashboard Compare/Stock handler must return from the physical click before modal work');
if(!/shellObserver\.observe\(shell/.test(dashboardRuntime))fail('dashboard Live Stock wiring must observe only the dashboard shell');
if(/finditDashboardAction\?\.\('stock'\)/.test(dashboardRuntime))fail('legacy dashboard runtime must not own Live Stock clicks');
if(!/bodyObserver\.observe\(body/.test(modalPolish))fail('modal polish must use targeted modal-body observation');
if(!/bodyObserver\.observe\(body/.test(structureGuard))fail('Product Information structure guard must observe only the modal body');
if(!/#fxStableResearch/.test(modalPolish))fail('product research layout must have an explicit single-column readability guard');
if(!/word-break:normal/.test(modalPolish))fail('modal text must not be forced into character-by-character wrapping');
if(!/shellObserver\?\.disconnect\(\)/.test(bootstrap))fail('dashboard bootstrap observer must disconnect after runtime loads');
if(!/product-info-structure-guard\.js\?v=20260913-structure2/.test(bootstrap))fail('bootstrap must load the scoped Product Information structure guard version');

console.log('FINDIT_USER_EXPERIENCE_GUARD_PASS');
