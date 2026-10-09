import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../retailer-candidate-ui.js',import.meta.url),'utf8');
function render(name,occupied=false){const top={innerHTML:'',querySelector:()=>occupied?{}:null};vm.runInNewContext(source,{window:{finditState:{result:{identification:{name,category:'product',searchQuery:name}}}},document:{querySelector:()=>top,addEventListener(){}},URL,setTimeout:f=>f(),MutationObserver:class{observe(){}}});return top.innerHTML;}
test('typed beauty searches provide real retailer domains without claiming price or stock',()=>{const html=render('Nivea body lotion 250ml');assert.match(html,/Clicks/);assert.match(decodeURIComponent(html),/site:clicks.co.za Nivea body lotion 250ml/);assert.match(html,/Price and stock not verified/)});
test('typed footwear searches route to footwear retailers',()=>assert.match(render('Nike Air Force 1 white'),/Sportscene/));
test('retailer suggestions do not replace populated store results',()=>assert.equal(render('Nivea body lotion 250ml',true),''));
test('no product means no retailer suggestions',()=>assert.equal(render(''),''));
