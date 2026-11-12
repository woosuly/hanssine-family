
/* features/home */
function noticeList(){
  const ns=S.notices.filter(canSee).sort((a,b)=>b.date.localeCompare(a.date));
  sheet(`<div class="stack"><h2>공지·소식</h2>${ns.map(n=>`<div class="card"><div>${esc(n.text)}</div><div class="small muted" style="margin-top:4px">${esc(byLabel(mem(n.by)))} · ${n.date}</div>
    ${isSenior()?`<button class="btn ghost" style="margin-top:6px" data-tts="${esc(n.text)}">읽어 주기</button>`:''}</div>`).join('')||'<div class="muted">공지가 없습니다</div>'}</div>`,isSenior());
  document.querySelectorAll('[data-tts]').forEach(b=>b.onclick=()=>speak(b.dataset.tts));if($('#cl'))$('#cl').onclick=close;
}
function tabs(){return [['home','홈'],['cal','일정'],['album','앨범'],['talk','대화'],...(isDaughter()?[['dues','회비']]:[]),['trans','번역']]}
const SUBPAGES={set:'설정'};
let PREV_TAB='home';
function renderMain(){
  document.body.classList.remove('senior');applyScale();stopFx();
  const m=me();
  if(TAB==='dues'&&!isDaughter())TAB='home';
  const sub=SUBPAGES[TAB];
  const body=({home:homeView,talk:talkView,album:albumView,cal:calView,dues:duesView,set:setView,trans:()=>'<div id="transroot" class="transroot"></div>'})[TAB]();
  $('#app').innerHTML=`<div class="wrap">${devBar()}
    <div class="top">${sub?`<button class="backlink" id="tback">${BACKSVG}뒤로</button>`:`<span class="brand">${esc(S.brand||"Han's Family")}</span>`}
      <span class="tr">${TAB!=='set'?`<button class="gear" id="gear" aria-label="설정">${GEARSVG}</button>`:''}</span></div>
    ${sub?`<h2 style="font-size:20px;margin-top:4px">${sub}</h2>`:''}
    ${body}</div>
    ${TAB==='album'?`<button class="fab" id="add">사진 올리기</button><input type="file" id="file" accept="image/*" hidden>`:''}
    <nav class="tabbar"><div class="in">${tabs().map(([k,n])=>`<button data-tab="${k}" class="${TAB===k?'on':''}">${ICON[k]}${n}${k==='talk'?badgeHtml():''}</button>`).join('')}</div></nav>`;
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{TAB=b.dataset.tab;stopListen();render();window.scrollTo(0,0)});
  if($('#gear'))$('#gear').onclick=()=>{if(!SUBPAGES[TAB])PREV_TAB=TAB;TAB='set';render();window.scrollTo(0,0)};
  if($('#tback'))$('#tback').onclick=()=>{TAB=PREV_TAB||'home';render()};
  ({home:bindHomeTab,talk:bindTalk,album:bindAlbum,cal:bindCal,dues:bindDues,set:bindSet,trans:()=>{$('#transroot').style.height=Math.max(380,window.innerHeight/scale()-150)+'px';transSheet()}})[TAB]();
  bindDev();
}
function homeView(){
  const t=today0(),w=wxToday(),r=me().role;
  const nts=S.notices.filter(canSee).sort((a,b)=>b.date.localeCompare(a.date));
  const up=upcoming(45).slice(0,3);const ph=newPhotos();
  const ym=t.getFullYear()+'-'+pad(t.getMonth()+1),paid=S.dues.paid[ym]||{},cnt=['h1','h2','h3'].filter(h=>paid[h]).length;
  const pl=S.members.filter(x=>x.role==='parent').map(p=>{const x=(S.log[ymd(t)]||{})[p.id]||{};const seen=(S.seen||{})[p.id];const late=!seen||(Date.now()-seen)>3*864e5;return `<div class="mini" style="flex-direction:column;gap:0"><span><b>${esc(p.name)}</b> <span class="small ${late?'':'muted'}" ${late?'style="color:var(--red)"':''}>${agoText(seen)}</span></span><span class="small muted">${x.game?'놀이 ✓':'놀이 -'} · ${x.ex?'운동 ✓':'운동 -'}</span></div>`}).join('');
  return `<div class="stack" style="gap:10px;margin-top:6px">
    ${pushState()==='default'?`<div class="card row between" style="gap:10px"><span style="flex:1;min-width:0">새 대화·사진·일정을 알림으로 받아 보세요</span><button class="btn" id="pushon">알림 켜기</button></div>`:''}
    <button class="card wxcard" id="wx">${wxIcon(w[2],44)}<span style="flex:1;min-width:0"><span class="t num">${w[0]}°</span> <span class="small muted">${esc(S.weather.loc)} · 미세먼지 ${w[4]}</span><br><span class="small muted">${wxNote()}</span></span><span class="link">›</span></button>
    <button class="aibar" id="ask"><span class="av aiav" style="background:${AIS[aiCfg().def][1]}">AI</span><span class="muted">AI 비서에게 말하기 · 등록 · 찾기</span>${IC.mic}</button>
    <div class="hgrid">
      <div class="card" ${r!=='child'?'style="grid-column:1/-1"':''}><div class="row between"><b>공지</b><button class="link" id="nall">전체</button></div>
        ${nts[0]?`<div class="small clamp">${esc(nts[0].text)}</div><div class="small muted">${esc(mem(nts[0].by).name)} · ${nts[0].date.slice(5).replace('-','/')}</div>`:'<div class="small muted">없음</div>'}
        ${r==='child'?'<button class="link" id="nnew" style="text-align:left;margin-top:2px">+ 공지 쓰기</button>':''}</div>
      ${r==='child'?`<button class="card" id="pcard" style="text-align:left"><b>부모님 오늘</b>${pl}</button>`:''}
    </div>
    <div class="card" style="padding-block:8px"><div class="row between"><b>다가오는 일정</b><button class="link" data-go="cal">달력 ›</button></div>
      ${up.map(e=>`<div class="mini"><span>${esc(e.title)}</span><b class="num" style="color:var(--sun)">${dday(e._n)}</b></div>`).join('')||'<div class="small muted">없음</div>'}</div>
    <div><div class="row between" style="margin-bottom:6px"><b>새 사진</b><button class="link" data-go="album">앨범 ›</button></div>
      <div class="thumbs">${ph.map(p=>`<button data-ph="${p.id}"><img src="${p.img}" alt="${esc(p.caption)}"></button>`).join('')}</div></div>
    ${isDaughter()?`<button class="card wxcard" data-go="dues"><span><b>${['monthly','tiered'].includes(S.dues.mode)?`${t.getMonth()+1}월 회비`:'회비'}</b> <span class="small muted num">${!S.dues.mode?'아직 정하지 않음':`${S.dues.mode==='event'?'':`${cnt}/3 가구 납부 · `}잔액 ${won(balance())}`}</span></span><span class="link">›</span></button>`:''}
  </div>`;
}
function bindHomeTab(){
  bindPushRow(renderMain);$('#wx').onclick=weatherSheet;$('#ask').onclick=botSheet;if($('#pcard'))$('#pcard').onclick=parentSheet;
  $('#nall').onclick=noticeList;if($('#nnew'))$('#nnew').onclick=noticeForm;
  document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{TAB=b.dataset.go;render();window.scrollTo(0,0)});
  document.querySelectorAll('[data-ph]').forEach(b=>b.onclick=()=>photoDetail(b.dataset.ph));
}
function noticeForm(){
  sheet(`<div class="stack"><h2>공지 쓰기</h2>
    <div class="field"><label for="nt">내용</label><textarea id="nt" rows="3" maxlength="200" placeholder="예: 12월 첫째 주 토요일 김장"></textarea></div>
    <div class="field"><label for="nsc">공개 범위</label><select id="nsc">${Object.entries(SCOPES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div>
    <label class="row"><input type="checkbox" id="nsms" checked> 부모님께 문자로도 보내기</label>
    <p class="small muted">앱 알림은 모두에게 갑니다.</p>
    <button class="btn block" id="sv">올리기</button></div>`);
  $('#sv').onclick=()=>{const t=$('#nt').value.trim();if(!t)return;const sms=$('#nsms').checked&&$('#nsc').value!=='kids';
    S.notices.push({id:uid(),by:ME,text:t,date:ymd(today0()),scope:$('#nsc').value,sms});save();close();toast(sms?'공지를 올렸어요 · 앱 알림 + 부모님 문자':'공지를 올렸어요 · 앱 알림');renderMain()};
}
function parentSheet(){
  const t=today0(),days=[...Array(14)].map((_,i)=>ymd(addDays(t,i-13)));
  sheet(`<div class="stack"><h2>부모님 상태</h2>${S.members.filter(x=>x.role==='parent').map(p=>{const seen=(S.seen||{})[p.id];const late=seen&&(Date.now()-seen)>3*864e5;
    return `<div class="card stack" style="gap:8px"><div class="row between"><b>${esc(p.name)}</b><span class="small ${late?'':'muted'}" ${late?'style="color:var(--red)"':''}>마지막 접속 ${agoText(seen)}</span></div>
      <div class="log">${days.map(d=>{const x=(S.log[d]||{})[p.id]||{};const n=(x.game?1:0)+(x.ex?1:0);return `<i class="${n===2?'g2':n===1?'g1':''}" title="${d}"></i>`}).join('')}</div>
      <span class="small muted">최근 2주 할 일 · 진한 칸: 놀이·운동 모두</span>
      ${(()=>{const st=exStat(p.id);return `<div class="exsum"><span>오늘 <b>${hm(st.today)}</b></span><span>어제 <b>${hm(st.yest)}</b></span><span>이번 달 <b>${hm(st.month)}</b></span></div>`})()}
      ${exBars(p.id)}<button class="btn ghost" data-exai="${esc(p.name)}">AI로 운동 분석</button></div>`}).join('')}
    <div class="small muted">3일 이상 접속이 없으면 자녀들에게 안부 알림이 갑니다.</div></div>`);
  document.querySelectorAll('[data-exai]').forEach(b=>b.onclick=()=>botSheet(`${b.dataset.exai} 이번 달 운동 분석해줘`))}
