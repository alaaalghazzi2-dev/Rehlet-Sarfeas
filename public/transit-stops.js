import {STOP_LANDMARKS} from './stop-landmarks.js';
const stopMeters=(a,b)=>Math.hypot((a.lat-b.lat)*111195,(a.lng-b.lng)*92700);
function stopsForDirection(points){
 const base=points.filter(p=>!p.generatedStop);
 if(base.length<2)return base;
 const cum=[0];for(let i=1;i<base.length;i++)cum.push(cum[i-1]+stopMeters(base[i-1],base[i]));
 const candidates=[];
 function project(p){let best=null;for(let i=0;i<base.length-1;i++){const a=base[i],b=base[i+1],x=(b.lng-a.lng)*92700,y=(b.lat-a.lat)*111195,den=x*x+y*y;if(!den)continue;const t=Math.max(0,Math.min(1,((p.lng-a.lng)*92700*x+(p.lat-a.lat)*111195*y)/den));const q={lat:a.lat+t*(b.lat-a.lat),lng:a.lng+t*(b.lng-a.lng)};const d=stopMeters(p,q);if(!best||d<best.gap)best={...q,gap:d,at:cum[i]+t*(cum[i+1]-cum[i]),segment:i};}return best;}
 const minLat=Math.min(...base.map(p=>p.lat))-.001,maxLat=Math.max(...base.map(p=>p.lat))+.001,minLng=Math.min(...base.map(p=>p.lng))-.0012,maxLng=Math.max(...base.map(p=>p.lng))+.0012;
 for(const landmark of STOP_LANDMARKS){if(landmark.lat<minLat||landmark.lat>maxLat||landmark.lng<minLng||landmark.lng>maxLng)continue;const q=project(landmark);if(q&&q.gap<=(landmark.kind==='junction'?35:100)&&q.at>100&&q.at<cum.at(-1)-100)candidates.push({...q,name:(landmark.kind==='junction'?'':'قرب ')+landmark.name,kind:landmark.kind,osm:landmark.osm,priority:landmark.kind==='junction'?1:0});}
 const selected=base.map((p,i)=>p.stop&&!/^(?:نقطة(?:\s*[0-9٠-٩]+)?|انعطاف)$/.test(p.name)?{at:cum[i],existing:true}:null).filter(Boolean);
 for(const c of candidates.sort((a,b)=>a.priority-b.priority||a.gap-b.gap)){if(selected.every(p=>Math.abs(p.at-c.at)>120))selected.push(c);}
 for(let at=400;at<cum.at(-1)-150;at+=400){if(selected.some(p=>Math.abs(p.at-at)<280))continue;const i=cum.findIndex(v=>v>=at)-1,a=base[i],b=base[i+1],t=(at-cum[i])/(cum[i+1]-cum[i]);selected.push({lat:a.lat+(b.lat-a.lat)*t,lng:a.lng+(b.lng-a.lng)*t,at,segment:i,name:'على امتداد '+base[0].name+' — '+(at/1000).toFixed(1)+' كم من البداية',kind:'along_route'});}
 const inserts=selected.filter(p=>!p.existing).sort((a,b)=>a.at-b.at).slice(0,Math.max(0,1000-base.length));const path=[];
 for(let i=0;i<base.length;i++){path.push(base[i]);for(const p of inserts.filter(p=>p.segment===i))path.push({lat:p.lat,lng:p.lng,name:p.name.slice(0,90),stop:true,generatedStop:true,suggestedStop:true,stopKind:p.kind,osm:p.osm||null});}
 return path;
}

export function addTransitStops(route){const r=structuredClone(route);r.directions=r.directions.map(stopsForDirection);r.returnMode='independent';return r;}
