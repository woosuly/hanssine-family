/* features/unread — 안 읽은 메시지 수(아래 칸·앱 아이콘), 메시지별 안 읽은 사람 수, 앱 쓰는 중 진동·소리
   가족 대화방 읽음: families/hanssine/state/read_{구성원} {fam: 마지막으로 읽은 시각}
   따로 만든 방 읽음: rooms/{방}.reads.{구성원} */
const READS={};let FAMREAD_SENT=0;const ROOMREAD_SENT={};

// 받은 읽음 정보 반영 (sync.js에서 호출)
function readGot(k,d){READS[k]=d||{};updateReadCounts();updateBadge()}
const famLastRead=()=>Math.max(readMap().fam||0,(READS[ME]||{}).fam||0);
const roomLastRead=r=>Math.max(readMap()[r.id]||0,((r.reads||{})[ME])||0);

// 지금 화면이 보고 있는 대화방인지
function viewingChat(room){if(document.visibilityState!=='visible')return false;
  const onTalk=me()&&(me().role==='parent'?(SR_TAB==='talk'&&SCHAT!=='ai'):TAB==='talk');
  return onTalk&&((room||null)===(CROOM||null))}

// 가족 대화방을 보고 있으면 읽음으로 저장
function markFamRead(){if(LOCAL||!SYNC.live||!ME||CROOM||!viewingChat(null))return;const last=(S.chat||[]).at(-1);if(!last)return;
  markRead('fam',last.ts);updateBadge();if(last.ts<=FAMREAD_SENT)return;FAMREAD_SENT=last.ts;
  clearTimeout(markFamRead.t);markFamRead.t=setTimeout(()=>famRef().collection('state').doc('read_'+ME).set({fam:FAMREAD_SENT},{merge:true}).catch(()=>{}),800)}
function markRoomRead(id){if(LOCAL||!SYNC.live||!ME||CROOM!==id||!viewingChat(id))return;const last=RMSG.at(-1);if(!last)return;
  markRead(id,last.ts);updateBadge();if(last.ts<=(ROOMREAD_SENT[id]||0))return;ROOMREAD_SENT[id]=last.ts;
  roomsRef().doc(id).update({['reads.'+ME]:last.ts}).catch(()=>{})}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='visible'||!SYNC.booted)return;if(CROOM)markRoomRead(CROOM);else markFamRead()});

// 안 읽은 수: 가족 대화방은 메시지 수, 따로 만든 방은 방마다 1
function famUnread(){if(!ME)return 0;const lr=famLastRead();return (S.chat||[]).filter(m=>m.ts>lr&&m.by!==ME&&!String(m.by).startsWith('ai:')&&!m.wait).length}
function totalUnread(){return famUnread()+ROOMS.filter(r=>r.last&&r.last.by!==ME&&r.last.ts>roomLastRead(r)&&r.id!==CROOM).length}
function badgeHtml(){if(LOCAL)return '';const n=totalUnread();return `<i class="nbadge" ${n?'':'hidden'}>${n>99?'99+':n}</i>`}
function updateBadge(){if(LOCAL)return;const n=totalUnread();
  document.querySelectorAll('.nbadge').forEach(e=>{e.textContent=n>99?'99+':n;e.hidden=!n});
  try{if(n&&navigator.setAppBadge)navigator.setAppBadge(n);else if(!n&&navigator.clearAppBadge)navigator.clearAppBadge()}catch(e){}}

// 메시지별 안 읽은 사람
function audience(){if(CROOM){const r=ROOMS.find(x=>x.id===CROOM);return r?r.members:[]}return S.members.map(x=>x.id)}
function readTimes(){if(CROOM){const r=ROOMS.find(x=>x.id===CROOM)||{};return r.reads||{}}const o={};for(const k in READS)o[k]=(READS[k]||{}).fam||0;return o}
function readersOf(m){const rt=readTimes();return audience().filter(id=>id!==m.by).map(id=>({id,read:id===ME||(rt[id]||0)>=m.ts}))}
function rcHtml(m){if(LOCAL||!m||m.wait||m.del||String(m.by).startsWith('ai:'))return '';const n=readersOf(m).filter(x=>!x.read).length;
  return `<button class="rc" data-rc="${esc(m.id)}" aria-label="안 읽은 사람 ${n}명">${n||''}</button>`}
function updateReadCounts(){document.querySelectorAll('[data-rc]').forEach(b=>{const m=findMsg(b.dataset.rc);if(!m)return;const n=readersOf(m).filter(x=>!x.read).length;b.textContent=n||'';b.setAttribute('aria-label','안 읽은 사람 '+n+'명')})}
function readSheet(id){const m=findMsg(id);if(!m)return;const rs=readersOf(m),no=rs.filter(x=>!x.read),yes=rs.filter(x=>x.read);
  const names=l=>l.map(x=>`<span class="chip">${esc((mem(x.id)||{}).name||x.id)}</span>`).join('')||'<span class="small muted">없음</span>';
  sheet(`<div class="stack"><h2>읽음 확인</h2><div class="card small muted">${esc(msgSnip(m))}</div>
    <div><b>안 읽음 ${no.length}명</b><div class="row" style="flex-wrap:wrap;gap:6px;margin-top:6px">${names(no)}</div></div>
    <div><b>읽음 ${yes.length}명</b><div class="row" style="flex-wrap:wrap;gap:6px;margin-top:6px">${names(yes)}</div></div>
    <div class="small muted">앱을 아직 설치하지 않은 가족은 안 읽음으로 보여요.</div></div>`)}

// 앱을 쓰는 중에 다른 대화가 오면 진동·소리·알림 띠
let ACX=null;
document.addEventListener('pointerdown',()=>{try{if(!ACX)ACX=new (window.AudioContext||window.webkitAudioContext)();if(ACX.state==='suspended')ACX.resume()}catch(e){}},{passive:true});
function beep(){try{if(!ACX)return;const t=ACX.currentTime;[880,1320].forEach((f,i)=>{const o=ACX.createOscillator(),g=ACX.createGain(),s=t+i*.13;
  o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,s);g.gain.exponentialRampToValueAtTime(.18,s+.02);g.gain.exponentialRampToValueAtTime(.0001,s+.2);
  o.connect(g).connect(ACX.destination);o.start(s);o.stop(s+.22)})}catch(e){}}
function inAppAlert(m,room){if(!ME||document.visibilityState!=='visible'||viewingChat(room||null))return;if(pref('noti_chat',true)===false)return;
  if(pref('noti_inapp_vib',true))try{navigator.vibrate&&navigator.vibrate([120,60,120])}catch(e){}
  if(pref('noti_inapp_snd',true))beep();
  const who=whoOf(m.by).name,where=room?roomTitle(room)+' · ':'';toast(`${where}${who}: ${msgSnip(m)}`)}
