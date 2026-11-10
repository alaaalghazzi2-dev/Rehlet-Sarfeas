import {acceptFix,segments,trackLength,geometrySignature} from './gps-track.js';
export function setupRecorder({getContext,apply,lock,preview,restoreMap}){
 const $=id=>document.getElementById(id),key='rehlat-admin-gps-v1';
 let track=null,active=false,watch=null,timer=null,wake=null,status='',storageOK=true,session=0;
 const msg=s=>{status=s;render();};
 function persist(){try{if(track)localStorage.setItem(key,JSON.stringify(track));else localStorage.removeItem(key);storageOK=true;}catch{storageOK=false;}}
 function render(){
  $('gpsStart').disabled=!!track||active;
  $('gpsStop').disabled=!active;$('gpsMapStop').hidden=!active;
  $('gpsApply').disabled=active||!track||track.applied||track.points.length<3||track.points.some(p=>p.breakBefore);
  $('gpsDiscard').disabled=!track;
  $('gpsReview').hidden=!track||active;
  $('gpsStatus').textContent=status+(storageOK?'':' — تعذر حفظ المسودة على الهاتف؛ لا تغلق الصفحة.');
  $('gpsStats').textContent=track?track.name+' · '+(track.direction?'إياب':'ذهاب')+' · '+track.points.length+' نقطة · '+(trackLength(track.points)/1000).toFixed(2)+' كم · '+Math.floor(((active?Date.now():track.ended||Date.now())-track.started)/60000)+' دقيقة':'';
  $('gpsGaps').hidden=!track?.points.some(p=>p.breakBefore);
 }
 async function wakeScreen(){
  try{if(!active||document.visibilityState!=='visible')return;const w=await navigator.wakeLock?.request('screen');if(!active){w?.release();return;}wake=w;}catch{}
 }
 function release(){session++;if(watch!==null)navigator.geolocation.clearWatch(watch);watch=null;clearInterval(timer);timer=null;wake?.release().catch(()=>{});wake=null;}
 function stop(text='انتهى التسجيل. راجع المسار وسمِّ البداية والنهاية ثم انقله إلى محرر الخط.'){
  active=false;release();if(track){track.ended=Date.now();persist();}msg(text);
 }
 function show(){if(track)preview(segments(track.points),track.color);}
 function setLocked(value){lock(value);$('gpsStart').disabled=!!track;}
 $('gpsStart').onclick=()=>{
  const ctx=getContext();if(!ctx)return;
  try{if(localStorage.getItem(key)&&!confirm('يوجد تسجيل محلي سابق. حذفه وبدء تسجيل جديد؟'))return;}catch{}
  if(!navigator.geolocation){msg('تحديد الموقع غير مدعوم في هذا المتصفح.');return;}
  track={...ctx,points:[],started:Date.now(),interrupted:false};active=true;session++;const token=session;
  $('gpsFrom').value='';$('gpsTo').value='';$('gpsConfirmed').checked=false;
  $('gpsRestore').hidden=true;setLocked(true);persist();show();msg('جارٍ طلب إذن الموقع وانتظار GPS…');wakeScreen();
  timer=setInterval(()=>{if(track?.points.length&&Date.now()-track.points.at(-1).t>25000)status='لم تصل قراءة حديثة. أبقِ الصفحة مفتوحة وتحقق من GPS.';render();},1000);
  try{watch=navigator.geolocation.watchPosition(pos=>{
   if(!active||token!==session)return;
   const result=acceptFix(track,pos);
   if(result.point){persist();show();msg('جارٍ تسجيل الرحلة · دقة آخر نقطة ±'+Math.round(result.point.accuracy)+' م');}
   else if(result.full)stop(result.reason);else msg(result.reason);
  },e=>{if(!active||token!==session)return;if(e.code===1)stop('لم يُسمح بالوصول إلى الموقع. فعّل الإذن ثم احذف التسجيل الفارغ وأعد البدء.');else msg('تعذر تحديد الموقع مؤقتاً؛ ننتظر عودة GPS.');},{enableHighAccuracy:true,maximumAge:0,timeout:15000});}
  catch{stop('تعذر بدء تسجيل الموقع. تحقق من إذن الموقع وأعد المحاولة.');}
 };
 $('gpsStop').onclick=()=>stop();
 $('gpsMapStop').onclick=()=>{stop();$('gpsRecorder').scrollIntoView({behavior:'smooth',block:'start'});};
 $('gpsShowMap').onclick=()=>document.querySelector('.map-area').scrollIntoView({behavior:'smooth',block:'start'});
 $('gpsDiscard').onclick=()=>{if(track?.points.length&&!confirm('حذف التسجيل المحلي؟ لن يتغير الخط المحفوظ.'))return;active=false;release();track=null;persist();setLocked(false);restoreMap();msg('تم حذف التسجيل المحلي.');};
 $('gpsApply').onclick=()=>{
  if(active||!track||track.applied||track.points.length<3||track.points.some(p=>p.breakBefore))return;
  const start=$('gpsFrom').value.trim(),end=$('gpsTo').value.trim();
  if(!start||!end){msg('اكتب اسم مكان بداية التسجيل ونهايته.');return;}
  if(!$('gpsConfirmed').checked){msg('أكد أنك سجلت الاتجاه كاملاً وراجعت المسار على الخريطة.');return;}
  if(!confirm('استبدال اتجاه '+(track.direction?'الإياب':'الذهاب')+' بهذا التسجيل في المحرر؟ لن ينشر قبل الضغط على حفظ الخط.'))return;
  try{apply(track,start,end);}catch(e){msg(e.message);return;}
  // Keep local recovery copy until the server confirms saving.
  track.applied=true;persist();setLocked(false);restoreMap();msg('نُقل التسجيل إلى المحرر. اضغط «حفظ الخط» لنشره للركاب.');
 };
 $('gpsRestore').onclick=()=>{
  if(track)return;
  try{
   const saved=JSON.parse(localStorage.getItem(key)||'null'),ctx=getContext();
   if(!saved||!ctx)return;
   if(saved.id!==ctx.id||saved.direction!==ctx.direction){msg('اختر الخط «'+saved.name+'» واتجاه '+(saved.direction?'الإياب':'الذهاب')+' أولاً ثم استعد المسودة.');return;}
   if(!Array.isArray(saved.points)||saved.points.length>900||saved.points.some(p=>![p.lat,p.lng,p.t,p.accuracy].every(Number.isFinite)))throw Error();
   track=saved;track.applied=false;track.ended=track.ended||track.points.at(-1)?.t||track.started;active=false;setLocked(true);show();msg('استُعيدت المسودة للمراجعة فقط؛ التسجيل متوقف.');$('gpsRestore').hidden=true;
  }catch{msg('تعذر قراءة مسودة التسجيل.');}
 };
 function detect(){try{const saved=JSON.parse(localStorage.getItem(key)||'null');$('gpsRestore').hidden=!saved;}catch{}}
 document.addEventListener('visibilitychange',()=>{
  if(!active)return;
  if(document.visibilityState==='hidden'){track.interrupted=track.points.length>0;persist();}
  else{wakeScreen();msg('عدت إلى التسجيل. أي انقطاع مع حركة سيظهر كفجوة تحتاج إعادة تسجيل.');}
 });
 window.addEventListener('beforeunload',e=>{if(active||track){persist();e.preventDefault();e.returnValue='';}});
 window.addEventListener('pagehide',()=>{if(active)stop('توقف التسجيل عند مغادرة الصفحة.');});
 detect();render();
 return {busy:()=>active||!!track&&!track.applied, saved:route=>{if(track?.applied&&track.id===route.id&&geometrySignature(route.directions[track.direction])===JSON.stringify(track.points.map(p=>[p.lat,p.lng]))){track=null;persist();detect();render();}}};
}
