
/* features/calendar */
const TYPES={family:['가족 모임','#2E6A4E'],trip:['여행','#2D7FA8'],hospital:['병원','#BF3F2B'],jesa:['제사·기일','#6B5B4B'],school:['손주 학교','#3D5F8C'],anniv:['기념일','#B9771F'],custom:['직접 입력','#7A6A55'],etc:['기타','#7A6A55'],bday:['생일','#B9771F']};
// 등록 화면에 보이는 종류 (손주 학교는 뺌. 예전에 등록된 일정 표시용으로 TYPES에는 남겨 둠)
const EVKINDS=['family','trip','hospital','jesa','anniv','custom'];
const REMINDS=[['day','당일 아침'],['d1','하루 전'],['d7','일주일 전']];
function evOn(e,d){const k=ymd(d);
  if(e.end)return k>=e.date&&k<=e.end;
  if(!e.repeat||e.repeat==='none')return e.date===k;
  if(k<e.date)return false;
  if(e.repeat==='solar'){const s=parse(e.date);return s.getMonth()===d.getMonth()&&s.getDate()===d.getDate()}
  for(const y of [d.getFullYear()-1,d.getFullYear()])if(ymd(L2S(y,e.lm,e.ld))===k)return true;return false}
function itemsOn(d){
  const k=ymd(d),out=[];
  S.events.filter(e=>canSee(e)&&evOn(e,d)).forEach(e=>out.push({...e}));
  S.members.forEach(m=>{for(const y of [d.getFullYear()-1,d.getFullYear()]){const b=bdIn(m,y);if(b&&ymd(b)===k)out.push({id:'b'+m.id,date:k,title:m.name+(m.role==='parent'?' 생신':' 생일')+(m.bd.cal==='lunar'?' (음력)':''),type:'bday',scope:'all'})}});
  return out;
}
function upcoming(days){const t=today0(),out=[],seen=new Set();for(let i=0;i<=days;i++){const d=addDays(t,i);itemsOn(d).forEach(e=>{const key=e.id+(e.repeat&&e.repeat!=='none'?ymd(d):'');if(seen.has(key))return;seen.add(key);out.push({...e,_d:d,_n:i})})}return out}
function evMeta(e){const p=[TYPES[e.type][0]];
  if(e.end)p.push(`${shortD(parse(e.date))} ~ ${shortD(parse(e.end))}`);
  if(e.time)p.push(e.time);if(e.place)p.push(e.place);
  if(e.repeat==='solar')p.push('매년 양력');if(e.repeat==='lunar')p.push(`매년 음력 ${e.lm}.${e.ld}`);
  if(e.escort)p.push('동행 '+HOUSES[e.escort]);if(e.scope&&e.scope!=='all')p.push(SCOPES[e.scope]);return p.join(' · ')}
function calView(){
  const sub=`<div class="seg" id="csub" style="margin-top:6px">${[['cal','달력'],['list','목록'],['poll','투표']].map(([k,n])=>`<button data-v="${k}" class="${CSUB===k?'on':''}">${n}</button>`).join('')}</div>`;
  if(CSUB==='list'){const up=upcoming(120);
    return sub+`<div class="card" style="margin-top:10px">${up.length?up.map(e=>evRow(e,true)).join(''):'<span class="muted">일정이 없습니다</span>'}</div>
      <button class="btn block" style="margin-top:10px" id="addev">일정 추가</button>`}
  if(CSUB==='poll'){const p=S.poll;const tot=p?p.opts.reduce((a,o)=>a+o.v.length,0):0;
    return sub+(p?`<div class="card stack" style="margin-top:10px"><b>${esc(p.q)}</b>
      ${p.opts.map((o,i)=>`<button data-v="${i}" data-vote="1" style="border:0;background:none;padding:0;text-align:left" class="stack">
        <span class="row between"><span>${esc(o.t)} ${o.v.includes(ME)?'<span class="tag">내 선택</span>':''}</span><span class="small muted num">${o.v.length}명</span></span>
        <span class="bar"><i style="width:${tot?o.v.length/tot*100:0}%"></i></span>
        <span class="small muted">${o.v.map(x=>esc(mem(x).name)).join(', ')||'-'}</span></button>`).join('')}</div>`:'<div class="card muted" style="margin-top:10px">진행 중인 투표가 없습니다</div>')+
      (me().role==='child'?`<button class="btn ghost block" style="margin-top:10px" id="newpoll">새 투표 만들기</button>`:'')}
  const y=CAL.getFullYear(),mo=CAL.getMonth();const first=new Date(y,mo,1);const start=addDays(first,-first.getDay());const t=today0();
  let cells='';for(let i=0;i<42;i++){const d=addDays(start,i);if(i>=35&&d.getMonth()!==mo)break;
    const its=itemsOn(d),hol=holidayOf(d),l=S2L(d);const lun=l&&(l.d===1||l.d===15)?`음${l.m}.${l.d}`:'';
    const trip=its.find(e=>e.end);
    cells+=`<button class="d ${d.getMonth()!==mo?'out':''} ${ymd(d)===ymd(t)?'today':''} ${hol||d.getDay()===0?'hol':''}" data-day="${ymd(d)}" aria-label="${md(d)} 일정 보기">
      <span class="n num">${d.getDate()}</span><span class="lun">${hol?`<span style="color:var(--red)">${hol.length>4?hol.slice(0,3):hol}</span>`:lun}</span>
      <span class="dots">${its.filter(e=>!e.end).slice(0,3).map(e=>`<i class="dot" style="background:${evColor(e)}"></i>`).join('')}</span>
      ${trip?`<i class="tripbar" style="background:${evColor(trip)}"></i>`:''}</button>`}
  const monthEv=[];const seen=new Set();for(let d=new Date(y,mo,1);d.getMonth()===mo;d=addDays(d,1))itemsOn(d).forEach(e=>{const key=e.id;if(seen.has(key))return;seen.add(key);monthEv.push({...e,_d:new Date(d)})});
  return sub+`${MOVE?`<div class="mvbar"><span>'${esc(MOVE.e.title)}' 옮길 날짜를 누르세요</span><button class="chip" id="mvx">취소</button></div>`:''}<div class="sec" style="margin-top:10px;gap:6px"><div class="row between"><button class="chip" id="cprev" aria-label="이전 달">‹</button><h2 class="num">${y}년 ${mo+1}월</h2><button class="chip" id="cnext" aria-label="다음 달">›</button></div>
    <div class="cal">${[...DOW].map((w,i)=>`<div class="dow ${i===0?'sun':''}">${w}</div>`).join('')}${cells}</div>
    <div class="small muted">일정이 있는 날을 길게 누르면 다른 날짜로 끌어 옮길 수 있어요</div>
    <div class="card" style="padding:6px 12px">${monthEv.map(e=>`<button class="mrow" data-day="${ymd(e._d)}"><span class="num muted">${shortD(e._d)}</span><i class="dot" style="background:${evColor(e)}"></i><span class="mt">${esc(e.title)}</span></button>`).join('')||'<div class="small muted" style="padding:6px 0">이번 달 일정 없음</div>'}</div></div>`;
}
function evRow(e,withDate){
  return `<button class="ev" data-day="${ymd(e._d||parse(e.date))}" style="width:100%;border:0;border-bottom:1px solid var(--line);background:none;text-align:left">${withDate?`<span class="when num">${shortD(e._d)}<br><b style="color:var(--sun)">${dday(e._n)}</b></span>`:''}
    <span class="body"><span class="row" style="flex-wrap:nowrap"><i class="dot" style="width:8px;height:8px;border-radius:50%;background:${evColor(e)};flex:none"></i><b>${esc(e.title)}</b></span>
    <span class="small muted">${evMeta(e)}</span></span></button>`;
}
function bindCal(){
  segBind('#csub',v=>{CSUB=v;renderMain()});
  if($('#cprev')){$('#cprev').onclick=()=>{CAL=new Date(CAL.getFullYear(),CAL.getMonth()-1,1);renderMain()};$('#cnext').onclick=()=>{CAL=new Date(CAL.getFullYear(),CAL.getMonth()+1,1);renderMain()}}
  document.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{if(SUPPRESS){SUPPRESS=false;return}const k=b.dataset.day;
    if(MOVE){const m=MOVE;MOVE=null;moveEvent(m.e,m.from,k);renderMain();return}dayModal(k)});
  if($('.cal'))calDragInit();if($('#mvx'))$('#mvx').onclick=()=>{MOVE=null;renderMain()};
  document.querySelectorAll('[data-vote]').forEach(b=>b.onclick=()=>{S.poll.opts.forEach(o=>o.v=o.v.filter(x=>x!==ME));S.poll.opts[+b.dataset.v].v.push(ME);save();renderMain()});
  if($('#addev'))$('#addev').onclick=()=>eventForm({date:ymd(today0())});
  if($('#newpoll'))$('#newpoll').onclick=pollForm;
}
function eventForm(p,after,back){
  p=p||{};const isNew=!p.id;const kind=p.type&&EVKINDS.includes(p.type)?p.type:'family';const ownKids=me().role==='child';
  sheet(`<div class="stack"><h2>${isNew?'일정 등록':'일정 수정'}</h2>
    <div class="field"><label for="ety">종류</label><select id="ety">${EVKINDS.map(k=>`<option value="${k}" ${k===kind?'selected':''}>${TYPES[k][0]}</option>`).join('')}</select></div>
    <div class="field"><label for="et">내용</label><input id="et" maxlength="40" value="${esc(p.title||'')}" placeholder="예: 연말 가족 식사"></div>
    <div class="row" style="flex-wrap:nowrap"><div class="field" style="flex:1"><label for="ed" id="edl">날짜</label><input type="date" id="ed" value="${p.date||ymd(today0())}"></div>
      <div class="field" style="flex:1" id="eendw"><label for="eend">마지막 날</label><input type="date" id="eend" value="${p.end||''}"></div></div>
    <div class="row" style="flex-wrap:nowrap"><div class="field" style="flex:1"><label for="etm">시간 (선택)</label><input type="time" id="etm" value="${p.time||''}"></div>
      <div class="field" style="flex:1.4"><label for="epl">장소 (선택)</label><input id="epl" value="${esc(p.place||'')}" placeholder="예: 부모님 댁"></div></div>
    <div class="field" id="escw"><label for="esc">병원 동행 담당</label><select id="esc"><option value="">정하지 않음</option>${['h1','h2','h3'].map(h=>`<option value="${h}" ${p.escort===h?'selected':''}>${HOUSES[h]}</option>`).join('')}</select></div>
    <div class="field" id="repw"><label>매년 반복</label><div class="seg" id="rep">${[['none','안 함'],['solar','양력으로'],['lunar','음력으로']].map(([k,n])=>`<button data-v="${k}" class="${(p.repeat||'none')===k?'on':''}">${n}</button>`).join('')}</div></div>
    <div class="field"><label>미리 알림</label><div class="row">${REMINDS.map(([k,n])=>`<label class="chip"><input type="checkbox" data-rm="${k}" ${(p.remind||['d1']).includes(k)?'checked':''}> ${n}</label>`).join('')}</div></div>
    <label class="row" id="rsw"><input type="checkbox" id="ersvp" ${p.rsvp||isNew?'checked':''}> 가구별 참석 여부 받기</label>
    <div class="field"><label>표시 색</label><div class="swatches" id="ecol">${EVCOLORS.map(c=>`<button class="sw ${(p.color||TYPES[kind][1])===c?'on':''}" data-col="${c}" aria-label="색 ${c}"><i style="background:${c}"></i></button>`).join('')}</div></div>
    <div class="field"><label for="esco">공개 범위</label><select id="esco">${Object.entries(SCOPES).filter(([k])=>ownKids||k!=='kids').map(([k,v])=>`<option value="${k}" ${(p.scope||'all')===k?'selected':''}>${v}</option>`).join('')}<option value="custom" ${p.scope==='custom'?'selected':''}>직접 고르기</option></select></div>
    <div class="whopick" id="whow">${S.members.filter(x=>x.id!==ME).map(x=>`<label class="chip"><input type="checkbox" data-who="${x.id}" ${(p.who||[]).includes(x.id)?'checked':''}> ${esc(x.name)}</label>`).join('')}</div>
    <button class="btn block" id="sv">${isNew?'등록':'저장'}</button></div>`,false,back||after||null);
  let col=p.color||'';document.querySelectorAll('#ecol [data-col]').forEach(b=>b.onclick=()=>{col=b.dataset.col;document.querySelectorAll('#ecol .sw').forEach(x=>x.classList.toggle('on',x===b))});
  const ws=()=>$('#whow').hidden=$('#esco').value!=='custom';$('#esco').addEventListener('change',ws);ws();
  let rep=p.repeat||'none';segBind('#rep',v=>rep=v);
  const sync=(chg)=>{const k=$('#ety').value;$('#eendw').hidden=k!=='trip';$('#edl').textContent=k==='trip'?'첫날':'날짜';$('#escw').hidden=k!=='hospital';$('#rsw').hidden=!(k==='family'||k==='trip');
    $('#repw').hidden=k==='trip'||k==='hospital'||k==='school';
    if(chg){if(k==='hospital')$('#esco').value='adults';if(k==='jesa'){rep='lunar';document.querySelectorAll('#rep button').forEach(b=>b.classList.toggle('on',b.dataset.v==='lunar'))}
      if(k==='anniv'){rep='solar';document.querySelectorAll('#rep button').forEach(b=>b.classList.toggle('on',b.dataset.v==='solar'))}
      if(!$('#et').value||Object.values(TYPES).some(x=>x[0]===$('#et').value))$('#et').value=k==='custom'?'':TYPES[k][0];
      if(k==='custom')$('#et').focus()}};
  $('#ety').onchange=()=>sync(true);sync(false);
  $('#sv').onclick=()=>{const t=$('#et').value.trim();if(!t){$('#et').focus();toast('내용을 입력해 주세요');return}
    const k=$('#ety').value,date=$('#ed').value;let end=k==='trip'?$('#eend').value:'';if(end&&end<date){toast('마지막 날이 첫날보다 빠릅니다');return}if(end===date)end='';
    const e={id:p.id||uid(),date,title:t,type:k,scope:$('#esco').value,time:$('#etm').value,place:$('#epl').value.trim(),
      escort:k==='hospital'?$('#esc').value:'',remind:[...document.querySelectorAll('[data-rm]:checked')].map(x=>x.dataset.rm),
      repeat:$('#repw').hidden?'none':rep,by:p.by||ME,color:col||undefined};
    if(e.scope==='custom'){e.who=[...document.querySelectorAll('[data-who]:checked')].map(x=>x.dataset.who);if(!e.who.length){toast('볼 사람을 골라 주세요');return}}
    if(end)e.end=end;
    if(e.repeat==='lunar'){const l=S2L(parse(date));if(l){e.lm=l.m;e.ld=l.d}else e.repeat='solar'}
    if(!$('#rsw').hidden&&$('#ersvp').checked)e.rsvp=p.rsvp||{};
    if(isNew)S.events.push(e);else S.events[S.events.findIndex(x=>x.id===p.id)]=e;
    save();toast(isNew?'일정을 등록했어요':'수정했어요');if(p._onSaved)p._onSaved(e);
    if(after)after();else{close();render()}};
}
function dayModal(k){
  const d=parse(k),its=itemsOn(d),hol=holidayOf(d),l=S2L(d),r=me().role,myH=me().house;
  sheet(`<div class="stack"><div><h2>${md(d)} ${DOW[d.getDay()]}요일</h2>
      <span class="small muted">${l?`음력 ${l.leap?'윤':''}${l.m}.${l.d}`:''}${hol?` · <span style="color:var(--red)">${hol}</span>`:''}</span></div>
    ${its.map(e=>`<div class="card evc" style="border-left:4px solid ${evColor(e)}">
      <div class="evh"><b>${esc(e.title)}</b>${e.type!=='bday'&&r==='child'?`<span class="evbtns"><button class="chip" data-edit="${e.id}">수정</button><button class="chip" data-del="${e.id}">삭제</button></span>`:''}</div>
      <div class="small muted">${evMeta(e)}</div>
      ${e.rsvp?`<div class="rsvp">${['h1','h2','h3'].map(h=>`<span class="rs ${e.rsvp[h]||''}">${HOUSES[h]} · ${e.rsvp[h]==='yes'?'참석':e.rsvp[h]==='no'?'불참':'미정'}</span>`).join('')}</div>
        ${myH!=='p'?`<div class="actions"><button class="btn sm ${e.rsvp[myH]==='yes'?'':'ghost'}" data-rs="${e.id}:yes">참석</button><button class="btn sm ${e.rsvp[myH]==='no'?'':'ghost'}" data-rs="${e.id}:no">불참</button></div>`:''}`:''}</div>`).join('')||'<div class="muted">등록된 일정이 없습니다</div>'}
    ${r!=='parent'?`<button class="btn block" id="addev">이 날 일정 추가</button>`:''}</div>`);
  document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{b.outerHTML=`<button class="chip danger" data-del2="${b.dataset.del}">삭제 확인</button>`;
    document.querySelectorAll('[data-del2]').forEach(x=>x.onclick=()=>{S.events=S.events.filter(e=>e.id!==x.dataset.del2);save();toast('삭제했어요');dayModal(k)})});
  document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{const e=S.events.find(x=>x.id===b.dataset.edit);eventForm({...e},()=>dayModal(k))});
  document.querySelectorAll('[data-rs]').forEach(b=>b.onclick=()=>{const [id,v]=b.dataset.rs.split(':');const e=S.events.find(x=>x.id===id);e.rsvp[myH]=v;save();dayModal(k)});
  if($('#addev'))$('#addev').onclick=()=>eventForm({date:k},()=>dayModal(k));
}
let MOVE=null,DRAG=null,LPT=null,LPXY=null,SUPPRESS=false;
const movable=k=>me().role==='child'?itemsOn(parse(k)).filter(e=>e.type!=='bday').map(e=>S.events.find(x=>x.id===e.id)).filter(Boolean):[];
function moveEvent(e,from,to){const diff=Math.round((parse(to)-parse(from))/864e5);if(!diff)return;
  e.date=ymd(addDays(parse(e.date),diff));if(e.end)e.end=ymd(addDays(parse(e.end),diff));
  if(e.repeat==='lunar'){const l=S2L(parse(e.date));if(l){e.lm=l.m;e.ld=l.d}}
  save();toast(`'${e.title}'을(를) ${shortD(parse(e.date))}로 옮겼어요`)}
function calDragInit(){
  document.querySelectorAll('.cal .d').forEach(cell=>{const k=cell.dataset.day;
    const start=(x,y)=>{if(MOVE)return;const evs=movable(k);if(!evs.length)return;LPXY=[x,y];clearTimeout(LPT);
      LPT=setTimeout(()=>{LPT=null;SUPPRESS=true;try{navigator.vibrate&&navigator.vibrate(25)}catch(e){}
        if(evs.length>1)chooseMove(evs,k);else beginDrag(evs[0],k,x,y)},450)};
    cell.addEventListener('touchstart',e=>start(e.touches[0].clientX,e.touches[0].clientY),{passive:true});
    cell.addEventListener('mousedown',e=>start(e.clientX,e.clientY));
    cell.addEventListener('contextmenu',e=>e.preventDefault())});
  if(window._calDragBound)return;window._calDragBound=true;
  const mv=(x,y,ev)=>{if(DRAG){ev&&ev.preventDefault();DRAG.g.style.left=x+'px';DRAG.g.style.top=y+'px';
      document.querySelectorAll('.cal .d.drop').forEach(c=>c.classList.remove('drop'));const t=document.elementFromPoint(x,y);const c=t&&t.closest('.cal .d');if(c)c.classList.add('drop');return}
    if(LPT&&LPXY&&Math.hypot(x-LPXY[0],y-LPXY[1])>10){clearTimeout(LPT);LPT=null}};
  const up=(x,y)=>{clearTimeout(LPT);LPT=null;if(!DRAG)return;const t=document.elementFromPoint(x,y);const c=t&&t.closest('.cal .d');DRAG.g.remove();
    const d=DRAG;DRAG=null;document.body.classList.remove('dragging');if(c&&c.dataset.day!==d.from)moveEvent(d.e,d.from,c.dataset.day);renderMain()};
  document.addEventListener('touchmove',e=>mv(e.touches[0].clientX,e.touches[0].clientY,e),{passive:false});
  document.addEventListener('mousemove',e=>mv(e.clientX,e.clientY));
  document.addEventListener('touchend',e=>{const t=e.changedTouches[0];up(t.clientX,t.clientY)});
  document.addEventListener('mouseup',e=>up(e.clientX,e.clientY));
}
function beginDrag(e,from,x,y){const g=document.createElement('div');g.className='dragghost';g.style.borderColor=evColor(e);g.textContent=e.title;g.style.left=x+'px';g.style.top=y+'px';document.body.appendChild(g);
  document.body.classList.add('dragging');DRAG={e,from,g}}
function chooseMove(evs,k){
  sheet(`<div class="stack"><h2>어떤 일정을 옮길까요?</h2>${evs.map((e,i)=>`<button class="card evc" data-mv="${i}" style="text-align:left;border-left:4px solid ${evColor(e)}"><b>${esc(e.title)}</b><span class="small muted">${evMeta(e)}</span></button>`).join('')}</div>`);
  document.querySelectorAll('[data-mv]').forEach(b=>b.onclick=()=>{MOVE={e:evs[+b.dataset.mv],from:k};close();renderMain()});
}
const EVCOLORS=['#2E6A4E','#2D7FA8','#BF3F2B','#B9771F','#6A55A3','#C2577F','#6B5B4B','#3B4148'];
const evColor=e=>e.color||(TYPES[e.type]||TYPES.custom)[1];
function pollForm(){
  sheet(`<div class="stack"><h2>새 투표</h2><div class="field"><label for="pq">질문</label><input id="pq" placeholder="예: 연말 가족 식사 언제가 좋을까요?"></div>
    ${[1,2,3,4].map(i=>`<div class="field"><label for="po${i}">선택지 ${i}${i>2?' (선택)':''}</label><input id="po${i}"></div>`).join('')}
    <p class="small muted">기존 투표는 마감되고, 새 투표가 부모님 화면에 큰 버튼으로 나옵니다.</p><button class="btn block" id="sv">만들기</button></div>`);
  $('#sv').onclick=()=>{const q=$('#pq').value.trim();const os=[1,2,3,4].map(i=>$('#po'+i).value.trim()).filter(Boolean);if(!q||os.length<2)return;
    S.poll={id:uid(),q,open:true,opts:os.map(t=>({t,v:[]}))};save();close();renderMain()};
}
