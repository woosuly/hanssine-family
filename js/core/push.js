/* core/push — 웹 푸시 알림: 이 폰 알림 켜기, 알림 받을 주소(토큰) 저장, 알림 눌러 해당 화면 열기 */
const NATIVE_PUSH=()=>!LOCAL&&!!NPLUG('PushNotifications');let NSTATE='checking'; // 앱이 켜질 때 권한을 확인하기 전까지는 '알림 켜기' 안내를 띄우지 않음
const PUSH_OK=()=>NATIVE_PUSH()||!LOCAL&&!!VAPID_KEY&&'Notification' in window&&'serviceWorker' in navigator&&'PushManager' in window&&typeof firebase!=='undefined'&&!!firebase.messaging;
const pushState=()=>NATIVE_PUSH()?NSTATE:!PUSH_OK()?'unsupported':Notification.permission; // granted · denied · default · unsupported
const isIOS=()=>/iPhone|iPad|iPod/.test(navigator.userAgent);
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
// ask=true 일 때만 허용 창을 띄움 (버튼을 눌렀을 때)
// 알림 받을 주소(토큰) 저장. native=true면 안드로이드 앱
async function saveTok(tok,native){if(tok&&SYNC.dev&&SYNC.dev.fcm!==tok){await famRef().collection('devices').doc(SYNC.uid).update({fcm:tok,fcmAt:Date.now(),native:!!native});SYNC.dev.fcm=tok}}
// 안드로이드 앱 알림 등록
async function nativePushRegister(ask){const P=NPLUG('PushNotifications');
  try{let st=(await P.checkPermissions()).receive;
    if(st!=='granted'){if(!ask){NSTATE=st==='denied'?'denied':'default';return NSTATE}st=(await P.requestPermissions()).receive}
    NSTATE=st==='granted'?'granted':st==='denied'?'denied':'default';if(NSTATE!=='granted')return NSTATE;
    if(!nativePushRegister.bound){nativePushRegister.bound=1;P.addListener('registration',t=>saveTok(t.value,true).catch(()=>{}));P.addListener('registrationError',e=>console.warn('push reg',e))}
    await P.register();return 'granted'}catch(e){console.warn('native push',e);return 'error'}}
async function pushRegister(ask){
  if(NATIVE_PUSH())return SYNC.uid&&SYNC.dev?nativePushRegister(ask):'unsupported';
  if(!PUSH_OK()||!SYNC.uid||!SYNC.dev)return 'unsupported';
  if(Notification.permission==='default'){if(!ask)return 'default';const p=await Notification.requestPermission();if(p!=='granted')return p}
  if(Notification.permission!=='granted')return Notification.permission;
  try{const reg=await navigator.serviceWorker.ready;
    const tok=await firebase.messaging().getToken({vapidKey:VAPID_KEY,serviceWorkerRegistration:reg});
    await saveTok(tok,false);
    return 'granted'}catch(e){console.warn('push',e);return 'error'}}
async function pushTest(){if(NPLUG('HanssineNative')){NPLUG('HanssineNative').testNotify().catch(()=>toast('시험 알림을 띄우지 못했어요'));return}try{const reg=await navigator.serviceWorker.ready;
  await reg.showNotification('한씨네',{body:'알림 시험입니다. 화면 위에 이렇게 뜨면 정상이에요.',tag:'test',icon:'icons/icon-192.png',badge:'icons/badge-96.png',data:{k:''}})}catch(e){toast('시험 알림을 띄우지 못했어요')}}
// 설정 화면의 알림 줄
function pushRowHtml(){const s=pushState();
  if(s==='unsupported')return `<div class="small muted">${isIOS()&&!isStandalone()?'아이폰은 사파리에서 공유 → 홈 화면에 추가한 뒤 그 앱에서 알림을 켤 수 있어요.':LOCAL||!VAPID_KEY?'알림 기능 준비 중입니다.':'이 브라우저는 알림을 지원하지 않아요.'}</div>`;
  if(s==='denied')return `<div class="small" style="color:var(--red)">알림이 차단되어 있어요. 휴대폰 설정 → 애플리케이션에서 이 앱(또는 브라우저)의 알림을 허용해 주세요.</div>`;
  if(s==='checking')return `<button class="btn ghost block" id="pushon">이 폰 알림 확인·켜기</button>`;
  if(s==='default')return `<button class="btn block" id="pushon">이 폰 알림 켜기</button>`;
  return `<div class="row between"><span>이 폰 알림 <b>켜짐</b></span><button class="chip" id="pushtest">시험 알림</button></div>
    <div class="small muted">시험 알림이 화면 위에 뜨지 않으면 휴대폰 설정 → 알림에서 이 앱의 '팝업으로 표시'를 켜 주세요.</div>
    ${NATIVE_PUSH()?`<div class="row" style="gap:6px;flex-wrap:wrap"><button class="chip" id="nbat">배터리 절전 예외</button><button class="chip" id="nset">알림 설정 열기</button></div>`:''}`}
function bindPushRow(after){
  if($('#pushon'))$('#pushon').onclick=async()=>{const r=await pushRegister(true);
    toast(r==='granted'?'알림을 켰어요':r==='denied'?'알림이 차단되었어요':'알림을 켜지 못했어요');after&&after()};
  if($('#pushtest'))$('#pushtest').onclick=pushTest;
  if($('#nbat'))$('#nbat').onclick=()=>NPLUG('HanssineNative').requestIgnoreBattery().catch(()=>{});
  if($('#nset'))$('#nset').onclick=()=>NPLUG('HanssineNative').openNotificationSettings({}).catch(()=>{})}
// 알림을 눌러 들어왔을 때 해당 화면으로
function openFromPush(k,id){if(!ME||!mem(ME))return;close();
  const room=k==='room'&&id;
  if(me().role==='parent'){SR_TAB=(k==='chat'||room)?'talk':'home';if(k==='chat')SCHAT='fam';if(room){SCHAT='room:'+id;openRoom(id)}}
  else{TAB={chat:'talk',room:'talk',photos:'album',events:'cal',notices:'home',sos:'home'}[k]||TAB;if(k==='chat'){closeRoom();CROOM=null}if(room)openRoom(id)}
  render();if(k==='game'&&id)gameFromPush(id)}
const PUSH_OPEN=(location.search.match(/[?&]open=([a-z]+)/)||[])[1]||'',PUSH_RID=(location.search.match(/[?&]rid=([\w-]+)/)||[])[1]||'';
function pushAfterBoot(){nativeAfterBoot();
  if(PUSH_OPEN){openFromPush(PUSH_OPEN,PUSH_RID);try{history.replaceState(null,'',location.pathname)}catch(e){}}
  pushRegister(false).then(r=>{if(r==='default'&&NATIVE_PUSH()&&TAB==='home'&&$('#wx')&&!busy())renderMain()});clearNotis()}
// 앱을 열면 쌓인 알림 정리
function clearNotis(){if(!('serviceWorker' in navigator))return;navigator.serviceWorker.ready.then(r=>r.getNotifications()).then(ns=>ns.forEach(n=>n.close())).catch(()=>{})}
if('serviceWorker' in navigator){navigator.serviceWorker.addEventListener('message',e=>{const d=e.data||{};if(d.type==='open')openFromPush(d.k,d.id)});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&SYNC.booted)clearNotis()})}
// 서비스 워커에 화면이 보이는지 알림 (보이는 중엔 알림 대신 앱 안에서 진동·소리)
function reportVis(){try{const c=navigator.serviceWorker&&navigator.serviceWorker.controller;if(c)c.postMessage({type:'vis',v:document.visibilityState==='visible'})}catch(e){}}
document.addEventListener('visibilitychange',reportVis);addEventListener('pagehide',()=>{try{const c=navigator.serviceWorker&&navigator.serviceWorker.controller;if(c)c.postMessage({type:'vis',v:false})}catch(e){}});
setInterval(()=>{if(document.visibilityState==='visible')reportVis()},15000);setTimeout(reportVis,1000);

// 안드로이드 앱: 알림 눌러 열기, 뒤로 가기, 새 버전 안내
const APK_URL='https://github.com/woosuly/hanssine-family/releases/latest/download/hanssine.apk';
let NBOOT=false;
function nativeAfterBoot(){const H=NPLUG('HanssineNative');if(!H||NBOOT)return;NBOOT=true;
  H.takeLaunchPush().then(r=>{if(r&&r.k)openFromPush(r.k,r.id)}).catch(()=>{});
  H.addListener('pushOpen',r=>openFromPush(r.k,r.id));
  const A=NPLUG('App');
  if(A){A.addListener('backButton',()=>{if($('#layer').innerHTML){close();return}
      if(me()&&me().role==='parent'){if(SR_TAB!=='home'){SR_TAB='home';render();return}}else if(TAB!=='home'){TAB='home';render();return}
      A.minimizeApp()});
    checkApkUpdate(A)}}
async function checkApkUpdate(A){try{const last=+localStorage.getItem('hanssine-upd-ask')||0;if(Date.now()-last<864e5)return;
  const [info,rel]=await Promise.all([A.getInfo(),fetch('https://api.github.com/repos/woosuly/hanssine-family/releases/latest').then(r=>r.json())]);
  const latest=+String(rel.tag_name||'').replace(/^v1\./,'')||0,cur=+info.build||0;if(!latest||latest<=cur)return;
  localStorage.setItem('hanssine-upd-ask',Date.now());
  sheet(`<div class="stack"><h2>새 버전이 있어요</h2><p class="muted">알림·음성 같은 휴대폰 기능이 좋아졌어요. 설치 파일을 받아 덮어 설치하면 됩니다. 대화와 사진은 그대로 남아요.</p>
    <a class="btn block" href="${APK_URL}">새 버전 받기</a><button class="btn ghost block" id="updlater">나중에</button></div>`);
  $('#updlater').onclick=close}catch(e){}}
