const AUTH_COOKIE='__Host-rehlat_admin';
const authCookie=(token,age=0)=>AUTH_COOKIE+'='+token+'; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age='+age;
const authJSON=(data,status=200,cookie)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(cookie?{'Set-Cookie':cookie}:{})}});
function authToken(request){const value=(request.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(AUTH_COOKIE+'='))?.slice(AUTH_COOKIE.length+1);return value&&value.length<12000&&/^[A-Za-z0-9_.-]+$/.test(value)?value:null;}
async function sbAdmin(env,token){
 if(!token)return null;
 try{
  const user=await sbRequest(env,'/auth/v1/user',{token});
  if(!user?.id)return null;
  const admins=await sbRequest(env,'/rest/v1/rehlat_admins?user_id=eq.'+encodeURIComponent(user.id)+'&select=user_id',{token});
  return admins?.length===1?{token,user}:null;
 }catch{return null;}
}
async function authSession(request,env){return sbAdmin(env,authToken(request));}
async function handleAuth(request,env,path){
 if(path==='/api/auth/status'&&request.method==='GET')return authJSON({initialized:true});
 if(request.method!=='POST'||request.headers.get('Origin')!==new URL(request.url).origin||!(request.headers.get('Content-Type')||'').startsWith('application/json'))return authJSON({error:'طلب غير مسموح'},403);
 if(path==='/api/auth/logout'){
  const token=authToken(request);if(token){try{await sbRequest(env,'/auth/v1/logout?scope=local',{method:'POST',token});}catch{return authJSON({error:'تعذر إنهاء الجلسة لدى المزود. أعد المحاولة.'},503);}}
  return authJSON({ok:true},200,authCookie(''));
 }
 if(!['/api/auth/login','/api/auth/change'].includes(path))return authJSON({error:'إنشاء حساب الإدارة يتم من لوحة Supabase فقط.'},404);
 let b;try{b=await readJSON(request,4096);}catch(e){return authJSON({error:'بيانات غير صالحة'},e.status||400);}
 if(!b||typeof b.username!=='string'||b.username.length>254||!b.username.includes('@')||typeof b.password!=='string'||!b.password||b.password.length>128)return authJSON({error:'أدخل البريد الإلكتروني وكلمة المرور'},400);
 try{
  if(path.endsWith('/change')){
   const session=await authSession(request,env);if(!session)return authJSON({error:'سجّل الدخول مجدداً'},401);
   if(b.username.toLowerCase()!==session.user.email.toLowerCase()||typeof b.currentPassword!=='string'||b.currentPassword.length>128||b.password.length<12)return authJSON({error:'استخدم بريد الحساب الحالي وكلمة مرور جديدة من ١٢ محرفاً على الأقل'},400);
   const check=await sbRequest(env,'/auth/v1/token?grant_type=password',{method:'POST',body:{email:session.user.email,password:b.currentPassword}});
   if(check.user?.id!==session.user.id)return authJSON({error:'تعذر التحقق'},403);
   try{await sbRequest(env,'/auth/v1/user',{method:'PUT',token:check.access_token,body:{password:b.password}});}
   finally{try{await sbRequest(env,'/auth/v1/logout?scope=global',{method:'POST',token:check.access_token});}catch{}}
   return authJSON({ok:true},200,authCookie(''));
  }
  const result=await sbRequest(env,'/auth/v1/token?grant_type=password',{method:'POST',body:{email:b.username.trim(),password:b.password}});
  if(!await sbAdmin(env,result.access_token)){
   if(result.access_token)try{await sbRequest(env,'/auth/v1/logout?scope=local',{method:'POST',token:result.access_token});}catch{}
   return authJSON({error:'الحساب غير مخول للإدارة'},403);
  }
  const lifetime=Math.max(1,Math.min(3600,Number(result.expires_in)||3600));
  return authJSON({ok:true},200,authCookie(result.access_token,lifetime));
 }catch(e){return authJSON({error:e.status===429?'محاولات كثيرة؛ حاول لاحقاً.':'تعذر الدخول أو تغيير كلمة المرور. راجع البيانات والاتصال.'},e.status===429?429:401);}
}
function authPage(mode='login'){
 const setup=false,change=mode==='change';
 return new Response(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>إدارة رحلة سرفيس</title><link rel="stylesheet" href="/style.css"><script src="/admin-auth.js" defer></script></head><body><main class="login-page"><section class="login-card"><span class="eyebrow">إدارة رحلة سرفيس</span><h1>${setup?'تفعيل الإدارة':change?'تغيير بيانات الدخول':'تسجيل الدخول'}</h1><p>${setup?'اختر بيانات دخول خاصة بك. رمز التفعيل يُستخدم مرة واحدة فقط.':change?'تغيير البيانات ينهي الجلسات الحالية على جميع الأجهزة.':'ادخل بالبريد الإلكتروني وكلمة المرور الخاصين بالإدارة.'}</p><form id="authForm" data-mode="${mode}">${setup?'<label>رمز التفعيل<input name="code" required autocomplete="off" spellcheck="false" dir="ltr"></label>':''}${change?'<label>كلمة المرور الحالية<input name="currentPassword" type="password" autocomplete="current-password" required maxlength="128"></label>':''}<label>البريد الإلكتروني<input name="username" type="email" required maxlength="254" autocomplete="username" autocapitalize="none" spellcheck="false" dir="ltr"></label><label>${change?'كلمة المرور الجديدة':'كلمة المرور'}<input name="password" type="password" required ${setup||change?'minlength="12"':''} maxlength="128" autocomplete="${setup||change?'new-password':'current-password'}"></label>${setup||change?'<label>تأكيد كلمة المرور<input name="confirmPassword" type="password" required minlength="12" maxlength="128" autocomplete="new-password"></label><p class="small">استخدم بريد الحساب الحالي. كلمة المرور الجديدة ١٢ محرفاً على الأقل.</p>':''}<button class="primary full" type="submit">${setup?'تفعيل الحساب':change?'حفظ بيانات الدخول':'دخول'}</button><p id="authMessage" role="status"></p></form>${mode==='login'?'<p class="small">تنتهي الجلسة خلال ساعة كحد أقصى. عند انتهائها سجّل الدخول مجدداً. الحساب يُنشأ من لوحة Supabase.</p>':''}<p><a href="${change?'/admin':'/'}">${change?'العودة للإدارة':'العودة إلى تطبيق الركاب'}</a></p></section></main></body></html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"}});
}
