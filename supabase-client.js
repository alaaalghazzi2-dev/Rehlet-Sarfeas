// Server-side HTTP adapter. No service_role key is needed or accepted.
function sbConfig(env) {
 const url = new URL(env.SUPABASE_URL || '');
 if(url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw Error('Invalid Supabase URL');
 const key = env.SUPABASE_PUBLISHABLE_KEY;
 if(typeof key !== 'string' || !key.startsWith('sb_publishable_')) throw Error('Use a Supabase publishable key');
 return {url:url.origin,key};
}
async function sbRequest(env,path,{token,method='GET',body,headers={}}={}) {
 const c=sbConfig(env);
 const response=await fetch(c.url+path,{method,headers:{apikey:c.key,...(token?{Authorization:'Bearer '+token}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 if(!response.ok){const e=new Error('Supabase request failed');e.status=response.status;throw e;}
 const text=await response.text();return text?JSON.parse(text):null;
}
async function sbRead(env) {
 const rows=await sbRequest(env,'/rest/v1/rehlat_network?id=eq.damascus&select=routes,revision');
 if(!Array.isArray(rows)||rows.length!==1)throw Error('Run supabase/setup.sql first');
 const row=rows[0];
 if(!Array.isArray(row.routes)||!Number.isSafeInteger(row.revision))throw Error('Invalid database data');
 return {routes:mergeDocumentRoutes(row.revision===0?SEED:row.routes),revision:row.revision};
}
async function sbSave(env,token,routes,revision) {
 const rows=await sbRequest(env,'/rest/v1/rehlat_network?id=eq.damascus&revision=eq.'+revision+'&select=revision',{token,method:'PATCH',body:{routes,revision:revision+1,updated_at:new Date().toISOString()},headers:{Prefer:'return=representation'}});
 return Array.isArray(rows)&&rows.length===1;
}
async function readJSON(request,maxBytes){
 if(!request.body)throw Error('Empty body');
 const reader=request.body.getReader();const chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();const e=new Error('Payload too large');e.status=413;throw e;}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 return JSON.parse(new TextDecoder().decode(bytes));
}
function validImport(routes){
 if(!Array.isArray(routes)||routes.length<1||routes.length>300)throw Error('عدد الخطوط غير صالح');
 const ids=new Set();
 for(const r of routes){
  if(!r||typeof r.id!=='string'||!/^[-A-Za-z0-9]{1,60}$/.test(r.id)||ids.has(r.id)||typeof r.name!=='string'||!r.name.trim()||r.name.length>90||!/^#[a-fA-F0-9]{6}$/.test(r.color)||!['demo','verified'].includes(r.status))throw Error('بيانات الخط غير صالحة');
  ids.add(r.id);
  if(!Array.isArray(r.directions)||r.directions.length!==2||r.directions.some(d=>!Array.isArray(d)||d.length>1000||d.some(n=>!n||!Number.isFinite(n.lat)||!Number.isFinite(n.lng)||n.lat<33.35||n.lat>33.7||n.lng<36.05||n.lng>36.55||typeof n.name!=='string'||n.name.length>90||typeof n.stop!=='boolean')))throw Error('إحداثيات غير صالحة');
 }
 return routes;
}
