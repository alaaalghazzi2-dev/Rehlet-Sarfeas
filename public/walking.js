// Pedestrian profile; keep coordinates and cached results only in this page's memory.
const cache=new Map();let queue=Promise.resolve(),lastRequest=0;
export const walkingRoute=(from,to)=>streetRoute(from,to,'foot');
export const drivingRoute=(from,to)=>streetRoute(from,to,'car');
function streetRoute(from,to,profile){
 const key=profile+':'+[from.lng,from.lat,to.lng,to.lat].map(n=>Number(n).toFixed(6)).join(',');
 if(cache.has(key))return cache.get(key);
 const task=queue.then(async()=>{
  const wait=1050-(Date.now()-lastRequest);if(wait>0)await new Promise(r=>setTimeout(r,wait));lastRequest=Date.now();
  const pair=`${from.lng},${from.lat};${to.lng},${to.lat}`;
  const response=await fetch(`https://routing.openstreetmap.de/routed-${profile}/route/v1/${profile==='car'?'driving':'foot'}/${pair}?overview=full&geometries=geojson&radiuses=100;100`,{signal:AbortSignal.timeout(15000),referrerPolicy:'no-referrer'});
  if(!response.ok)throw Error('تعذر الاتصال بخدمة حساب الطريق');
  const data=await response.json(),route=data.routes?.[0],coords=route?.geometry?.coordinates;
  if(data.code!=='Ok'||!Array.isArray(coords)||coords.length<2||!coords.every(p=>p.length>=2&&p.every(Number.isFinite))||!Number.isFinite(route.distance)||!Number.isFinite(route.duration))throw Error('لم نجد طريقاً متصلاً مناسباً لوسيلة التنقل المختارة');
  return {roadPoints:coords.map(([lng,lat])=>({lat,lng})),distance:route.distance,duration:route.duration};
 });cache.set(key,task);queue=task.catch(()=>{});task.catch(()=>cache.delete(key));return task;
}
