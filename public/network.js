import {JADAT_ROUTE} from './jadat-route.js';
import {DESTINATION_LANDMARKS} from './destination-landmarks.js';
import {addTransitStops} from './transit-stops.js';
import {DOCUMENT_ROUTES} from './document-routes.js';
import {ROAD_SHAPES} from './road-shapes.js';
export const SOURCE='https://t.me/s/damascusgovrnorat?q=%23%D8%A7%D9%84%D8%AA%D8%AA%D8%A8%D8%B9_%D8%A7%D9%84%D8%A7%D9%84%D9%83%D8%AA%D8%B1%D9%88%D9%86%D9%8A';
const p=(name,lat,lng)=>({name,lat,lng,stop:true});
export const PLACES=[p('البرامكة',33.5054,36.2911),p('باب توما',33.5138,36.3158),p('المهاجرين',33.5276,36.2778),p('ساحة المحافظة',33.5144,36.2924),p('شارع الثورة',33.5190,36.3030),p('ساحة العباسيين',33.5260,36.3255),p('الكراجات — القابون',33.5438,36.3345),p('المزة جبل',33.5080,36.2470),p('المواساة',33.5120,36.2595),p('ساحة الأمويين',33.5137,36.2760),p('الدويلعة',33.4985,36.3340),p('باب شرقي',33.5082,36.3210),p('مخيم فلسطين',33.4750,36.3035),p('باب مصلى',33.4995,36.3020),p('المزة ٨٦ مدرسة',33.5140,36.2350),p('مشروع دمر',33.5420,36.2270),p('مساكن الحرس',33.5320,36.2480)];
const at=n=>PLACES.find(p=>p.name===n);
function line(id,name,color,names){let path=names.map(at);return{id,name,color,status:'demo',source:SOURCE,note:'اسم الخط منشور؛ نقاطه واتجاهاه هنا افتراضية لتجربة الواجهة، وليست مسحاً لمسار السرفيس.',directions:[path,[...path].reverse()]};}
export const SEED=[line('R01','مزة جبل — كراجات','#087f76',['المزة جبل','المواساة','ساحة الأمويين','البرامكة','شارع الثورة','ساحة العباسيين','الكراجات — القابون']),line('R02','مهاجرين — باب توما','#7358bd',['المهاجرين','ساحة المحافظة','شارع الثورة','باب توما']),line('R03','دويلعة — كراجات','#ce6931',['الدويلعة','باب شرقي','باب توما','ساحة العباسيين','الكراجات — القابون']),line('R04','مخيم فلسطين — كراجات','#287ec2',['مخيم فلسطين','باب مصلى','البرامكة','شارع الثورة','ساحة العباسيين','الكراجات — القابون']),line('R05','مزة ٨٦ مدرسة','#b84973',['المزة ٨٦ مدرسة','المواساة','ساحة الأمويين','البرامكة']),line('R06','مشروع دمر — مساكن الحرس','#887322',['مشروع دمر','مساكن الحرس'])];
export function within(p){return p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&p.lat>=33.44&&p.lat<=33.59&&p.lng>=36.16&&p.lng<=36.38;}
export function namedPlace(p){return !!p&&p.stop===true&&typeof p.name==='string'&&!!p.name.trim()&&!/^(?:نقطة(?:\s*[0-9٠-٩۰-۹]+)?|نقطة على الخريطة|انعطاف(?:\s*[0-9٠-٩۰-۹]+)?)$/u.test(p.name.trim());}
export function destinationPlaces(routes){const seen=new Map();for(const p of [...routes.flatMap(r=>r.directions.flat()),...PLACES,...DESTINATION_LANDMARKS])if(namedPlace(p)&&!seen.has(p.name.trim()))seen.set(p.name.trim(),p);return [...seen.values()];}
export function validateRoute(r){if(!r||typeof r.id!=='string'||!/^[-A-Za-z0-9]{1,60}$/.test(r.id)||typeof r.name!=='string'||!r.name.trim()||r.name.length>90||!/^#[a-fA-F0-9]{6}$/.test(r.color)||!['demo','verified'].includes(r.status))throw Error('بيانات الخط غير صالحة');if(typeof r.note!=='string'||r.note.length>500||typeof r.source!=='string'||r.source.length>500)throw Error('راجع المصدر والملاحظة');if(r.source&&!/^https:\/\//.test(r.source))throw Error('المصدر يجب أن يبدأ بـ https://');if(!Array.isArray(r.directions)||r.directions.length!==2||r.directions[0].length<2||r.directions.some(d=>!Array.isArray(d)||d.length>1000||(d.length===1)||d.some(p=>!within(p)||typeof p.name!=='string'||!p.name.trim()||p.name.length>90||typeof p.stop!=='boolean')))throw Error('أضف نقطتين على الأقل للذهاب، واترك الإياب فارغاً أو أضف نقطتين على الأقل داخل دمشق');if(r.directions.some(d=>d.length&&d.filter(namedPlace).length<2))throw Error('حدد مكانين رئيسيين مسميين على الأقل لكل اتجاه مرسوم، مثل نقطة البداية والوصول');if(r.directions.some(d=>d.some(p=>p.stop&&!namedPlace(p))))throw Error('سمِّ الأماكن الرئيسية بأسماء حقيقية بدلاً من نقطة ورقم');if(r.status==='verified'&&!r.source&&!r.note.trim())throw Error('أضف مصدر التحقق أو وصف المعاينة الميدانية');return r;}
export function distance(a,b){const rad=Math.PI/180;const dlat=(b.lat-a.lat)*rad,dlng=(b.lng-a.lng)*rad;return 6371000*2*Math.atan2(Math.sqrt(Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlng/2)**2),Math.sqrt(1-(Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlng/2)**2)));}
const length=pts=>pts.slice(1).reduce((sum,p,i)=>sum+distance(pts[i],p),0);
export function planJourneys(routes,from,to,includeDemo=false,maxWalk=1500){
if(![500,1000,1500,3000].includes(maxWalk))throw Error('حد المشي غير صالح');if(!within(from)||!within(to))throw Error('اختر نقطتين ضمن نطاق دمشق');if(distance(from,to)<5)throw Error('نقطتا البداية والوصول متقاربتان جداً');
const dirs=routes.filter(r=>!r.trafficPending).flatMap(route=>route.directions.map((points,direction)=>({route,direction,points}))).filter(d=>!d.route.directionPending?.[d.direction]&&d.points.length>1&&(includeDemo||(d.route.directionStatus?.[d.direction]||d.route.status)==='verified'));
for(const d of dirs){d.cum=[0];for(let i=1;i<d.points.length;i++)d.cum.push(d.cum[i-1]+distance(d.points[i-1],d.points[i]));d.stops=d.points.flatMap((p,i)=>namedPlace(p)?[{p,i,from:distance(from,p),to:distance(to,p)}]:[]);
d.board=d.stops.map((_,j)=>{let best=null;for(let i=0;i<j;i++){const a=d.stops[i];if(a.from>maxWalk)continue;const ride=d.cum[d.stops[j].i]-d.cum[a.i],score=a.from*3+ride*.2;if(!best||score<best.score)best={i:a.i,walk:a.from,ride,score};}return best;});
d.exit=d.stops.map((_,j)=>{let best=null;for(let i=j+1;i<d.stops.length;i++){const a=d.stops[i];if(a.to>maxWalk)continue;const ride=d.cum[a.i]-d.cum[d.stops[j].i],score=a.to*3+ride*.2;if(!best||score<best.score)best={i:a.i,walk:a.to,ride,score};}return best;});}
const leg=(d,start,end)=>({id:d.route.id,name:d.route.name,color:d.route.color,status:d.route.directionStatus?.[d.direction]||d.route.status,direction:d.direction,terminus:d.points.findLast(namedPlace)?.name||d.route.name,points:d.points.slice(start,end+1),roadPoints:roadGeometry(d.route,d.direction,start,end),board:d.points[start],alight:d.points[end]});
const results=[];
for(const a of dirs){let best=null;for(let j=0;j<a.stops.length;j++){const stop=a.stops[j],board=a.board[j];if(!board||stop.to>maxWalk)continue;const score=board.score+stop.to*3;if(!best||score<best.score)best={score,legs:[leg(a,board.i,stop.i)],walk:board.walk+stop.to,ride:board.ride,from,to};}if(best)results.push(best);
if(!a.board.some(Boolean))continue;
for(const b of dirs){if(a.route.id===b.route.id||!b.exit.some(Boolean))continue;let transfer=null;
for(let j=0;j<a.stops.length;j++){const board=a.board[j];if(!board)continue;const ap=a.stops[j];for(let k=0;k<b.stops.length;k++){const exit=b.exit[k];if(!exit)continue;const bp=b.stops[k];if(Math.abs(ap.p.lat-bp.p.lat)*111195>maxWalk||Math.abs(ap.p.lng-bp.p.lng)*92000>maxWalk)continue;const walk=distance(ap.p,bp.p);if(walk>maxWalk)continue;const score=board.score+exit.score+walk*3+650;if(!transfer||score<transfer.score)transfer={score,j,k,board,exit,walk};}}
if(transfer){const x=transfer;results.push({score:x.score,legs:[leg(a,x.board.i,a.stops[x.j].i),leg(b,b.stops[x.k].i,x.exit.i)],walk:x.board.walk+x.walk+x.exit.walk,ride:x.board.ride+x.exit.ride,from,to});}}}
results.sort((a,b)=>a.score-b.score);const unique=new Map();for(const r of results){const key=r.legs.map(l=>l.id+':'+l.direction).join('|');if(!unique.has(key))unique.set(key,r);}const alternatives=[...unique.values()].slice(0,5);for(const r of alternatives){r.demo=r.legs.some(l=>l.status==='demo');r.segments=journeySegments(r);}const walking={legs:[],walk:distance(from,to),ride:0,demo:false,from,to,walkingOnly:true};walking.score=walking.walk*3;walking.segments=journeySegments(walking);return [...alternatives,walking];}

export function journeySegments(trip){const result=[];let current=trip.from;function walk(end){const meters=distance(current,end);if(meters>=1)result.push({type:'walk',from:current,to:end,distance:meters});current=end;}for(const leg of trip.legs){walk(leg.board);result.push({type:'ride',...leg});current=leg.alight;}walk(trip.to);return result;}

// Apply only to unchanged built-in coordinates; never replace a user's drawn route.
export function roadGeometry(route,direction,start=0,end=null){const shape=ROAD_SHAPES[route.id]?.[direction],pts=route.directions[direction];if(!shape||shape.anchors.length!==pts.length||pts.some((p,i)=>p.lat!==shape.anchors[i][0]||p.lng!==shape.anchors[i][1]))return null;const last=end===null?pts.length-1:end;if(start<0||last>=pts.length||last<=start)return null;return shape.legs.slice(start,last).flat().map(([lng,lat])=>({lat,lng}));}

// Owner edits always win. Only unchanged original demos are replaced by document entries.
export function mergeDocumentRoutes(saved){
 const original=new Map(SEED.map(r=>[r.id,r]));
 const result=saved.filter(r=>!original.has(r.id)||JSON.stringify(r)!==JSON.stringify(original.get(r.id))).map(r=>structuredClone(r));
 for(const item of DOCUMENT_ROUTES){
  let existing=result.find(r=>r.id===item.id);
  if(!existing&&item.documentNumber===22)existing=result.find(r=>/جادات/.test(r.name)&&/سلم/.test(r.name));
  if(existing){existing.documentNumber=item.documentNumber;existing.documentFrom=item.documentFrom;existing.documentTo=item.documentTo;continue;}
  result.push(structuredClone(item));
 }
 return result.map(r=>{
 const original=DOCUMENT_ROUTES.find(d=>d.id===r.id);
 const plain=path=>path.filter(p=>!p.generatedStop).map(p=>[p.lat,p.lng,p.name,p.stop]);
 const same=(a,b)=>JSON.stringify(plain(a))===JSON.stringify(plain(b));
 if(r.id===JADAT_ROUTE.id&&same(r.directions[0],JADAT_ROUTE.forward)&&(same(r.directions[1],JADAT_ROUTE.sourceReturn)||same(r.directions[1],JADAT_ROUTE.returnPath))){
  r.directions[1]=structuredClone(JADAT_ROUTE.returnPath);r.status='verified';r.directionStatus=['verified','demo'];r.circular=true;r.trafficRouted=true;r.trafficPending=false;r.geometryOrigin='owner';r.note='دورة الخط كما رسمها المالك وأكد صحتها ميدانيًا في ٥ تشرين الأول ٢٠٢٦. يتبع التخطيط ترتيب الحركة المرسوم دون عكسه آليًا.';return addTransitStops(r);
 }
 // Restore pre-existing road-routed directions only when no owner geometry was changed.
 if(original&&original.directions[0].length>1&&same(r.directions[0],original.directions[0])&&(same(r.directions[1],original.directions[1])||same(r.directions[1],[...original.directions[0]].reverse()))){
  r.directions=structuredClone(original.directions);r.trafficRouted=true;r.trafficPending=false;r.returnMode='independent';
 }else if(!r.trafficRouted){r.trafficPending=true;}
 return addTransitStops(r);
 }).sort((a,b)=>(a.documentNumber||999)-(b.documentNumber||999));
}
