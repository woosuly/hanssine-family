/* 서비스 워커: 화면 파일은 네트워크 우선(업데이트 즉시 반영), 끊기면 저장본 사용 */
const CACHE='hanssine-v30';
const FILES=["./", "index.html", "manifest.json", "css/tokens.css", "css/app.css", "js/core/util.js", "js/core/sample-art.js", "js/core/firebase-config.js", "js/core/data.js", "js/core/sync.js", "js/core/media.js", "js/core/push.js", "js/core/ui.js", "js/core/voice.js", "js/core/ai.js", "js/core/weather.js", "js/features/stickers.js", "js/features/chat.js", "js/features/rooms.js", "js/features/unread.js", "js/features/calendar.js", "js/features/anniv.js", "js/features/dues.js", "js/features/bot.js", "js/features/translate.js", "js/features/exercise.js", "js/features/games.js", "js/features/games2.js", "js/features/album.js", "js/features/senior.js", "js/features/home.js", "js/features/settings.js", "js/features/auth.js", "js/main.js", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||(u.origin!==location.origin&&!/gstatic\.com|jsdelivr\.net/.test(u.host)))return;
  e.respondWith(fetch(e.request,u.origin===location.origin?{cache:'no-cache'}:{}).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||(u.origin===location.origin?caches.match('index.html'):Response.error()))))});

// 앱 화면이 지금 보이는지: 화면이 알려 줌 (다른 앱을 쓰는 중이면 알림 표시)
let VIS={v:false,at:0};
self.addEventListener('message',e=>{const d=e.data||{};if(d.type==='vis')VIS={v:!!d.v,at:Date.now()}});
/* 푸시 알림: 서버는 데이터만 보내고 표시는 여기서 함 (같은 알림 두 번 뜨는 것 방지) */
self.addEventListener('push',e=>{let j={};try{j=e.data?e.data.json():{}}catch(x){}
  const d=j.data||j||{};const sos=d.k==='sos';
  e.waitUntil((async()=>{
    const cs=await clients.matchAll({type:'window',includeUncontrolled:true});
    // 앱을 보고 있으면 화면에 바로 나타나므로 알림 생략 (긴급은 항상 표시, 아이폰은 표시 필수)
    if(!sos&&!/iPhone|iPad|iPod/.test(navigator.userAgent)&&VIS.v&&Date.now()-VIS.at<25000)return;
    await self.registration.showNotification(d.title||'한씨네',{body:d.body||'',tag:d.tag||('k-'+Date.now()),renotify:true,
      icon:'icons/icon-192.png',badge:'icons/badge-96.png',data:{k:d.k||'',id:d.id||''},requireInteraction:sos,
      vibrate:sos?[600,200,600,200,1200]:[200,100,200],actions:[{action:'close',title:'닫기'}]})})())});
// 알림 누르기: 열린 앱이 있으면 그 화면으로, 없으면 앱을 열어 해당 화면으로. '닫기'는 알림만 닫음
self.addEventListener('notificationclick',e=>{e.notification.close();if(e.action==='close')return;const k=(e.notification.data||{}).k||'',id=(e.notification.data||{}).id||'';
  e.waitUntil((async()=>{const scope=self.registration.scope;const cs=await clients.matchAll({type:'window',includeUncontrolled:true});
    const c=cs.find(x=>x.url.startsWith(scope));
    if(c){try{await c.focus()}catch(x){}c.postMessage({type:'open',k,id});return}
    await clients.openWindow(scope+(k?'?open='+encodeURIComponent(k)+(id?'&rid='+encodeURIComponent(id):''):''))})())});

