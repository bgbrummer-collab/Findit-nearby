import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../retailer-candidate-ui.js',import.meta.url),'utf8');
function render(name,occupied=false,offers=[]){const top={innerHTML:'',querySelector:()=>occupied?{}:null};const context={window:{finditState:{offers,result:{identification:{name,category:'product',searchQuery:name}}}},document:{querySelector:()=>top,addEventListener(){}},URL,Intl,setTimeout:f=>f(),MutationObserver:class{observe(){}}};vm.runInNewContext(readFileSync(new URL('../offer-evidence.js',import.meta.url),'utf8'),context);vm.runInNewContext(source,context);return top.innerHTML;}
test('typed beauty searches provide real retailer domains without claiming price or stock',()=>{const html=render('Nivea body lotion 250ml');assert.match(html,/Clicks/);assert.match(decodeURIComponent(html),/site:clicks.co.za Nivea body lotion 250ml/);assert.match(html,/Price and stock not verified/)});
test('typed footwear searches route to footwear retailers',()=>assert.match(render('Nike Air Force 1 white'),/Sportscene/));
test('retailer suggestions do not replace populated store results',()=>assert.equal(render('Nivea body lotion 250ml',true),''));
test('no product means no retailer suggestions',()=>assert.equal(render(''),''));

test('verified listings retain product links and distinguish online stock from branch stock',()=>{const html=render('Sony WH-1000XM5 black',false,[{retailer:{name:'Incredible Connection'},product_url:'https://www.incredible.co.za/product',price:5999,currency:'ZAR',availability:'in_stock',exactProductMatch:true,sourcePageVerified:true}]);assert.match(html,/Verified product listings/);assert.match(html,/href="https:\/\/www.incredible.co.za\/product"/);assert.match(html,/Online in stock/);assert.match(html,/Branch stock not verified/);assert.doesNotMatch(html,/No exact listing verified|google.com/)});
test('unverified offers cannot become verified retailer cards',()=>assert.doesNotMatch(render('Sony WH-1000XM5 black',false,[{retailer:'Invented',url:'https://example.com',price:1,currency:'ZAR',exactProductMatch:true}]),/Verified product listings|Invented/));
