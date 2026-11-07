// Discovery targets describe a market, not a connected catalogue or stock feed.
const MARKETS={
 US:[['Amazon','amazon.com'],['Walmart','walmart.com'],['Target','target.com'],['Best Buy','bestbuy.com']],
 GB:[['Amazon UK','amazon.co.uk'],['Argos','argos.co.uk'],['Currys','currys.co.uk']],
 AU:[['Amazon Australia','amazon.com.au'],['JB Hi-Fi','jbhifi.com.au']],
 CA:[['Amazon Canada','amazon.ca'],['Walmart Canada','walmart.ca'],['Best Buy Canada','bestbuy.ca']],
 DE:[['Amazon Germany','amazon.de'],['MediaMarkt','mediamarkt.de']],
 FR:[['Amazon France','amazon.fr'],['Fnac','fnac.com']]
};
export function marketRetailers(country){return (MARKETS[country]||[]).map(([name,domain])=>({name,domain,searchUrl:'https://www.'+domain+'/',exactProductMatch:false,stockVerified:false,branchStockVerified:false,directionsAvailable:false,status:'candidate_retailer'}));}
export function marketLabel(country){try{return new Intl.DisplayNames(['en'],{type:'region'}).of(country)||country;}catch{return country;}}
export function offerMarket(offer,country){
 const host=new URL(offer.product_url).hostname.replace(/^www\./,'');
 let retailerCountry=offer.retailerCountry||null;
 if(!retailerCountry){
  if(/\.co\.za$/.test(host)||['takealot.com','bash.com','superbalist.com','pepstores.com','mrprice.com','lego-gybc.co.za'].includes(host))retailerCountry='ZA';
  else for(const [market,retailers] of Object.entries(MARKETS))if(retailers.some(([,domain])=>host===domain||host.endsWith('.'+domain))){retailerCountry=market;break;}
 }
 const internationalOffer=retailerCountry?retailerCountry!==country:null;
 return {...offer,customerCountry:country,retailerCountry,internationalOffer,localAvailabilityVerified:false,marketNote:internationalOffer===true?'International retailer listing. Delivery, import charges and availability in your country are not verified.':internationalOffer===null?'Retailer market and delivery to your country are not verified.':''};
}
