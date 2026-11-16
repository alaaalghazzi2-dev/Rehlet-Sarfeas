// Local-only foreground journey guidance. No GPS history is stored or uploaded.
export function distanceMeters(a,b){const r=Math.PI/180,dlat=(b.lat-a.lat)*r,dlng=(b.lng-a.lng)*r,x=Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlng/2)**2;return 6371000*2*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)));}
export function proximity(position,target,now=Date.now()){
 const c=position.coords;
 if(!Number.isFinite(c.latitude)||!Number.isFinite(c.longitude)||!Number.isFinite(c.accuracy)||c.accuracy>60||c.accuracy<0||now-position.timestamp>15000||position.timestamp>now+5000)return {reliable:false};
 const distance=distanceMeters({lat:c.latitude,lng:c.longitude},target);
 return {reliable:true,distance,near:distance+c.accuracy<=180,arrived:distance+c.accuracy<=60};
}
export function setupJourneyFollow({map,getTrip,host}){
 let watch=null,trip=null,step=0,marker=null,circle=null,lastFix=0,timer=null,wake=null,nearHits=0,arrivalHits=0,announced=false,follow=true;
 const card=document.createElement('section');card.className='journey-follow';card.innerHTML='<strong>متابعة الرحلة</strong><p class="follow-help">أبقِ الشاشة مفتوحة. الموقع يبقى على جهازك. التنبيهات مساعدة ولا تؤكد وجود موقف آمن.</p><button class="primary" data-action="start">ابدأ الرحلة</button><div data-active hidden><label>الخطوة الحالية<select aria-label="الخطوة الحالية"></select></label><p role="status" aria-live="polite" data-status></p><button data-action="center">تابع موقعي على الخريطة</button><button data-action="next">أنهيت هذه الخطوة، تابع</button><button data-action="stop">إيقاف المتابعة</button></div>';
 host.prepend(card);const q=s=>card.querySelector(s),status=q('[data-status]'),select=q('select');
 const target=()=>trip.segments[step].type==='walk'?trip.segments[step].to:trip.segments[step].alight;
 const instruction=()=>{const s=trip.segments[step];return s.type==='walk'?'امشِ إلى «'+s.to.name+'»':'أنت على '+s.name+'؛ انزل عند «'+s.alight.name+'»';};
 function announce(text){status.textContent=text;if(navigator.vibrate)navigator.vibrate([200,100,200]);}
 async function holdScreen(){try{if(navigator.wakeLock&&document.visibilityState==='visible'&&watch!==null)wake=await navigator.wakeLock.request('screen');}catch{}}
 function stop(text='توقفت المتابعة.'){if(watch!==null)navigator.geolocation.clearWatch(watch);watch=null;clearInterval(timer);wake?.release().catch(()=>{});wake=null;marker?.remove();circle?.remove();marker=circle=null;trip=null;q('[data-active]').hidden=true;q('[data-action="start"]').hidden=false;q('.follow-help').textContent=text+' أبقِ الشاشة مفتوحة أثناء المتابعة؛ لا تُحفظ إحداثياتك.';}
 function resetStep(){nearHits=arrivalHits=0;announced=false;status.textContent=instruction();q('[data-action="next"]').textContent=step===trip.segments.length-1?'وصلت، إنهاء الرحلة':'أنهيت هذه الخطوة، تابع';}
 q('[data-action="start"]').onclick=()=>{
 const t=getTrip();if(!t?.segments?.length){q('.follow-help').textContent='اختر رحلة سرفيس أو مشي أولاً.';return;}
 if(t.demo||t.segments.some(s=>s.type!=='walk'&&s.status==='demo')){q('.follow-help').textContent='هذه رحلة مستنتجة غير معتمدة. اختر رحلة بخطوط متحقق منها لتفعيل تنبيهات النزول.';return;}
 if(!navigator.geolocation){q('.follow-help').textContent='تحديد الموقع غير مدعوم في هذا المتصفح.';return;}
 trip=structuredClone(t);step=0;follow=true;lastFix=Date.now();select.replaceChildren();trip.segments.forEach((s,i)=>{const o=document.createElement('option');o.value=i;o.textContent=(i+1)+' · '+(s.type==='walk'?'مشي إلى '+s.to.name:s.name+' — النزول: '+s.alight.name);select.append(o);});
 q('[data-active]').hidden=false;q('[data-action="start"]').hidden=true;resetStep();
 q('.follow-help').textContent='إذا ركبت السرفيس بالفعل، اختر خطوة السرفيس من القائمة. المسافة المعروضة قرب جغرافي وليست المسافة المتبقية على الشارع.';
 watch=navigator.geolocation.watchPosition(p=>{
 if(!trip)return;lastFix=Date.now();const result=proximity(p,target());
 if(!result.reliable){nearHits=arrivalHits=0;status.textContent='دقة الموقع ضعيفة أو القراءة قديمة؛ لا يمكن تأكيد الاقتراب. '+instruction();return;}
 const ll=[p.coords.latitude,p.coords.longitude];if(!marker){marker=L.circleMarker(ll,{radius:8,color:'#fff',weight:3,fillColor:'#1976d2',fillOpacity:1}).addTo(map);circle=L.circle(ll,{radius:p.coords.accuracy,color:'#1976d2',weight:1,fillOpacity:.08}).addTo(map);}else{marker.setLatLng(ll);circle.setLatLng(ll).setRadius(p.coords.accuracy);}if(follow)map.panTo(ll,{animate:false});
 nearHits=result.near?nearHits+1:0;arrivalHits=result.arrived?arrivalHits+1:0;
 status.textContent=instruction()+' · قرب جغرافي: '+Math.round(result.distance)+' م · دقة ±'+Math.round(p.coords.accuracy)+' م';
 if(nearHits>=2&&!announced){announced=true;announce((step===trip.segments.length-1?'اقتربت من وجهتك. ':trip.segments[step].type==='walk'?'اقتربت من نقطة الركوب أو التبديل. ':'استعد للنزول قريباً. ')+instruction());}
 if(arrivalHits>=2)status.textContent='أنت قريب جداً من «'+target().name+'». تحقق من المكان ثم اضغط «'+q('[data-action="next"]').textContent+'». لن ننتقل تلقائياً.';
 },e=>{if(e.code===1)stop('لم يُسمح بالوصول إلى الموقع.');else{nearHits=arrivalHits=0;status.textContent='تعذر تحديث الموقع؛ لا تعتمد على تنبيه النزول حتى عودة الإشارة.';}},{enableHighAccuracy:true,maximumAge:0,timeout:15000});
 timer=setInterval(()=>{if(trip&&Date.now()-lastFix>20000){nearHits=arrivalHits=0;status.textContent='انقطعت تحديثات الموقع. راقب الطريق وانتظر عودة الإشارة.';}},5000);holdScreen();
 };
 select.onchange=()=>{step=Number(select.value);resetStep();};
 q('[data-action="next"]').onclick=()=>{if(step===trip.segments.length-1){stop('انتهت الرحلة.');return;}step++;select.value=step;resetStep();};
 q('[data-action="stop"]').onclick=()=>stop();q('[data-action="center"]').onclick=()=>{follow=true;if(marker)map.panTo(marker.getLatLng());};map?.on('dragstart',()=>{follow=false;});
 document.addEventListener('visibilitychange',()=>{if(trip){nearHits=arrivalHits=0;lastFix=0;if(document.hidden)status.textContent='المتابعة في الخلفية غير مضمونة؛ افتح التطبيق لاستئنافها.';else holdScreen();}});
 window.addEventListener('pagehide',()=>stop());return {stop,isActive:()=>watch!==null};
}
