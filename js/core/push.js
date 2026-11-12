/* core/push — 웹 푸시 알림: 이 폰 알림 켜기, 알림 받을 주소(토큰) 저장, 알림 눌러 해당 화면 열기 */
const PUSH_OK=()=>!LOCAL&&!!VAPID_KEY&&'Notification' in window&&'serviceWorker' in navigator&&'PushManager' in window&&typeof firebase!=='undefined'&&!!firebase.messaging;
const pushState=()=>!PUSH_OK()?'unsupported':Notification.permission; // granted · denied · default · unsupported
const isIOS=()=>/iPhone|iPad|iPod/.test(navigator.userAgent);
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
// ask=true 일 때만 허용 창을 띄움 (버튼을 눌렀을 때)
async function pushRegister(ask){
  if(!PUSH_OK()||!SYNC.uid||!SYNC.dev)return 'unsupported';
  if(Notification.permission==='default'){if(!ask)return 'default';const p=await Notification.requestPermission();if(p!=='granted')return p}
  if(Notification.permission!=='granted')return Notification.permission;
  try{const reg=await navigator.serviceWorker.ready;
    const tok=await firebase.messaging().getToken({vapidKey:VAPID_KEY,serviceWorkerRegistration:reg});
    if(tok&&SYNC.dev.fcm!==tok){await famRef().collection('devices').doc(SYNC.uid).update({fcm:tok,fcmAt:Date.now()});SYNC.dev.fcm=tok}
    return 'granted'}catch(e){console.warn('push',e);return 'error'}}
async function pushTest(){try{const reg=await navigator.serviceWorker.ready;
  await reg.showNotification('한씨네',{body:'알림 시험입니다. 화면 위에 이렇게 뜨면 정상이에요.',tag:'test',icon:'icons/icon-192.png',badge:'icons/badge-96.png',data:{k:''}})}catch(e){toast('시험 알림을 띄우지 못했어요')}}
// 설정 화면의 알림 줄
function pushRowHtml(){const s=pushState();
  if(s==='unsupported')return `<div class="small muted">${isIOS()&&!isStandalone()?'아이폰은 사파리에서 공유 → 홈 화면에 추가한 뒤 그 앱에서 알림을 켤 수 있어요.':LOCAL||!VAPID_KEY?'알림 기능 준비 중입니다.':'이 브라우저는 알림을 지원하지 않아요.'}</div>`;
  if(s==='denied')return `<div class="small" style="color:var(--red)">알림이 차단되어 있어요. 휴대폰 설정 → 애플리케이션에서 이 앱(또는 브라우저)의 알림을 허용해 주세요.</div>`;
  if(s==='default')return `<button class="btn block" id="pushon">이 폰 알림 켜기</button>`;
  return `<div class="row between"><span>이 폰 알림 <b>켜짐</b></span><button class="chip" id="pushtest">시험 알림</button></div>
    <div class="small muted">시험 알림이 화면 위에 뜨지 않으면 휴대폰 설정 → 알림에서 이 앱의 '팝업으로 표시'를 켜 주세요.</div>`}
function bindPushRow(after){
  if($('#pushon'))$('#pushon').onclick=async()=>{const r=await pushRegister(true);
    toast(r==='granted'?'알림을 켰어요':r==='denied'?'알림이 차단되었어요':'알림을 켜지 못했어요');after&&after()};
  if($('#pushtest'))$('#pushtest').onclick=pushTest}
// 알림을 눌러 들어왔을 때 해당 화면으로
function openFromPush(k,id){if(!ME||!mem(ME))return;close();
  const room=k==='room'&&id;
  if(me().role==='parent'){SR_TAB=(k==='chat'||room)?'talk':'home';if(k==='chat')SCHAT='fam';if(room){SCHAT='room:'+id;openRoom(id)}}
  else{TAB={chat:'talk',room:'talk',photos:'album',events:'cal',notices:'home',sos:'home'}[k]||TAB;if(k==='chat'){closeRoom();CROOM=null}if(room)openRoom(id)}
  render()}
const PUSH_OPEN=(location.search.match(/[?&]open=([a-z]+)/)||[])[1]||'',PUSH_RID=(location.search.match(/[?&]rid=([\w-]+)/)||[])[1]||'';
function pushAfterBoot(){
  if(PUSH_OPEN){openFromPush(PUSH_OPEN,PUSH_RID);try{history.replaceState(null,'',location.pathname)}catch(e){}}
  pushRegister(false);clearNotis()}
// 앱을 열면 쌓인 알림 정리
function clearNotis(){if(!('serviceWorker' in navigator))return;navigator.serviceWorker.ready.then(r=>r.getNotifications()).then(ns=>ns.forEach(n=>n.close())).catch(()=>{})}
if('serviceWorker' in navigator){navigator.serviceWorker.addEventListener('message',e=>{const d=e.data||{};if(d.type==='open')openFromPush(d.k,d.id)});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&SYNC.booted)clearNotis()})}
// 서비스 워커에 화면이 보이는지 알림 (보이는 중엔 알림 대신 앱 안에서 진동·소리)
function reportVis(){try{const c=navigator.serviceWorker&&navigator.serviceWorker.controller;if(c)c.postMessage({type:'vis',v:document.visibilityState==='visible'})}catch(e){}}
document.addEventListener('visibilitychange',reportVis);addEventListener('pagehide',()=>{try{const c=navigator.serviceWorker&&navigator.serviceWorker.controller;if(c)c.postMessage({type:'vis',v:false})}catch(e){}});
setInterval(()=>{if(document.visibilityState==='visible')reportVis()},15000);setTimeout(reportVis,1000);
