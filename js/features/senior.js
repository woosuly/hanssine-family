
/* features/senior */
function renderSenior(){
  document.body.classList.add('senior');applyScale();S.seen=S.seen||{};if(!S.seen[ME]||Date.now()-S.seen[ME]>6e4){S.seen[ME]=Date.now();save()}
  const m=me(),t=today0(),l=S2L(t),w=wxToday();
  const lg=(S.log[ymd(t)]||{})[m.id]||{};const done=(lg.game?1:0)+(lg.ex?1:0);
  const body=({home:srHome,talk:srTalk,todo:srTodo,fam:srFam})[SR_TAB]();
  $('#app').innerHTML=`<div class="sr">${devBar()}
    <div class="sr-head"><button class="sr-day" id="dd0"><b>${t.getMonth()+1}월 ${t.getDate()}일 <span>${DOW[t.getDay()]}요일</span></b>${l?`<small>음력 ${l.leap?'윤':''}${l.m}월 ${l.d}일</small>`:''}</button>
      <button class="sr-wx" id="wx" aria-label="주간 날씨">${wxIcon(w[2],46)}<span><b class="num">${w[0]}°</b><small class="dust-${w[4]}">미세먼지 ${w[4]}</small></span></button></div>
    <div class="sr-body">${body}</div>
    <nav class="sr-bar">${[['home','홈'],['talk','대화'],['todo','할 일'],['fam','가족']].map(([k,n])=>`<button data-st="${k}" class="${SR_TAB===k?'on':''}">${SICON[k]}<span>${n}</span>${k==='todo'&&done<2?'<i class="badge"></i>':''}${k==='talk'?badgeHtml():''}</button>`).join('')}</nav></div>`;
  $('#wx').onclick=weatherSheet;$('#dd0').onclick=()=>{SR_TAB='fam';renderSenior()};
  document.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{SR_TAB=b.dataset.st;stopListen();renderSenior()});
  stopFx();
  ({home:bindSrHome,talk:bindSrTalk,todo:bindSrTodo,fam:bindSrFam})[SR_TAB]();
  bindDev();
}
function allPhotos(){return S.photos.filter(canSee).sort((a,b)=>b.date.localeCompare(a.date))}
function srBg(){const v=pref('bg','');if(v&&(v.startsWith('data:')||isRemote(v)))return v;const p=S.photos.find(x=>x.id===v);return p?p.img:(allPhotos().find(x=>x.tag==='풍경')||allPhotos()[0]||{img:art('mountain')}).img}
function unseenPhotos(){return allPhotos().filter(p=>p.by!==ME&&!(p.reacts||{})[ME]&&(today0()-parse(p.date))/864e5<=14)}
function srHome(){
  const t=today0();const nx=upcoming(60).filter(e=>e.type!=='etc'&&!(e._n===0&&isAnniv(e)&&(e.scope||'all')==='all'))[0];
  const nt=S.notices.filter(canSee).filter(n=>n.by!==ME&&(t-parse(n.date))/864e5<=7).sort((a,b)=>b.date.localeCompare(a.date))[0];
  const nu=unseenPhotos().length;
  return `${nt?`<button class="sr-line notice" id="ntc"><span>${esc(mem(nt.by).name)}: ${esc(nt.text)}</span><b>공지</b></button>`:''}
    ${annSoon().filter(e=>e._n===0).map(e=>`<div class="sr-line ann"><span>오늘은 ${esc(e.title)}</span><b>오늘</b></div>`).join('')}
    ${nx?`<button class="sr-line" id="dd"><span>${esc(nx.title)}</span><b>${dday(nx._n)}</b></button>`:''}
    <div class="frame" id="frame"><img src="${srBg()}" alt="홈 배경 사진">
      <button class="newph ${nu?'':'quiet'}" id="newph">${nu?`새 사진 ${nu}장 보기`:'사진첩 보기'}</button></div>
    <button class="sos" id="sos">긴급 연락</button>`;
}
function bindSrHome(){
  $('#frame img').onclick=()=>seniorAlbum(0);$('#newph').onclick=()=>seniorAlbum(0);
  if($('#ntc'))$('#ntc').onclick=noticeList;if($('#dd'))$('#dd').onclick=()=>{SR_TAB='fam';renderSenior()};
  $('#sos').onclick=sosSheet;
}
function seniorAlbum(i){
  const ph=[...unseenPhotos(),...allPhotos().filter(p=>!unseenPhotos().includes(p))];if(!ph.length)return toast('사진이 없습니다');
  i=(i+ph.length)%ph.length;const p=ph[i],myR=(p.reacts||{})[ME];
  sheet(`<div class="salb"><div class="viewer" id="viewer"><img src="${p.img}" alt="${esc(p.caption)}">
      <span class="bychip">${av(mem(p.by))}${esc(mem(p.by).name)}</span>
      ${ph.length>1?`<button class="nav l" id="vprev" aria-label="이전 사진">‹</button><button class="nav r" id="vnext" aria-label="다음 사진">›</button>`:''}
      <span class="cnt num">${i+1} / ${ph.length}</span></div>
    <div class="salb-cap">${esc(p.caption)} <span class="muted">· ${md(parse(p.date))}</span></div>
    ${(p.comments||[]).length?`<div class="salb-cmt">${(p.comments||[]).slice(-2).map(c=>`<div><b>${esc((mem(c.by)||{name:''}).name)}</b> ${esc(c.text)}</div>`).join('')}</div>`:''}
    <div class="reacts r5">${REACTS.map(r=>`<button data-r="${r}" class="${myR===r?'on':''}">${r}</button>`).join('')}<button class="micsq" id="vmic" aria-label="음성으로 댓글 남기기">${MICSVG}<span>음성</span></button></div>
    <div class="actions"><button class="btn ghost" id="setbg">배경으로 쓰기</button><button class="btn ghost" id="tts">${IC.spk}설명 듣기</button></div></div>`,true);
  const go=d=>seniorAlbum(i+d);
  if($('#vprev')){$('#vprev').onclick=()=>go(-1);$('#vnext').onclick=()=>go(1);
    let sx=null;const v=$('#viewer');v.addEventListener('touchstart',e=>sx=e.touches[0].clientX,{passive:true});
    v.addEventListener('touchend',e=>{if(sx==null)return;const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)go(dx<0?1:-1);sx=null})}
  document.querySelectorAll('.salb [data-r]').forEach(b=>b.onclick=()=>{p.reacts=p.reacts||{};p.reacts[ME]=b.dataset.r;save();toast(`"${b.dataset.r}" 남겼어요`);seniorAlbum(i)});
  $('#vmic').onclick=()=>sayReply(p,()=>seniorAlbum(i));
  $('#setbg').onclick=()=>{setPref('bg',p.id);toast('홈 배경으로 정했어요')};
  $('#tts').onclick=()=>speak(p.caption+'. '+mem(p.by).name+'이 올린 사진입니다');
}
function srFam(){
  const m=me(),poll=S.poll&&S.poll.open?S.poll:null;const up=upcoming(45).slice(0,4);
  const order=['p','h1','h2','h3'];const people=S.members.filter(x=>x.id!==ME).sort((a,b)=>order.indexOf(a.house)-order.indexOf(b.house));
  return `<div class="fam-scroll">
    <div class="sr-h2">연락하기</div><div class="calls clist">${people.map(d=>`<button ${d.phone?`data-call="${d.id}"`:'disabled class="nophone"'}>${av(d)}<span style="display:flex;flex-direction:column;align-items:flex-start"><b>${esc(d.name)}</b><span class="muted num" style="font-size:.8em">${d.role==='parent'?'':esc(HOUSES[d.house])+' · '}${d.phone?esc(d.phone):'번호 미등록'}</span></span></button>`).join('')||'<div class="muted">등록된 연락처가 없습니다</div>'}</div>
    ${poll?`<div class="sr-h2">${esc(poll.q)}</div><div class="poll-big">${poll.opts.map((o,i)=>`<button data-pv="${i}" class="${o.v.includes(m.id)?'on':''}"><span>${esc(o.t)}</span><span class="num">${o.v.length}명</span></button>`).join('')}</div>`:''}
    <div class="sr-h2">다가오는 일정</div><div class="card" style="padding:.3em .8em">${up.map(e=>`<div class="mini" style="font-size:.9em"><span>${esc(e.title)}</span><b style="color:var(--sun)">${dday(e._n)}</b></div>`).join('')||'<span class="muted">없음</span>'}</div>
    <div class="actions" style="margin-top:.4em"><button class="btn ghost" id="falb">사진첩</button><button class="btn ghost" id="sset">${GEARSVG}설정</button></div></div>`;
}
function bindSrFam(){const m=me(),poll=S.poll;
  document.querySelectorAll('[data-pv]').forEach(b=>b.onclick=()=>{poll.opts.forEach(o=>o.v=o.v.filter(x=>x!==m.id));poll.opts[+b.dataset.pv].v.push(m.id);save();toast('투표했어요');renderSenior()});
  $('#falb').onclick=()=>seniorAlbum(0);$('#sset').onclick=seniorSettings;
  document.querySelectorAll('[data-call]').forEach(b=>b.onclick=()=>callConfirm(b.dataset.call))}
function callConfirm(id){const d=mem(id);
  sheet(`<div class="stack callc">${av(d)}<h2>${esc(d.name)}에게 전화할까요?</h2><div class="num muted">${esc(d.phone)}</div>
    <a class="btn block callgo" href="tel:${esc(d.phone.replace(/\D/g,''))}" id="cgo">전화 걸기</a><button class="btn ghost block" id="cno">취소</button></div>`);
  $('#cno').onclick=close;$('#cgo').addEventListener('click',()=>setTimeout(close,300))}
function seniorSettings(){
  const mm=me();
  sheet(`<div class="stack"><h2>내 사진</h2><div class="row" style="gap:14px;align-items:center">${av(mm,'big')}<div class="stack" style="gap:6px"><button class="btn" id="myph">${mm.photo?'사진 바꾸기':'사진 넣기'}</button>${mm.photo?'<button class="btn ghost" id="myphx">사진 빼기</button>':''}</div></div>
    <input type="file" id="myphf" accept="image/*" hidden>
    <h2>글씨 크기</h2>${fsSeg()}
    <h2>홈 배경 사진</h2><img src="${srBg()}" alt="" class="bgprev">
    <div class="actions"><button class="btn" id="bgpick">사진첩에서 고르기</button><button class="btn ghost" id="bgup">휴대폰 사진</button></div>
    <input type="file" id="bgfile" accept="image/*" hidden>
    ${!LOCAL?`<h2>알림</h2>${pushRowHtml()}`:''}
    <button class="btn ghost block" id="chg">사용자 변경 (관리자)</button></div>`,true);
  bindFs(()=>{renderSenior();seniorSettings()});$('#chg').onclick=pinSheet;bindPushRow(seniorSettings);
  $('#myph').onclick=()=>$('#myphf').click();
  $('#myphf').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const d=await shrink((await readFile(f)).data,480);toast('사진 올리는 중…');const u=await upMedia(d,'profile.jpg');if(mm.photo)delMedia(mm.photo);mm.photo=u;save();toast('사진을 넣었어요');seniorSettings()}catch(er){upFail(er)}};
  if($('#myphx'))$('#myphx').onclick=()=>{delMedia(mm.photo);delete mm.photo;save();seniorSettings()};
  $('#bgup').onclick=()=>$('#bgfile').click();
  $('#bgfile').onchange=async e=>{const f=e.target.files[0];if(!f)return;const x=await prepFile(f);if(x){const u=await upMedia(x.data,'bg.jpg').catch(upFail);if(!u)return;setPref('bg',u);toast('홈 배경으로 정했어요');seniorSettings()}};
  $('#bgpick').onclick=()=>{sheet(`<h2>배경으로 쓸 사진을 고르세요</h2><div class="bggrid">${allPhotos().map(p=>`<button data-bg="${p.id}"><img src="${p.img}" alt=""></button>`).join('')}</div>`,true,seniorSettings);
    document.querySelectorAll('[data-bg]').forEach(b=>b.onclick=()=>{setPref('bg',b.dataset.bg);toast('홈 배경으로 정했어요');seniorSettings()})};
}
let SR_TAB='home',SCHAT='fam';
function sosTargets(){return (S.emergency||['d1','d2','d3']).map(mem).filter(x=>x&&x.phone)}
function sosSheet(){
  const to=sosTargets(),m=me();
  const msg=`[긴급] ${m.name}께서 ${S.family} 가족 앱에서 긴급 연락을 누르셨습니다. 바로 전화해 주세요.`;
  const href='sms:'+to.map(x=>x.phone.replace(/\D/g,'')).join(',')+'?body='+encodeURIComponent(msg);
  sheet(`<div class="stack"><h2 style="color:var(--red);font-size:1.5em">긴급 연락</h2>
    <p style="margin:0">아래 가족에게 바로 문자를 보냅니다.</p>
    <div class="card" style="padding:.4em .8em">${to.map(x=>`<div class="mini" style="font-size:.95em"><span>${esc(x.name)}</span><span class="num muted">${esc(x.phone)}</span></div>`).join('')||'<span class="muted">등록된 연락처가 없습니다. 자녀 설정에서 지정합니다.</span>'}</div>
    <a class="sosgo" id="go" href="${href}">지금 문자 보내기</a>
    <a class="sos119" href="tel:119">119에 전화</a>
    <p class="muted" style="font-size:.75em;margin:0">문자 앱이 열리면 보내기를 눌러 주세요. 가족들 앱에도 긴급 알림이 갑니다.</p>
    <button class="bigclose" id="cl">취소</button></div>`,true);
  $('#go').onclick=()=>{S.sos=S.sos||[];S.sos.push({by:ME,at:new Date().toISOString()});save();
    if(!LOCAL)famRef().collection('alerts').add({type:'sos',by:ME,ts:Date.now()}).catch(e=>console.warn(e));toast('긴급 문자를 보냅니다')};
  if($('#cl'))$('#cl').onclick=close;
}
// 부모님 AI 비서 대화도 이 폰에만 기억, '새 대화 시작'으로 지움
let SAIWHO=null;
function srAiLoad(){if(SAIWHO===ME)return;SAIWHO=ME;try{CHAT=JSON.parse(localStorage.getItem('hanssine-sai-'+ME))||[]}catch(e){CHAT=[]}}
function srAiSave(){try{localStorage.setItem('hanssine-sai-'+ME,JSON.stringify(CHAT.filter(x=>!x.wait).slice(-30)))}catch(e){}}
function srTalk(){
  const rid=SCHAT.startsWith('room:')?SCHAT.slice(5):null;
  if(rid&&RLOADED&&!ROOMS.some(r=>r.id===rid)){SCHAT='fam';return srTalk()}
  if(rid){if(CROOM!==rid)openRoom(rid)}else if(CROOM){closeRoom();CROOM=null}
  const ai=SCHAT==='ai';if(ai)srAiLoad();
  const log=ai?(CHAT.map((x,i)=>`<div class="msg ${x.role==='user'?'user':x.role==='err'?'err':'ai'}">${esc(x.text)}${x.role==='ai'&&!x.wait?`<button class="tts" data-tts="${i}">읽어 주기</button>`:''}</div>`).join('')
      ||'<div class="msg ai">궁금한 것을 말씀하세요. 가족 일정, 생신, 날씨, 생활 정보를 알려 드립니다.</div>')
    :(curMsgs().slice(-30).map(m=>chatMsgHtml(m)).join('')||`<div class="msg ai">${rid?esc(roomTitle(rid))+' 방에 하실 말씀을 보내세요.':'가족에게 하실 말씀을 보내세요.'}</div>`);
  const unr=ROOMS.some(unread);
  return `<div class="tseg" id="tseg">${[['fam','가족 대화방'],['ai','AI 비서에게 묻기']].map(([k,n])=>`<button data-v="${k}" class="${SCHAT===k?'on':''}">${n}</button>`).join('')}${ROOMS.length?`<button data-v="rooms" class="${rid?'on':''}">${rid?esc(roomTitle(rid)):'다른 대화방'}${unr&&!rid?' <i class="rdot"></i>':''}</button>`:''}</div>
    <div class="tlog" id="tlog">${log}</div>
    ${ai&&CHAT.length?'<button class="chip" id="snew" style="align-self:flex-end">새 대화 시작</button>':''}
    ${ai?'':`${rid?'':`<div class="typing big" id="typing">${typingText()}</div>`}<div id="rbar">${replyBarHtml()}</div>`}
    <div class="tin"><textarea id="tq" rows="2" placeholder="여기에 글로 쓰거나, 아래 '음성 입력'을 누르세요"></textarea>
      <div class="tbtns ${ai?'':'three'}">${ai?'':'<button class="stkbig" id="tstk">이모티콘</button>'}<button class="micbig" id="tmic">${MICSVG}음성 입력</button><button class="sendbig" id="tsend">보내기</button></div></div>`;
}
function bindSrTalk(){
  const box=$('#tlog');box.scrollTop=box.scrollHeight;
  segBind('#tseg',v=>{if(v==='rooms'){srRoomList();return}SCHAT=v;renderSenior()});
  document.querySelectorAll('[data-tts]').forEach(b=>b.onclick=()=>speak(CHAT[+b.dataset.tts].text));
  const send=async()=>{const q=$('#tq').value.trim();if(!q){toast('먼저 쓰거나 말씀해 주세요');return}
    if(SCHAT!=='ai'){postChat(q).then(()=>{if(SR_TAB==='talk')renderSenior()});renderSenior();return}
    const hist=[...CHAT.filter(x=>x.role==='user'||(x.role==='ai'&&!x.wait)).slice(-6),{role:'user',text:q}];
    CHAT.push({role:'user',text:q},{role:'ai',text:'생각하고 있어요…',wait:true});renderSenior();
    try{const a=await callAI(aiSystem(),hist);CHAT[CHAT.length-1]={role:'ai',text:a};srAiSave();if(SR_TAB==='talk')renderSenior();speak(a)}
    catch(e){CHAT[CHAT.length-1]={role:'err',text:aiErr(e)};if(SR_TAB==='talk')renderSenior()}};
  $('#tsend').onclick=send;bindMsgs(box);if($('#snew'))$('#snew').onclick=()=>{CHAT=[];srAiSave();renderSenior()};bindReplyBar();
  if(CROOM)markRoomRead(CROOM);else if(SCHAT==='fam')markFamRead();
  if(SCHAT==='fam'){$('#tq').oninput=e=>typingPing(!!e.target.value.trim());$('#tq').onblur=()=>typingPing(false)}
  if($('#tstk'))$('#tstk').onclick=()=>{sheet(`<h2>이모티콘 보내기</h2><p class="muted" style="font-size:.85em;margin:.2em 0 .6em">누르면 바로 가족 대화방에 보내집니다</p>
    <div class="sr-h2">움직이는 이모티콘</div><div class="actbig">${ACTS.map(a=>`<button data-act="${a[0]}"><span>${a[2]}</span><small>${a[1]}</small></button>`).join('')}</div>
    <div class="sr-h2">이모티콘</div><div class="stkbiggrid">${STK.map(x=>`<button data-stk="${x[0]}" aria-label="${x[1]}"><img src="${sticker(x[0])}" alt=""></button>`).join('')}</div>`,true);
    document.querySelectorAll('[data-stk]').forEach(b=>b.onclick=()=>{postChat('',b.dataset.stk);close();toast('보냈어요');renderSenior()});
    document.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{postMsg({act:b.dataset.act});close();renderSenior();playAct(b.dataset.act)});if($('#cl'))$('#cl').onclick=()=>{close();renderSenior()}};
  const mic=$('#tmic');
  mic.onclick=()=>{if(REC){stopListen();return}
    listen(t=>{$('#tq').value=t},(st,err)=>{
      if(st==='listening'){mic.classList.add('on');mic.innerHTML=MICSVG+'듣는 중… 멈추기'}
      else{mic.classList.remove('on');mic.innerHTML=MICSVG+'음성 입력';if(st!=='end')toast(micMsg(st,err))}})};
}
function srTodo(){
  const lg=(S.log[ymd(today0())]||{})[ME]||{};
  return `<div class="todo-c"><div class="sr-h2">오늘의 할 일</div>
    <button class="tbig ${lg.game?'done':''}" id="tgame"><b>두뇌 놀이</b><span>${lg.game?'오늘 완료 · 한 번 더 하기':'오늘의 추천: '+GAMES.find(g=>g[0]===todayGame())[1]}</span></button>
    <button class="tbig ${lg.ex?'done':''}" id="tex"><b>운동 기록</b><span>${(()=>{const st=exStat(ME);return st.today?`오늘 ${hm(st.today)} · ${diffTxt(st.today,st.yest)}`:`어제 ${hm(st.yest)} · 이번 달 ${hm(st.month)}`})()}</span></button>
    <div class="card" style="font-size:.9em;text-align:center">${partLine()}</div></div>`;
}
function bindSrTodo(){$('#tgame').onclick=gameMenu;$('#tex').onclick=exercise}
function seniorPhoto(p){
  sheet(`<div class="stack"><img src="${p.img}" alt="" style="width:100%;max-height:55vh;object-fit:contain;border-radius:.8em;background:var(--surface)">
    <div style="font-size:1.15em;font-weight:700">${esc(p.caption)}</div>
    <div class="row">${av(mem(p.by))}<span>${esc(byLabel(mem(p.by)))} · ${md(parse(p.date))}</span></div>
    <button class="btn ghost block" id="tts" style="font-size:.95em">읽어 주기</button></div>`,true);
  $('#tts').onclick=()=>speak(p.caption+'. '+mem(p.by).name+'이 올린 사진입니다');
}
function sayReply(p,back){
  sheet(`<div class="stack"><h2>음성으로 댓글 남기기</h2><img src="${p.img}" alt="" style="width:100%;max-height:30vh;object-fit:cover;border-radius:.8em">
    <div class="card said" id="said"><span class="muted">말씀하신 내용이 여기에 나옵니다</span></div>
    <button class="micbig" id="mic">${MICSVG}음성 입력</button>
    <button class="sendbig" id="ok" style="width:100%">이대로 보내기</button></div>`,true,back||null);
  let text='';const mic=$('#mic');
  mic.onclick=()=>{if(REC){stopListen();return}listen(t=>{text=t;$('#said').textContent=t},(st,err)=>{
    if(st==='listening'){mic.classList.add('on');mic.innerHTML=MICSVG+'듣고 있어요…'}else{mic.classList.remove('on');mic.innerHTML=MICSVG+'음성 입력';if(st!=='end')$('#said').innerHTML=`<span class="muted">${micMsg(st,err)}</span>`}})};
  $('#ok').onclick=()=>{if(!text){toast('먼저 말씀해 주세요');return}p.comments=p.comments||[];p.comments.push({id:uid(),by:ME,text:text.slice(0,300),ts:Date.now(),voice:true});save();toast('댓글을 남겼어요');if(back)back();else{close();renderSenior()}};
  if($('#cl'))$('#cl').onclick=()=>{close();renderSenior()};
}
