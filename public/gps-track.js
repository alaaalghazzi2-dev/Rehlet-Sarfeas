// Pure capture filtering; raw timestamps/accuracy stay in the local recording.
export const meters=(a,b)=>Math.hypot((a.lat-b.lat)*111195,(a.lng-b.lng)*92700);
export function acceptFix(track,pos,now=Date.now()){
 const c=pos.coords||{},p={lat:c.latitude,lng:c.longitude,accuracy:c.accuracy,t:pos.timestamp};
 if(![p.lat,p.lng,p.accuracy,p.t].every(Number.isFinite)||p.accuracy<0||p.accuracy>35)return {reason:'إشارة GPS ضعيفة؛ ننتظر دقة أفضل من ٣٥ متراً.'};
 if(p.lat<33.44||p.lat>33.59||p.lng<36.16||p.lng>36.38)return {reason:'الموقع خارج نطاق دمشق المتاح.'};
 if(now-p.t>15000||p.t>now+5000)return {reason:'قراءة موقع قديمة؛ ننتظر قراءة جديدة.'};
 const last=track.points.at(-1);
 if(last){
  const dt=(p.t-last.t)/1000,d=meters(last,p);
  if(dt<=0)return {reason:'ننتظر تحديث الموقع.'};
  if(d/dt>40)return {reason:'تم تجاهل قفزة غير واقعية في الموقع.'};
  if(d<7)return {reason:'بانتظار الحركة…'};
  p.breakBefore=d>150||(dt>25&&d>60)||!!track.interrupted;
 }
 if(track.points.length>=900)return {full:true,reason:'وصل التسجيل إلى الحد الأقصى؛ أنهِ الرحلة للمراجعة.'};
 track.interrupted=false;track.points.push(p);
 return {point:p};
}
export function segments(points){const out=[];for(const p of points){if(!out.length||p.breakBefore)out.push([]);out.at(-1).push(p);}return out;}
export function trackLength(points){return points.reduce((n,p,i)=>n+(i&&!p.breakBefore?meters(points[i-1],p):0),0);}
export const geometrySignature=points=>JSON.stringify(points.filter(p=>!p.generatedStop).map(p=>[p.lat,p.lng]));
export function prepareRecordedRoute(route,original){
 const recorded=route.fieldRecordings||{};
 const trusted=route.directions.map((path,i)=>{
  if(path.length<2)return false;
  if(recorded[i]===geometrySignature(path))return true;
  return !!original?.trafficRouted&&!original?.directionPending?.[i]&&geometrySignature(path)===geometrySignature(original.directions[i]);
 });
 route.directionPending=trusted.map(t=>!t);route.trafficRouted=trusted.some(Boolean);route.trafficPending=trusted.every(t=>!t);
 route.directionStatus=route.directions.map((p,i)=>{
  if(recorded[i]===geometrySignature(p))return route.status==='verified'?'verified':'demo';
  if(trusted[i])return original?.directionStatus?.[i]||original?.status||'demo';
  return 'demo';
 });
 return route;
}
