
/* features/settings */
const NOTI=[['photo','새 사진'],['chat','가족 대화'],['event','일정 알림'],['notice','공지']];
function setView(){
  const r=me().role,adm=isAdmin(),m=me(),nb=nextBd(m),t=today0();const N=S.notify;
  return `<div class="set">
    <details open><summary>내 정보</summary><div class="in">
      <div class="hh">${av(m)}<span style="flex:1;margin-left:10px;min-width:0"><b>${esc(byLabel(m))}</b><br><span class="small muted">생일 ${bdText(m)}${nb?` → ${md(nb)} (${dday(Math.round((nb-t)/864e5))})`:''}${m.phone?` · ${esc(m.phone)}`:''}</span></span><button class="chip" data-edit="${m.id}">수정</button></div>
      <div class="small muted">생일·전화번호는 본인이 직접 입력합니다. 이름·가구는 관리자가 정합니다.</div></div></details>
    <details><summary>내 화면</summary><div class="in"><div class="field"><label>글씨 크기</label>${fsSeg()}</div>
      <div class="field"><label>화면 모드</label><div class="seg" id="thseg">${THEMES.map(([k,n])=>`<button data-v="${k}" class="${pref('theme','system')===k?'on':''}">${n}</button>`).join('')}</div></div>
      <div class="field"><label>스킨</label><div class="swatches">${SKINS.map(([k,n,c])=>`<button class="sw ${pref('skin','forest')===k?'on':''}" data-skin="${k}"><i style="background:${c}"></i>${n}</button>`).join('')}</div></div></div></details>
    <details><summary>내 알림</summary><div class="in">${pushRowHtml()}${NOTI.map(([k,n])=>`<label class="hh"><span>${n}</span><input type="checkbox" data-mynoti="${k}" ${pref('noti_'+k,true)?'checked':''}></label>`).join('')}
      <div class="small muted">아이폰은 홈 화면에 추가해야 알림을 받습니다.</div></div></details>
    <details><summary>이 휴대폰</summary><div class="in"><div>이 폰은 <b>${esc(byLabel(m))}</b> 폰으로 정해져 있습니다.</div><button class="btn ghost block" id="chg">사용자 변경 (관리자 PIN)</button></div></details>
    ${adm?`<div class="set-h">관리자</div>
    <details><summary>가족 구성원</summary><div class="in">
      ${['p','h1','h2','h3'].map(h=>`<div><div class="small muted">${HOUSES[h]}</div>${S.members.filter(x=>x.house===h).map(x=>`<div class="hh">${av(x)}<span style="flex:1;margin-left:10px;min-width:0"><b>${esc(x.name)}</b><br><span class="small muted">${bdText(x)}${x.phone?' · '+esc(x.phone):''}</span></span><button class="chip" data-edit="${x.id}">수정</button></div>`).join('')}</div>`).join('')}
      <div class="small muted">부모님 정보는 관리자가 대신 입력합니다.</div></div></details>
    <details><summary>부모님 긴급 연락</summary><div class="in">
      <div class="small muted">부모님 화면의 '긴급 연락'을 누르면 체크한 사람에게 문자가 갑니다.</div>
      ${S.members.filter(x=>x.role==='child').map(x=>`<label class="hh"><span>${esc(byLabel(x))} <span class="small muted num">${esc(x.phone||'번호 없음')}</span></span><input type="checkbox" data-sos="${x.id}" ${(S.emergency||[]).includes(x.id)?'checked':''}></label>`).join('')}</div></details>
    <details><summary>문자 발송</summary><div class="in">
      <label class="hh"><span>부모님께 문자 함께 보내기</span><input type="checkbox" id="smsP" ${N.smsParents?'checked':''}></label>
      ${[['notice','공지'],['hospital','병원 전날 (동행 담당)'],['bday','생신·기일 7일 전']].map(([k,n])=>`<label class="hh"><span>${n}</span><input type="checkbox" data-ni="${k}" ${N.items[k]?'checked':''}></label>`).join('')}
      <div class="small muted">문자는 건당 요금이 발생합니다.</div></div></details>
    <details><summary>역할·지역</summary><div class="in">
      <div class="field"><label for="tre">회비 총무</label><select id="tre"><option value="" ${S.dues.treasurer?'':'selected'}>미정</option>${['h1','h2','h3'].map(h=>`<option value="${h}" ${S.dues.treasurer===h?'selected':''}>${HOUSES[h]}</option>`).join('')}</select></div>
      <div class="field"><label for="wloc">날씨 지역 (부모님 동네)</label><input id="wloc" value="${esc(S.weather.loc)}"></div>
      <div class="field"><label for="fam">가족 이름 (AI·공지에 쓰는 이름)</label><input id="fam" value="${esc(S.family)}" maxlength="10"></div>
      <div class="field"><label for="brand">앱 상단 이름</label><input id="brand" value="${esc(S.brand||"Han's Family")}" maxlength="20"></div></div></details>
    <details><summary>AI 연결</summary><div class="in">
      <div class="field"><label>기본 AI</label><div class="seg" id="aip">${Object.entries(AIS).map(([k,[n]])=>`<button data-v="${k}" class="${aiCfg().def===k?'on':''}">${n}</button>`).join('')}</div></div>
      ${Object.entries(AIS).map(([k,[n]])=>{const c=aiCfg(),key=(c.keys||{})[k]||'',cur=(c.models||{})[k]||'',auto=(c.auto||{})[k],list=[...new Set([...((c.lists||{})[k]||[]),...(cur?[cur]:[])])];
        return `<div class="field"><label for="aik-${k}">${n} API 키</label><input id="aik-${k}" type="password" autocomplete="off" value="${esc(key)}" placeholder="비워 두면 사용 안 함"><div class="small muted" style="text-align:right">${keyTail(key)}</div></div>
        <div class="field"><label for="aim-${k}">${n} 모델</label><select id="aim-${k}"><option value="">자동${auto?' ('+esc(auto)+')':' (최신 권장 모델)'}</option>${list.map(m=>`<option value="${esc(m)}" ${m===cur?'selected':''}>${esc(m)}</option>`).join('')}</select></div>`}).join('')}
      <label class="hh"><span>키 보이기</span><input type="checkbox" id="aishow"></label>
      <div class="row"><button class="btn" id="aisv">저장</button><button class="btn ghost" id="ailist">모델 목록 불러오기</button><button class="btn ghost" id="aitest">연결 시험</button></div>
      <div class="small muted" id="aimsg">키는 가족 공용입니다. 한 번 넣으면 등록된 가족 폰 모두가 이 키로 AI를 씁니다.</div></div></details>
    ${!LOCAL?`<details id="dvx"><summary>초대 코드 · 등록된 폰</summary><div class="in" id="dvin"><div class="small muted">불러오는 중…</div></div></details>`:''}
    <details><summary>관리자 PIN · 초기화</summary><div class="in">
      <div class="row" style="flex-wrap:nowrap"><div class="field" style="flex:1"><label for="npin">새 PIN</label><input id="npin" type="password" inputmode="numeric" maxlength="6"></div><button class="btn" id="pinsv" style="align-self:flex-end">변경</button></div>
      <button class="btn ghost block" id="reset">${LOCAL?'예시 데이터로 초기화':'모든 데이터 초기화'}</button></div></details>`:''}
    ${DEV?`<div class="set-h">개발자</div>
    <details open><summary>관리자 지정</summary><div class="in">
      <div class="field"><label for="admsel">관리자</label><select id="admsel">${S.members.filter(x=>x.role!=='parent').map(x=>`<option value="${x.id}" ${x.id===S.master.member?'selected':''}>${esc(byLabel(x))}</option>`).join('')}</select></div>
      <div class="small muted">관리자는 구성원·긴급 연락·문자·총무·AI·PIN을 관리합니다. 이 항목은 개발 단계에서만 보입니다.</div></div></details>`:''}
  </div>`;
}
function bindSet(){
  bindFs(()=>{const open=[...document.querySelectorAll('.set details')].map(d=>d.open);renderMain();document.querySelectorAll('.set details').forEach((d,i)=>d.open=open[i])});
  document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>memberForm(b.dataset.edit));
  segBind('#thseg',v=>{setPref('theme',v);applyTheme()});
  document.querySelectorAll('[data-skin]').forEach(b=>b.onclick=()=>{setPref('skin',b.dataset.skin);applyTheme();document.querySelectorAll('[data-skin]').forEach(x=>x.classList.toggle('on',x===b))});
  document.querySelectorAll('[data-mynoti]').forEach(c=>c.onchange=()=>setPref('noti_'+c.dataset.mynoti,c.checked));
  $('#chg').onclick=pinSheet;
  bindPushRow(()=>{const open=[...document.querySelectorAll('.set details')].map(d=>d.open);renderMain();document.querySelectorAll('.set details').forEach((d,i)=>d.open=open[i])});
  document.querySelectorAll('[data-sos]').forEach(c=>c.onchange=()=>{S.emergency=[...document.querySelectorAll('[data-sos]:checked')].map(x=>x.dataset.sos);save()});
  if($('#smsP')){$('#smsP').onchange=e=>{S.notify.smsParents=e.target.checked;save()};document.querySelectorAll('[data-ni]').forEach(c=>c.onchange=()=>{S.notify.items[c.dataset.ni]=c.checked;save()})}
  if($('#tre'))$('#tre').onchange=e=>{S.dues.treasurer=e.target.value;save();toast(e.target.value?'총무를 '+HOUSES[e.target.value]+'(으)로 바꿨어요':'총무를 미정으로 바꿨어요')};
  if($('#wloc'))$('#wloc').onchange=e=>{S.weather.loc=e.target.value.trim()||S.weather.loc;save();toast('날씨 지역을 바꿨어요')};
  if($('#fam'))$('#fam').onchange=e=>{S.family=e.target.value.trim()||'우리';save();renderMain()};
  if($('#brand'))$('#brand').onchange=e=>{S.brand=e.target.value.trim();save();renderMain()};
  if($('#aip')){let prov=aiCfg().def;segBind('#aip',v=>prov=v);
    const collect=()=>{const c=aiCfg();c.def=prov;c.auto=c.auto||{};Object.keys(AIS).forEach(k=>{const nk=$('#aik-'+k).value.trim();if(nk!==(c.keys[k]||''))delete c.auto[k];c.keys[k]=nk;c.models=c.models||{};c.models[k]=$('#aim-'+k).value});save()};
    const reopen=()=>{const open=[...document.querySelectorAll('.set details')].map(d=>d.open);renderMain();document.querySelectorAll('.set details').forEach((d,i)=>d.open=open[i])};
    $('#aishow').onchange=e=>Object.keys(AIS).forEach(k=>$('#aik-'+k).type=e.target.checked?'text':'password');
    $('#ailist').onclick=async()=>{collect();const c=aiCfg();c.lists=c.lists||{};c.auto={};const out=[];$('#aimsg').textContent='모델 목록을 불러오는 중…';
      for(const k of Object.keys(AIS)){const key=c.keys[k];if(!key)continue;try{const l=await listModels(k,key);c.lists[k]=l.slice(0,40);c.auto[k]=pickModel(k,l);out.push(`${AIS[k][0]} ${l.length}개`)}catch(e){out.push(`${AIS[k][0]} 실패(${e.message})`)}}
      save();reopen();$('#aimsg').textContent=out.length?out.join(' · '):'등록된 키가 없습니다'};
    $('#aisv').onclick=()=>{collect();toast('AI 설정을 저장했어요');reopen()};
    $('#aitest').onclick=async()=>{collect();$('#aimsg').textContent='연결 시험 중…';
      try{const a=await callAI('한 문장으로만 답한다.',[{role:'user',text:'연결 확인. "연결되었습니다"라고만 답해.'}]);const c=aiCfg();$('#aimsg').textContent=`응답 (${(c.models||{})[c.def]||(c.auto||{})[c.def]||AI_DEF[c.def]}): ${a}`}catch(e){$('#aimsg').textContent=aiErr(e)}}}
  if($('#pinsv'))$('#pinsv').onclick=()=>{const v=$('#npin').value.trim();if(!/^\d{4,6}$/.test(v)){toast('숫자 4~6자리로 넣어 주세요');return}S.master.pin=v;save();$('#npin').value='';toast('관리자 PIN을 바꿨어요')};
  if($('#reset'))$('#reset').onclick=()=>{$('#reset').outerHTML='<button class="btn block" style="background:var(--red)" id="reset2">모든 입력을 지우고 초기화</button>';
    $('#reset2').onclick=()=>{if(LOCAL)S=seed();else{const ms=S.members,mst=S.master;S=cleanSeed();S.members=ms;S.master=mst}save();renderMain();toast('초기화했어요')}};
  if($('#dvx'))$('#dvx').ontoggle=()=>{if($('#dvx').open)loadDevices()};
  if($('#admsel'))$('#admsel').onchange=e=>{S.master.member=e.target.value;save();toast(byLabel(mem(e.target.value))+'(을)를 관리자로 지정했어요');renderMain()};
}
function memberForm(id){
  const m=mem(id);const b=m.bd||{m:'',d:'',cal:'solar',leap:false};const adm=isAdmin();
  if(!adm&&id!==ME)return;
  sheet(`<div class="stack"><h2>${id===ME?'내 정보':esc(m.name)+' 정보'}</h2>
    ${adm?`<div class="field"><label for="mn">이름 (부모님 화면에 보이는 호칭)</label><input id="mn" value="${esc(m.name)}" maxlength="8"></div>`:`<div><b>${esc(byLabel(m))}</b></div>`}
    <div class="field"><label>생일 기준</label><div class="seg" id="cal"><button data-v="solar" class="${b.cal!=='lunar'?'on':''}">양력</button><button data-v="lunar" class="${b.cal==='lunar'?'on':''}">음력</button></div></div>
    <div class="row" style="flex-wrap:nowrap"><div class="field" style="flex:1"><label for="bm">월</label><input id="bm" inputmode="numeric" value="${b.m||''}"></div><div class="field" style="flex:1"><label for="bdd">일</label><input id="bdd" inputmode="numeric" value="${b.d||''}"></div></div>
    <label class="row" id="leapw"><input type="checkbox" id="leap" ${b.leap?'checked':''}> 윤달생 (평달 날짜로 지냅니다)</label>
    <div class="card small" id="bprev"></div>
    ${m.role!=='grand'||id===ME?`<div class="field"><label for="ph">전화번호</label><input id="ph" inputmode="tel" value="${esc(m.phone||'')}"></div>`:''}
    <button class="btn block" id="sv">저장</button></div>`);
  let cal=b.cal||'solar';
  const pv=()=>{$('#leapw').hidden=cal!=='lunar';const mm=+$('#bm').value,dd=+$('#bdd').value;
    if(!(mm>=1&&mm<=12&&dd>=1&&dd<=31)){$('#bprev').textContent='월·일을 넣으면 올해·내년 양력 날짜가 나옵니다';return}
    const y=today0().getFullYear();const f=yy=>cal==='lunar'?L2S(yy,mm,dd):new Date(yy,mm-1,dd);
    $('#bprev').innerHTML=`${y}년 <b>${md(f(y))}</b> · ${y+1}년 <b>${md(f(y+1))}</b>${cal==='lunar'?' (음력 → 양력 변환)':''}`};
  segBind('#cal',v=>{cal=v;pv()});$('#bm').oninput=pv;$('#bdd').oninput=pv;pv();
  $('#sv').onclick=()=>{if($('#mn'))m.name=$('#mn').value.trim()||m.name;const mm=+$('#bm').value,dd=+$('#bdd').value;
    m.bd=mm&&dd?{m:mm,d:dd,cal,leap:cal==='lunar'&&$('#leap').checked}:null;if($('#ph'))m.phone=$('#ph').value.trim();save();toast('저장했어요');close();renderMain()};
}
