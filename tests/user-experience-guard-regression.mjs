import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const fail=msg=>{throw new Error(msg)};

const modalOwner=read('commerce-modal-action-owner.js');
const modalPolish=read('modal-polish-fix.js');
const bootstrap=read('product-info-enhance.js');

if(/observe\(document\.documentElement/.test(modalOwner))fail('commerce modal owner must not observe the whole document');
if(/observe\(document\.documentElement/.test(modalPolish))fail('modal polish must not observe the whole document');
if(!/bodyObserver\.observe\(body/.test(modalOwner))fail('commerce modal owner must use targeted modal/body observation');
if(!/bodyObserver\.observe\(body/.test(modalPolish))fail('modal polish must use targeted modal-body observation');
if(!/#fxStableResearch/.test(modalPolish))fail('product research layout must have an explicit single-column readability guard');
if(!/word-break:normal/.test(modalPolish))fail('modal text must not be forced into character-by-character wrapping');
if(!/shellObserver\?\.disconnect\(\)/.test(bootstrap))fail('dashboard bootstrap observer must disconnect after runtime loads');

console.log('FINDIT_USER_EXPERIENCE_GUARD_PASS');
