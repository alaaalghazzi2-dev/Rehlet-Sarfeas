// Network-only: never cache private route records, maps or authenticated pages.
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 if(event.request.mode!=='navigate'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith(fetch(event.request).catch(()=>new Response('<!doctype html><html lang="ar" dir="rtl"><meta name="viewport" content="width=device-width, initial-scale=1"><meta charset="utf-8"><title>رحلة سرفيس</title><body style="font-family:Tahoma,sans-serif;padding:40px 24px;background:#f1f8f6;color:#153d37;line-height:2"><h1>رحلة سرفيس</h1><p>أنت غير متصل بالإنترنت. اتصل بالشبكة لعرض الخريطة والخطوط المحفوظة.</p><a href="/" style="color:#087f76">إعادة المحاولة</a></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})));
});
