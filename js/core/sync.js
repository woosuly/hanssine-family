/* core/sync — Firestore 실시간 동기화 (익명 로그인 + 가족 초대 코드)
   families/hanssine/state/{키}        : 일반 데이터 (JSON 문자열)
   families/hanssine/state/order_{키}  : 목록 순서
   families/hanssine/items/{키}~{id}   : 목록 데이터 한 건씩 (구성원·사진·일정·공지·정산·대화)
   families/hanssine/devices/{uid}     : 등록된 폰
   families/hanssine/private/invite    : 초대 코드 (관리자만 읽기) */
const FAM='hanssine',COLL_KEYS=['members','photos','events','notices','settles','chat'],LOCAL_KEYS=['trPacks'],QUIET_KEYS=['seen','prefs'];
const SYNC={cache:{},obj:{},objJ:{},order:{},queued:false,live:false,booted:false,pend:false,gotS:false,gotI:false,uid:null,dev:null,unsub:[]};
let DB=null;
const famRef=()=>DB.collection('families').doc(FAM);

function syncSave(){if(!SYNC.live||SYNC.queued)return;SYNC.queued=true;queueMicrotask(()=>{SYNC.queued=false;flush()})}
function flush(){
  const ops=[],base=famRef();let big=false;
  for(const k of Object.keys(S)){if(LOCAL_KEYS.includes(k))continue;const v=S[k];
    if(COLL_KEYS.includes(k)){
      let arr=Array.isArray(v)?v.filter(x=>x&&x.id):[];const js={};
      arr=arr.filter(x=>{const j=JSON.stringify(x);if(j.length>9e5){big=true;return false}js[x.id]=j;return true});
      if(arr.length!==(Array.isArray(v)?v.length:0))S[k]=arr;
      const ids=arr.map(x=>x.id),oj=JSON.stringify(ids);
      if(SYNC.cache['order_'+k]!==oj){SYNC.cache['order_'+k]=oj;SYNC.order[k]=ids;ops.push(['set',base.collection('state').doc('order_'+k),{ids}])}
      const keep=new Set();
      arr.forEach(x=>{const ck=k+'~'+x.id,j=js[x.id];keep.add(ck);SYNC.obj[ck]=x;SYNC.objJ[ck]=j;if(SYNC.cache[ck]===j)return;
        SYNC.cache[ck]=j;ops.push(['set',base.collection('items').doc(ck),{k,j}])});
      Object.keys(SYNC.obj).forEach(ck=>{if(ck.startsWith(k+'~')&&!keep.has(ck)){delete SYNC.obj[ck];delete SYNC.objJ[ck];delete SYNC.cache[ck];ops.push(['del',base.collection('items').doc(ck)])}});
    }else{const j=JSON.stringify(v??null);if(SYNC.cache[k]===j)continue;SYNC.cache[k]=j;
      const d={j};if(k==='master')d.member=(v||{}).member||'';ops.push(['set',base.collection('state').doc(k),d])}}
  if(big)toast('파일이 커서 저장하지 못했어요');
  for(let i=0;i<ops.length;i+=400){const b=DB.batch();ops.slice(i,i+400).forEach(([t,r,d])=>t==='set'?b.set(r,d):b.delete(r));
    b.commit().catch(e=>{console.warn('sync',e);toast('저장하지 못했어요. 인터넷 연결을 확인해 주세요')})}
}
function rebuild(){COLL_KEYS.forEach(k=>{const pre=k+'~',have=new Set(Object.keys(SYNC.obj).filter(c=>c.startsWith(pre))),out=[];
  (SYNC.order[k]||[]).forEach(i=>{const ck=pre+i;if(have.has(ck)){out.push(SYNC.obj[ck]);have.delete(ck)}});
  have.forEach(ck=>out.push(SYNC.obj[ck]));S[k]=out})}
function applyState(qs){const keys=[];
  qs.docChanges().forEach(ch=>{const id=ch.doc.id;if(ch.type==='removed')return;const d=ch.doc.data(),remote=!ch.doc.metadata.hasPendingWrites;
    if(id.startsWith('read_')){readGot(id.slice(5),d);return}
    if(id.startsWith('typing_')){if(remote)typingGot(id.slice(7),d);return}
    if(id.startsWith('order_')){const oj=JSON.stringify(d.ids||[]);if(SYNC.cache[id]===oj)return;SYNC.cache[id]=oj;SYNC.order[id.slice(6)]=d.ids||[];if(remote)keys.push(id.slice(6))}
    else if(!LOCAL_KEYS.includes(id)&&SYNC.cache[id]!==d.j){SYNC.cache[id]=d.j;try{S[id]=JSON.parse(d.j)}catch(e){}if(remote)keys.push(id)}});
  SYNC.gotS=true;rebuild();changed(keys)}
function applyItems(qs){const keys=[];
  qs.docChanges().forEach(ch=>{const id=ch.doc.id,k=id.split('~')[0],remote=!ch.doc.metadata.hasPendingWrites;
    if(ch.type==='removed'){if(SYNC.obj[id]){delete SYNC.obj[id];delete SYNC.objJ[id];delete SYNC.cache[id];if(remote)keys.push(k)}return}
    const d=ch.doc.data();SYNC.cache[id]=d.j;if(SYNC.objJ[id]!==d.j){try{SYNC.obj[id]=JSON.parse(d.j);SYNC.objJ[id]=d.j}catch(e){}if(remote)keys.push(k)
      if(remote&&ch.type==='added'&&k==='chat'&&SYNC.booted){const o=SYNC.obj[id];if(o&&o.by!==ME&&!String(o.by).startsWith('ai:'))inAppAlert(o,null)}}});
  SYNC.gotI=true;rebuild();changed(keys)}

// 다른 가족이 바꾼 내용 반영: 입력 중이거나 창이 열려 있으면 미뤘다가 반영
const busy=()=>{const a=document.activeElement;return !!$('#layer').innerHTML||!!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))};
function changed(keys){if(!SYNC.booted||!keys.length)return;if(keys.includes('chat'))updateBadge();if(keys.every(k=>QUIET_KEYS.includes(k)))return;
  clearTimeout(SYNC.rt);SYNC.rt=setTimeout(()=>{if(keys.includes('chat')&&$('#clog'))refreshChat();if(busy()){SYNC.pend=true;return}rerender()},120)}
function rerender(){SYNC.pend=false;if(!ME||!mem(ME)){render();return}const y=(document.scrollingElement||document.body).scrollTop,
  sc=[...document.querySelectorAll('#app *')].filter(e=>e.scrollTop>0).map(e=>[e.id||e.className,e.scrollTop]);
  render();(document.scrollingElement||document.body).scrollTop=y;
  sc.forEach(([k,t])=>{const e=document.getElementById(k)||document.getElementsByClassName(k)[0];if(e)e.scrollTop=t})}
function syncAfterClose(){if(SYNC.pend)setTimeout(()=>{if(SYNC.pend&&!busy())rerender()},60)}
document.addEventListener('focusout',()=>{if(SYNC.pend)setTimeout(()=>{if(SYNC.pend&&!busy())rerender()},800)});

function stopSync(){SYNC.unsub.forEach(f=>{try{f()}catch(e){}});SYNC.unsub=[];SYNC.live=false;SYNC.gotS=SYNC.gotI=false}
function lostAccess(e){console.warn('listen',e);if(e&&e.code==='permission-denied'){stopSync();SYNC.dev=null;SYNC.booted=false;ME=null;close();renderWho();toast('이 폰의 가족 앱 등록이 해제되었어요')}}
function startListen(){stopSync();return new Promise(res=>{const done=()=>{if(SYNC.gotS&&SYNC.gotI&&!SYNC.live){SYNC.live=true;res()}};
  SYNC.unsub.push(famRef().collection('state').onSnapshot(qs=>{applyState(qs);done()},lostAccess));
  SYNC.unsub.push(famRef().collection('items').onSnapshot(qs=>{applyItems(qs);done()},lostAccess))})}
// 초기 버전이 넣어 둔 회비 기본값(월 5만 원·총무 큰딸네)이 손대지 않은 채 남아 있으면 '미정'으로 되돌림
function fixOldDues(){const d=S.dues;if(!d)return;const untouched=!(d.tx||[]).length&&!(d.accounts||[]).length&&!Object.values(d.paid||{}).some(m=>Object.values(m||{}).some(Boolean));
  if(untouched&&d.mode==='monthly'&&d.monthly===50000&&d.treasurer==='h1'){S.dues={mode:'',monthly:0,perHouse:{},treasurer:'',paid:{},accounts:[],tx:[]};save()}}
function finishBoot(){if(!SYNC.cache.master){const keep=S.trPacks;S=cleanSeed();S.trPacks=keep||{};S.master.member=ME;flush()}else fixOldDues();
  SYNC.booted=true;roomsListen();gamesListen();render();pushAfterBoot();setTimeout(annCheck,4000);setTimeout(stepsAfterBoot,2500)}

async function boot(){
  if(LOCAL){render();return}
  $('#app').innerHTML='<div class="wrap muted" style="padding-top:35vh;text-align:center">불러오는 중…</div>';
  try{firebase.initializeApp(FIREBASE_CONFIG);DB=firebase.firestore();
    try{await DB.enablePersistence({synchronizeTabs:true})}catch(e){}
    const c=await firebase.auth().signInAnonymously();SYNC.uid=c.user.uid}
  catch(e){console.warn(e);$('#app').innerHTML='<div class="wrap" style="padding-top:30vh;text-align:center"><p>연결하지 못했어요.<br>인터넷 연결을 확인한 뒤 다시 열어 주세요.</p><button class="btn" onclick="location.reload()">다시 시도</button></div>';return}
  // 등록 정보 확인. 연결이 불안정해 확인에 실패하면 이 폰에 기억해 둔 등록 정보로 진행
  const DK='hanssine-dev-'+SYNC.uid;let failed=false;
  try{const d=await famRef().collection('devices').doc(SYNC.uid).get();if(d.exists)SYNC.dev=d.data()}catch(e){failed=true;console.warn('device',e)}
  if(!SYNC.dev&&failed){try{SYNC.dev=JSON.parse(localStorage.getItem(DK))}catch(e){}}
  if(!SYNC.dev){renderWho();return}
  try{localStorage.setItem(DK,JSON.stringify({member:SYNC.dev.member}))}catch(e){}
  ME=SYNC.dev.member;await startListen();finishBoot()}

// 가입: 초대 코드 확인 → 이 폰 등록. 초대 코드가 아직 없으면(첫 설치) 입력한 코드가 가족 초대 코드가 됨
async function joinAs(mid,phone,code){
  const base=famRef(),dref=base.collection('devices').doc(SYNC.uid),iref=base.collection('private').doc('invite');
  if(SYNC.dev){await dref.update({member:mid,phone});SYNC.dev={...SYNC.dev,member:mid,phone}}
  else{const dev={member:mid,phone,code,ts:Date.now(),ua:navigator.userAgent.slice(0,120)};
    try{await dref.set(dev)}catch(e){const b=DB.batch();b.set(iref,{code});b.set(dref,dev);await b.commit()}
    SYNC.dev=dev}
  try{localStorage.setItem('hanssine-dev-'+SYNC.uid,JSON.stringify({member:mid}))}catch(e){}
  ME=mid;if(!SYNC.live)await startListen();
  if(!SYNC.cache.master){finishBoot()}else{SYNC.booted=true}
  const m=mem(mid);if(m&&m.phone!==phone){m.phone=phone;save()}
  roomsListen();render();pushRegister(false)}

// 관리자: 초대 코드 · 등록된 폰
async function loadDevices(){const box=$('#dvin');if(!box)return;
  try{const [iv,ds]=await Promise.all([famRef().collection('private').doc('invite').get(),famRef().collection('devices').get()]);
    const code=(iv.data()||{}).code||'';
    box.innerHTML=`<div class="row" style="flex-wrap:nowrap"><div class="field" style="flex:1"><label for="icode">가족 초대 코드</label><input id="icode" value="${esc(code)}" maxlength="20" autocomplete="off"></div><button class="btn" id="icsv" style="align-self:flex-end">변경</button></div>
      <div class="small muted">새 폰을 등록할 때 입력하는 코드입니다. 가족에게만 알려 주세요.</div>
      <div class="small muted" style="margin-top:6px">등록된 폰 ${ds.size}대</div>
      ${ds.docs.map(d=>{const x=d.data(),m=mem(x.member);return `<div class="hh"><span style="flex:1;min-width:0"><b>${esc(m?byLabel(m):x.member)}</b>${d.id===SYNC.uid?' <span class="small muted">(이 폰)</span>':''}<br><span class="small muted">${esc(x.phone||'')}${x.ts?' · '+new Date(x.ts).toLocaleDateString('ko-KR')+' 등록':''}</span></span>${d.id===SYNC.uid?'':`<button class="chip" data-kick="${d.id}">등록 해제</button>`}</div>`}).join('')}`;
    $('#icsv').onclick=async()=>{const v=$('#icode').value.trim();if(v.length<4){toast('4자 이상으로 정해 주세요');return}
      try{await famRef().collection('private').doc('invite').set({code:v});toast('초대 코드를 바꿨어요')}catch(e){toast('바꾸지 못했어요')}};
    box.querySelectorAll('[data-kick]').forEach(b=>b.onclick=async()=>{if(!b.dataset.sure){b.dataset.sure=1;b.textContent='해제 확인';return}
      try{await famRef().collection('devices').doc(b.dataset.kick).delete();toast('등록을 해제했어요');loadDevices()}catch(e){toast('해제하지 못했어요')}});
  }catch(e){console.warn(e);box.innerHTML='<div class="small muted">불러오지 못했어요</div>'}}
