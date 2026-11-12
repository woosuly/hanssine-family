/* features/rooms — 따로 만드는 대화방: 고른 사람만 보고 쓰는 방
   families/hanssine/rooms/{방}        : 방 이름, 멤버, 만든 사람, 마지막 메시지
   families/hanssine/rooms/{방}/msgs/{메시지} : 메시지 (서버 규칙으로 멤버만 읽고 씀) */
let RLOADED=false,ROOMS=[],CROOM=null,RMSG=[],RUNSUB=null,RLIVE=null;
const roomsRef=()=>famRef().collection('rooms');
const roomOn=()=>!LOCAL&&SYNC.live&&!!ME;
const roomTitle=id=>(ROOMS.find(r=>r.id===id)||{}).title||'대화방';
const roomMembers=r=>(r.members||[]).map(id=>(mem(id)||{}).name).filter(Boolean).join(' · ');
// 읽음 표시는 이 폰에만 기억
function readMap(){try{return JSON.parse(localStorage.getItem('hanssine-read-'+ME))||{}}catch(e){return {}}}
function markRead(id,ts){const m=readMap();m[id]=Math.max(m[id]||0,ts||Date.now());try{localStorage.setItem('hanssine-read-'+ME,JSON.stringify(m))}catch(e){}}
const unread=r=>!!(r.last&&r.last.by!==ME&&r.last.ts>roomLastRead(r));
const PREVLAST={};

// 내가 들어 있는 방 목록 듣기 (앱 시작·사용자 변경 때)
function roomsListen(){if(RLIVE){RLIVE();RLIVE=null}ROOMS=[];RLOADED=false;if(!roomOn())return;const me0=ME;
  RLIVE=roomsRef().where('members','array-contains',ME).onSnapshot(qs=>{if(ME!==me0)return;
    RLOADED=true;ROOMS=qs.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>((b.last||{}).ts||b.ts||0)-((a.last||{}).ts||a.ts||0));roomsChanged()},e=>console.warn('rooms',e))}
function roomsChanged(){
  ROOMS.forEach(r=>{const t=(r.last||{}).ts||0;if(r.id in PREVLAST&&t>PREVLAST[r.id]&&r.last.by!==ME)inAppAlert({by:r.last.by,text:r.last.t},r.id);PREVLAST[r.id]=t});
  updateReadCounts();updateBadge();
  if(RLOADED&&CROOM&&!ROOMS.some(r=>r.id===CROOM)){CROOM=null;closeRoom();if(SR_TAB==='talk'&&SCHAT.startsWith('room:'))SCHAT='fam'}
  if($('#roombar')){$('#roombar').outerHTML=roomBarHtml();bindRoomBar()}
  else if($('#tseg')&&!busy())renderSenior()}
function openRoom(id){closeRoom();CROOM=id;RMSG=[];if(!roomOn())return;
  RUNSUB=roomsRef().doc(id).collection('msgs').orderBy('ts').limitToLast(200).onSnapshot(qs=>{
    if(CROOM!==id)return;RMSG=qs.docs.map(d=>{try{return JSON.parse(d.data().j)}catch(e){return null}}).filter(Boolean);
    if($('#clog'))refreshChat();else{markRoomRead(id);if($('#tlog')&&!busy())renderSenior()}},e=>console.warn('room msgs',e))}
function closeRoom(){if(RUNSUB){RUNSUB();RUNSUB=null}RMSG=[]}
function setRoom(id){CREPLY=null;DRAFT='';if(id)openRoom(id);else{closeRoom();CROOM=null}renderMain()}

// 방에 보내기: 화면에 먼저 보여 주고 저장
function roomPost(o){const m={id:uid(),by:ME,ts:Date.now(),...o};if(CREPLY){m.reply=CREPLY;CREPLY=null;showReplyBar()}
  const j=JSON.stringify(m);if(j.length>9e5){toast('파일이 커서 보낼 수 없어요. 사진 저장소 연결 후 가능해요');return m}
  RMSG.push(m);const r=roomsRef().doc(CROOM);
  r.collection('msgs').doc(m.id).set({j,ts:m.ts,by:ME}).catch(e=>{console.warn(e);toast('보내지 못했어요. 인터넷 연결을 확인해 주세요')});
  r.update({last:{t:msgSnip(m),by:ME,ts:m.ts}}).catch(()=>{});markRead(CROOM,m.ts);return m}

// 대화 화면 위 방 고르기 줄
function roomBarHtml(){if(!roomOn())return '<div id="roombar" hidden></div>';
  return `<div class="roombar" id="roombar"><button class="rchip ${CROOM?'':'on'}" data-room="">가족 대화방</button>${ROOMS.map(r=>`<button class="rchip ${CROOM===r.id?'on':''}" data-room="${esc(r.id)}">${esc(r.title)}${unread(r)&&CROOM!==r.id?'<i class="rdot" aria-label="새 메시지"></i>':''}</button>`).join('')}<button class="rchip rnew" id="rnew">+ 새 방</button></div>`}
function bindRoomBar(){document.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>setRoom(b.dataset.room||null));if($('#rnew'))$('#rnew').onclick=()=>roomForm(null)}

// 방 만들기·설정
function roomForm(r){const isNew=!r,mine=r&&(r.by===ME||isAdmin());const sel=new Set(r?r.members:[ME]);
  const others=S.members.filter(m=>m.id!==ME);
  sheet(`<div class="stack"><h2>${isNew?'새 대화방':'방 설정'}</h2>
    <div class="field"><label for="rtitle">방 이름</label><input id="rtitle" maxlength="30" value="${esc(r?r.title:'')}" placeholder="예: 엄마 생신 준비" ${r&&!mine?'disabled':''}></div>
    <div class="field"><label>함께할 사람 <span class="small muted">(나는 자동 포함)</span></label><div class="row" style="flex-wrap:wrap;gap:6px">
      ${others.map(m=>`<label class="chip"><input type="checkbox" value="${m.id}" ${sel.has(m.id)?'checked':''} ${r&&!mine?'disabled':''}> ${esc(m.name)}</label>`).join('')}</div></div>
    <div class="small muted">고른 사람만 이 방을 보고 쓸 수 있어요. 다른 가족 폰에는 방 이름도 보이지 않습니다.</div>
    ${isNew||mine?`<button class="btn block" id="rsave">${isNew?'만들기':'저장'}</button>`:''}
    ${r?`<button class="btn ghost block" id="rleave">방 나가기</button>`:''}
    ${r&&mine?`<button class="btn ghost block" id="rdel" style="color:var(--red)">방 없애기</button>`:''}</div>`);
  if($('#rsave'))$('#rsave').onclick=async()=>{const ms=[ME,...[...document.querySelectorAll('.sheet input[type=checkbox]:checked')].map(x=>x.value)];
    if(ms.length<2){toast('함께할 사람을 한 명 이상 골라 주세요');return}
    const title=$('#rtitle').value.trim()||ms.filter(x=>x!==ME).map(x=>(mem(x)||{}).name).join(', ');
    try{if(isNew){const nr={title,members:ms,by:ME,ts:Date.now(),last:null};const d=await roomsRef().add(nr);if(!ROOMS.some(x=>x.id===d.id))ROOMS.unshift({id:d.id,...nr});close();setRoom(d.id);toast('대화방을 만들었어요')}
      else{await roomsRef().doc(r.id).update({title,members:ms});close();renderMain();toast('저장했어요')}}catch(e){console.warn(e);toast('저장하지 못했어요')}};
  if($('#rleave'))$('#rleave').onclick=async()=>{if(!$('#rleave').dataset.sure){$('#rleave').dataset.sure=1;$('#rleave').textContent='나가기 확인';return}
    try{await roomsRef().doc(r.id).update({members:r.members.filter(x=>x!==ME)});close();setRoom(null);toast('방에서 나왔어요')}catch(e){toast('나가지 못했어요')}};
  if($('#rdel'))$('#rdel').onclick=async()=>{if(!$('#rdel').dataset.sure){$('#rdel').dataset.sure=1;$('#rdel').textContent='모든 대화가 지워집니다. 없애기 확인';return}
    try{await roomsRef().doc(r.id).delete();close();setRoom(null);toast('방을 없앴어요')}catch(e){toast('없애지 못했어요')}};
}

// 부모님 화면: '다른 대화방' 목록
function srRoomList(){sheet(`<div class="stack"><h2>대화방 고르기</h2>
  <div class="glist2">${ROOMS.map(r=>`<button data-sroom="${esc(r.id)}" class="${SCHAT==='room:'+r.id?'on':''}">${esc(r.title)}${unread(r)?' <span class="small" style="color:var(--red)">새 글</span>':''}<br><span class="small muted">${esc(roomMembers(r))}</span></button>`).join('')}</div></div>`,true);
  document.querySelectorAll('[data-sroom]').forEach(b=>b.onclick=()=>{close();SCHAT='room:'+b.dataset.sroom;openRoom(b.dataset.sroom);renderSenior()})}
