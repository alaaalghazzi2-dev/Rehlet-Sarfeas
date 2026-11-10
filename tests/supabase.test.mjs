import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {PGlite} from '@electric-sql/pglite';
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'};
const code=fs.readFileSync('dist/server/index.js','utf8').replace('export default','globalThis.worker=');
const route={id:'test',name:'خط تجريبي',color:'#123456',status:'demo',note:'',source:'',directions:[[{lat:33.51,lng:36.29,name:'مكان أ',stop:true},{lat:33.52,lng:36.3,name:'مكان ب',stop:true}],[]]};
function harness({member=true,revision=0,conflict=false,broken=false}={}){
 const calls=[];let row={routes:[],revision};
 const ctx=vm.createContext({Response,Request,URL,Headers,structuredClone,TextEncoder,TextDecoder,Uint8Array,AbortSignal,console,atob,fetch:async(url,opts={})=>{
  calls.push({url,opts});if(broken)throw Error('offline');
  if(url.includes('/auth/v1/token'))return Response.json({access_token:'test.jwt.token',expires_in:3600,user:{id:'admin'}});
  if(url.includes('/auth/v1/user'))return Response.json({id:'admin',email:'admin@example.com'});
  if(url.includes('/auth/v1/logout'))return new Response(null,{status:204});
  if(url.includes('rehlat_admins'))return Response.json(member?[{user_id:'admin'}]:[]);
  if(url.includes('rehlat_network')){if(opts.method==='PATCH'){if(conflict)return Response.json([]);row={...row,...JSON.parse(opts.body)};return Response.json([{revision:row.revision}]);}return Response.json([row]);}
  throw Error('Unexpected endpoint');
 }});vm.runInContext(code,ctx);
 return {ctx,calls,request:async(path,{method='GET',body,cookie=false,origin='https://app.example'}={})=>ctx.worker.fetch(new Request('https://app.example'+path,{method,headers:{...(cookie?{Cookie:'__Host-rehlat_admin=test.jwt.token'}:{}),...(method!=='GET'?{Origin:origin,'Content-Type':'application/json'}:{})},body:body===undefined?undefined:JSON.stringify(body)}),env)};
}
test('public network works; session exposes boolean only',async()=>{const h=harness();assert.equal((await h.request('/api/network')).status,200);assert.deepEqual(await(await h.request('/api/session',{cookie:true})).json(),{admin:true});});
test('anonymous and ordinary users cannot write or import',async()=>{for(const cookie of [false,true]){const h=harness({member:false});assert.equal((await h.request('/api/route',{method:'PUT',cookie,body:{route,revision:0}})).status,403);assert.equal((await h.request('/api/admin/import',{method:'POST',cookie,body:{routes:[route]}})).status,403);assert.equal(h.calls.some(c=>c.opts.method==='PATCH'),false);}});
test('admin save preserves optimistic concurrency and CSRF',async()=>{const h=harness();assert.equal((await h.request('/api/route',{method:'PUT',cookie:true,body:{route,revision:0},origin:'https://evil.example'})).status,403);const r=await h.request('/api/route',{method:'PUT',cookie:true,body:{route,revision:0}});assert.equal(r.status,200);assert.equal((await r.json()).revision,1);assert.ok(h.calls.find(c=>c.opts.method==='PATCH').url.includes('revision=eq.0'));const c=harness({conflict:true});assert.equal((await c.request('/api/route',{method:'PUT',cookie:true,body:{route,revision:0}})).status,409);});
test('import only into new database; rejects duplicate ids',async()=>{const h=harness();assert.equal((await h.request('/api/admin/import',{method:'POST',cookie:true,body:{routes:[route,route]}})).status,400);assert.equal((await h.request('/api/admin/import',{method:'POST',cookie:true,body:{routes:[route]}})).status,200);assert.equal((await h.request('/api/admin/import',{method:'POST',cookie:true,body:{routes:[route]}})).status,409);});
test('login sets protected cookie; nonadmin login rejected',async()=>{const h=harness();const r=await h.request('/api/auth/login',{method:'POST',body:{username:'admin@example.com',password:'test-password'}});assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/Secure; HttpOnly; SameSite=Strict/);assert.deepEqual(await r.json(),{ok:true});const no=harness({member:false});assert.equal((await no.request('/api/auth/login',{method:'POST',body:{username:'admin@example.com',password:'test-password'}})).status,403);});
test('database unavailable does not masquerade as empty success',async()=>{assert.equal((await harness({broken:true}).request('/api/network')).status,503);});
test('PostgreSQL schema enforces RLS and atomic revision filtering',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
 await db.exec(fs.readFileSync('supabase/setup.sql','utf8'));
 const admin='00000000-0000-0000-0000-000000000001',other='00000000-0000-0000-0000-000000000002';
 await db.exec(`insert into auth.users values ('${admin}'),('${other}'); insert into public.rehlat_admins values ('${admin}'); set role anon;`);
 assert.equal((await db.query('select revision from public.rehlat_network')).rows[0].revision,0);
 await assert.rejects(db.query("update public.rehlat_network set revision=1"));
 await db.exec(`reset role; set role authenticated; set request.jwt.claim.sub='${other}';`);
 assert.equal((await db.query('select * from public.rehlat_admins')).rows.length,0);
 assert.equal((await db.query('update public.rehlat_network set revision=1 returning revision')).rows.length,0);
 await assert.rejects(db.query(`insert into public.rehlat_admins values ('${other}')`));
 await db.exec(`set request.jwt.claim.sub='${admin}';`);
 assert.equal((await db.query('select * from public.rehlat_admins')).rows.length,1);
 assert.equal((await db.query("update public.rehlat_network set routes='[]',revision=1 where revision=0 returning revision")).rows.length,1);
 assert.equal((await db.query("update public.rehlat_network set revision=1 where revision=0 returning revision")).rows.length,0);
 await assert.rejects(db.query("delete from public.rehlat_network"));
 await db.exec(`reset role; delete from public.rehlat_admins; set role authenticated;`);
 assert.equal((await db.query('update public.rehlat_network set revision=2 returning revision')).rows.length,0);
 }finally{await db.close();}
});
