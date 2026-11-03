import test from 'node:test';import assert from 'node:assert/strict';
import {hasUsefulProductResearch} from './live-research-quality.mjs';
const url='https://retailer.example/products/ex42',title='Example EX42 Advanced Model Product With Published Brand 2kg';
const base={researched:true,sources:[{url,title}],specifications:[{name:'Retailer product code',value:'12345',sourceUrl:url}]};
test('an attributed SKU and a repeated title cannot turn incomplete research into a live acceptance pass',()=>{
 assert.equal(hasUsefulProductResearch(base),false);
 assert.equal(hasUsefulProductResearch({...base,claimEvidence:{whatItDoes:{text:title+'.',sourceUrl:url}}}),false);
});
test('substantive attributed source claims or technical specifications qualify without invented descriptions',()=>{
 assert.equal(hasUsefulProductResearch({...base,claimEvidence:{whatItDoes:{text:'Designed to supply the published energy needs of small adult dogs.',sourceUrl:url}}}),true);
 const specifications=[{name:'Weight',value:'165g',sourceUrl:url},{name:'Connection',value:'USB',sourceUrl:url}];
 assert.equal(hasUsefulProductResearch({...base,specifications}),true);
 assert.equal(hasUsefulProductResearch({...base,specifications:specifications.map(s=>({...s,sourceUrl:'https://other.example'}))}),false);
});
