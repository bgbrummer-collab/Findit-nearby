import snapshot from './data/sports-locator-snapshot.js';
const SOURCE='https://www.sportsmanswarehouse.co.za/store-locator/';
export function publishedSportsBranches(data=snapshot,now=Date.now()){
 const age=now-Date.parse(data?.checkedAt);if(data?.source!==SOURCE||!Number.isFinite(age)||age<0||age>14*86400000||!Array.isArray(data.branches))return [];
 return data.branches.filter(s=>s?.name?.startsWith('Sportsmans Warehouse ')&&typeof s.lat==='number'&&typeof s.lon==='number'&&Number.isFinite(s.lat)&&Number.isFinite(s.lon)&&Math.abs(s.lat)<=90&&Math.abs(s.lon)<=180&&s.sourceUrl===SOURCE).map(s=>({id:s.id,name:s.name,lat:s.lat,lon:s.lon,address:s.address||'',phone:s.phone||'',website:SOURCE,sourceUrl:SOURCE,source:'Official retailer locator',locatorDataStatus:'published_snapshot',locatorCheckedAt:data.checkedAt,openingHours:'',schedule:'',openNow:null,exactProductMatch:false,stockVerified:false,branchStockVerified:false,directionsAvailable:false,branchDetailsVerified:true,type:'Published retailer location — details checked '+data.checkedAt.slice(0,10)+'; exact item stock not verified'}));
}
