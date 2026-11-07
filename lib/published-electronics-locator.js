import snapshots from './data/electronics-locator-snapshot.js';
const SOURCES=new Map([
 ['https://www.incredible.co.za/storelocator/',/^incredible\b/i],
 ['https://www.hificorp.co.za/storelocator',/^hifi\s*corp\b/i]
]);
export function publishedElectronicsBranches(source,data=snapshots,now=Date.now()){
 const name=SOURCES.get(source),snapshot=data?.find(row=>row.source===source);
 const age=now-Date.parse(snapshot?.checkedAt);
 if(!name||!Number.isFinite(age)||age<0||age>14*86400000||!Array.isArray(snapshot.branches))return [];
 return snapshot.branches.filter(row=>name.test(row?.name||'')&&row.sourceUrl===source&&Number.isFinite(row.lat)&&Number.isFinite(row.lon)&&row.lat>=-35&&row.lat<=-22&&row.lon>=16&&row.lon<=33).map(row=>({
  id:row.id,name:row.name,lat:row.lat,lon:row.lon,address:row.address||'',phone:row.phone||'',
  source:'Official retailer locator',sourceUrl:source,website:source,countryCode:'ZA',
  locatorDataStatus:'published_snapshot',locatorCheckedAt:snapshot.checkedAt,
  openingHours:'',schedule:'',openNow:null,price:null,
  exactProductMatch:false,stockVerified:false,branchStockVerified:false,branchPriceVerified:false,
  directionsAvailable:false,branchDetailsVerified:true,
  type:'Published retailer location — details checked '+snapshot.checkedAt.slice(0,10)+'; exact item stock not verified'
 }));
}
