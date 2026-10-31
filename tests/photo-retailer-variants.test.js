import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../lib/product-intelligence-core.js';
import {photoVariantNeedsConfirmation} from '../lib/photo-retailer-variants.js';

const i={name:'A42 headphones',model:'A42',object:'headphones',category:'electronics',searchQuery:'A42 headphones',identificationMethod:'independent-vision-consensus',userConfirmed:false};
const offer={product_name:'Example A42 headset Blue and Raspberry',sku:'981-001062',comparisonAttributes:{color:'',size:''}};

test('photo model agreement does not confirm a retailer colour or clothing size',()=>{
 assert.equal(photoVariantNeedsConfirmation(offer,i,'electronics'),true);
 assert.equal(photoVariantNeedsConfirmation(offer,{...i,color:'Blue and Raspberry'},'electronics'),false);
 assert.equal(photoVariantNeedsConfirmation(offer,{...i,model:'981-001062'},'electronics'),false);
 assert.equal(photoVariantNeedsConfirmation(offer,{...i,userConfirmed:true},'electronics'),false);
 assert.equal(photoVariantNeedsConfirmation(offer,{...i,identificationMethod:'typed-user-input'},'electronics'),false);
 assert.equal(photoVariantNeedsConfirmation({product_name:'Example 501 jeans',comparisonAttributes:{size:'UK 8'}},i,'clothing'),true);
 assert.equal(photoVariantNeedsConfirmation({product_name:'Example 501 jeans',comparisonAttributes:{size:'UK 8'}},{...i,size:'UK 8'},'clothing'),false);
 assert.equal(photoVariantNeedsConfirmation({product_name:'Example Black Carbon deodorant'},i,'beauty'),false);
 assert.equal(photoVariantNeedsConfirmation({product_name:'Blue Yeti microphone'},{...i,brand:'Blue'},'music'),false);
});

test('unconfirmed photo variants remain reviewable but cannot supply best price or verified seller stock',async t=>{
 const url='https://retailer.example/products/a42-blue',title=offer.product_name;
 t.mock.method(globalThis,'fetch',async u=>new Response(String(u).includes('bing.com')?'<rss><item><title>'+title+'</title><description>'+title+'</description><link>'+url+'</link></item></rss>':String(u)===url?'<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:title,sku:offer.sku,offers:{price:750,priceCurrency:'ZAR',availability:'https://schema.org/InStock'}})+'</script>':'',{headers:{'content-type':'text/html'}}));
 const invoke=async identification=>{let d;await handler({method:'POST',body:{identification}},{setHeader(){},status(){return this;},json(v){d=v;return this;}});return d;};
 const d=await invoke(i);
 assert.equal(d.offers.length,0);assert.equal(d.bestPrice,null);assert.equal(d.verifiedSellerCount,0);assert.equal(d.inStockOfferCount,0);assert.equal(d.variantConfirmationRequired,true);
 assert.equal(d.possibleOffers.length,1);assert.equal(d.possibleOffers[0].price,750);assert.equal(d.possibleOffers[0].exactProductMatch,false);assert.equal(d.possibleOffers[0].photoVariantConfirmed,false);
 assert.ok(d.retailerStatus.some(s=>s.status==='variant_confirmation_required'&&s.stockVerified===false&&s.exactProductMatch===false));
 const confirmed=await invoke({...i,color:'Blue and Raspberry'});assert.equal(confirmed.offers.length,1);assert.equal(confirmed.possibleOffers.length,0);assert.equal(confirmed.bestPrice.price,750);
 const wrong=await invoke({...i,color:'black'});assert.equal(wrong.offers.length,0);assert.equal(wrong.possibleOffers.length,0);
});

test('an ambiguous multi-size listing needs review when photo colour is known but size is not',()=>{
 const listing={product_name:'Example Classic White Blue Sneaker',sku:'',comparisonAmbiguous:true,comparisonAttributes:{size:'',color:''}};
 const photo={name:'Example Classic White Blue Sneaker',identificationMethod:'independent-vision-consensus',color:'White Blue',userConfirmed:false};
 assert.equal(photoVariantNeedsConfirmation(listing,photo,'footwear'),true);
 assert.equal(photoVariantNeedsConfirmation(listing,{...photo,userConfirmed:true},'footwear'),false);
});
