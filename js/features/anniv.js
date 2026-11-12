/* features/anniv — 기념일(생일·생신, 제사·기일, 기념일, 매년 반복 일정) 알림
   홈: 7일 안에 있는 기념일을 띠로 보여 줌
   대화방: 7일 전·당일에 가족 대화방에 안내 한 줄을 자동으로 남김.
   메시지 id를 날짜·일정으로 고정해서, 여러 폰이 동시에 열어도 한 건만 남음 */
const isAnniv=e=>e.type==='bday'||e.type==='jesa'||e.type==='anniv'||(e.repeat&&e.repeat!=='none');
function annSoon(){return upcoming(7).filter(e=>isAnniv(e)&&(e.scope||'all')==='all')}
function annKind(e){return e.type==='bday'?'생일':e.type==='jesa'?'제사':'기념일'}
function annBannerHtml(){const l=annSoon().slice(0,3);if(!l.length)return '';
  return `<div class="annb">${l.map(e=>`<button class="annl ${e._n===0?'today':''}" data-go="cal"><i>${annKind(e)}</i><span>${esc(e.title)}</span><b class="num">${e._n===0?'오늘':dday(e._n)}</b></button>`).join('')}</div>`}
function annCheck(){if(LOCAL||!SYNC.live||!ME||!S.chat)return;let add=false;
  annSoon().filter(e=>e._n===0||e._n===7).forEach(e=>{const id=`ann-${ymd(e._d)}-${e.id}-${e._n}`;if(S.chat.some(m=>m.id===id))return;
    const d=e._d,when=`${d.getMonth()+1}월 ${d.getDate()}일`;
    S.chat.push({id,by:ME,ts:Date.now(),sys:true,text:e._n===0?`오늘은 ${e.title}입니다`:`일주일 뒤 ${when}은 ${e.title}입니다`});add=true});
  if(add)save()}
// 앱을 연 동안 날짜가 바뀌어도 다시 확인
setInterval(()=>{if(SYNC.booted)annCheck()},30*60e3);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&SYNC.booted)annCheck()});
