
/* features/dues */
const MODES=[['monthly','월 정액'],['tiered','가구별 금액'],['event','행사 때만']];
function accs(){return S.dues.accounts||[]}
// 회비는 딸들만 봄. 회비 방식·금액·총무는 큰딸이 정하고, 납부·내역·계좌는 총무(가구의 딸)와 큰딸이 관리
const isDaughter=()=>!!ME&&/^d\d$/.test(ME)&&(me()||{}).role==='child';
const isDuesBoss=()=>ME==='d1';
const isTreas=()=>isDaughter()&&(isDuesBoss()||me().house===S.dues.treasurer);
function accName(id){const a=accs().find(x=>x.id===id);return a?a.name:'-'}
function balance(acc){return S.dues.tx.filter(x=>!acc||x.acc===acc).reduce((a,x)=>a+x.amt,0)}
function houseDue(h){const d=S.dues;return d.mode==='tiered'?(d.perHouse||{})[h]||0:d.mode==='event'?0:d.monthly}
const maskNum=n=>{const d=(n||'').replace(/\D/g,'');return d?'끝자리 '+d.slice(-4):''};
let ACCF='';
function duesView(){
  const t=today0(),ym=t.getFullYear()+'-'+pad(t.getMonth()+1),paid=S.dues.paid[ym]||{};const isT=isTreas();
  const cnt=['h1','h2','h3'].filter(h=>paid[h]).length;const mode=S.dues.mode||'';
  const sub=`<div class="seg" id="dsub" style="margin-top:6px">${[['dues','회비'],['settle','모임 정산']].map(([k,n])=>`<button data-v="${k}" class="${DSUB===k?'on':''}">${n}</button>`).join('')}</div>`;
  const head=`<div class="card" style="margin-top:10px"><div class="row between"><span class="small muted">전체 잔액</span><span class="small muted">총무 ${S.dues.treasurer?HOUSES[S.dues.treasurer]:'미정'} · ${(MODES.find(x=>x[0]===mode)||[,'방식 미정'])[1]}</span></div>
    <div class="big-num num">${won(balance())}</div>
    <div class="accs">${accs().map(a=>`<div class="acc"><span class="small muted">${esc(a.name)}</span><b class="num">${won(balance(a.id))}</b>
      ${a.kind==='bank'?`<span class="small muted num">${esc(a.bank||'')} ${esc(maskNum(a.num))}</span><button class="link" data-copy="${esc(a.num)}">계좌번호 복사</button>`:`<span class="small muted">${a.kind==='cash'?'현금':'기타'}</span>`}</div>`).join('')}</div>
    ${isT?`<button class="link" id="accm" style="margin-top:6px">${isDuesBoss()?'걷는 방식 · 총무 · 계좌 관리 ›':'계좌 관리 ›'}</button>`:''}</div>`;
  if(DSUB==='settle')return sub+head+`<div class="sec" style="margin-top:12px"><div class="sec-h"><h2>모임 비용 정산</h2><button class="chip" id="addst">정산 추가</button></div>
    <div class="card">${S.settles.length?S.settles.slice().reverse().map(s=>{const rest=s.total-s.fromDues,per=Math.ceil(rest/s.houses.length/10)*10;
      return `<div class="hh" style="align-items:flex-start"><span><b>${esc(s.title)}</b><br><span class="small muted">${s.date} · 총 ${won(s.total)}${s.fromDues?` · 회비 ${won(s.fromDues)}`:''}</span></span>
      <span style="text-align:right"><b class="num">${rest>0?'가구당 '+won(per):'회비로 처리'}</b><br><span class="small muted">${s.houses.map(h=>HOUSES[h]).join('·')}</span></span></div>${rcSummary(s)}`}).join(''):'<span class="muted">정산 내역 없음</span>'}</div></div>`;
  const txs=S.dues.tx.filter(x=>!ACCF||x.acc===ACCF).slice().sort((a,b)=>b.date.localeCompare(a.date));
  return sub+head+(!mode?`<div class="card" style="margin-top:12px"><div class="muted">아직 회비 방식과 금액을 정하지 않았어요.</div>${isDuesBoss()?'<button class="btn block" id="dset" style="margin-top:10px">회비 정하기</button>':'<div class="small muted" style="margin-top:4px">큰딸이 정하면 여기에 보여요.</div>'}</div>`:mode==='event'?`<div class="card small muted" style="margin-top:12px">행사 때만 걷는 방식입니다. '모임 정산'에서 가구별로 나눕니다.</div>`:
    `<div class="sec" style="margin-top:12px"><div class="sec-h"><h2>${t.getMonth()+1}월 납부</h2><span class="small muted num">${cnt} / 3 가구</span></div>
    <div class="card" style="padding-block:4px">${['h1','h2','h3'].map(h=>`<div class="hh"><span>${HOUSES[h]} <span class="small muted num">${won(houseDue(h))}</span></span><button class="paid ${paid[h]?'on':''}" data-pay="${h}" ${isT?'':'disabled'}>${paid[h]?'납부 완료':'미납'}</button></div>`).join('')}</div></div>`)+
    `<div class="sec" style="margin-top:12px"><div class="sec-h"><h2>내역</h2>${isT?'<button class="chip" id="addtx">내역 추가</button>':''}</div>
    <div class="hscroll">${[['','전체'],...accs().map(a=>[a.id,a.name])].map(([k,n])=>`<button class="chip ${ACCF===k?'on':''}" data-accf="${k}">${esc(n)}</button>`).join('')}${isT?'<button class="chip addchip" id="accadd">+ 계좌 추가</button>':''}</div>
    ${isT&&ACCF?'<div class="small muted">선택한 계좌를 한 번 더 누르면 이름·번호를 고칠 수 있어요</div>':''}
    <div class="card" style="padding-block:4px;max-height:260px;overflow-y:auto">${txs.map(x=>`<div class="hh"><span><span>${esc(x.desc)}</span><br><span class="small muted num">${x.date} · ${esc(accName(x.acc))}</span></span><b class="num ${x.amt<0?'amt-m':''}">${x.amt>0?'+':''}${won(x.amt)}</b></div>`).join('')||'<span class="muted small">내역 없음</span>'}</div></div>`;
}
function bindDues(){
  const t=today0(),ym=t.getFullYear()+'-'+pad(t.getMonth()+1);
  segBind('#dsub',v=>{DSUB=v;renderMain()});
  document.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>copyText(b.dataset.copy,'계좌번호를 복사했어요'));
  document.querySelectorAll('[data-accf]').forEach(b=>b.onclick=()=>{const k=b.dataset.accf;if(k&&k===ACCF&&isTreas())return accEdit(accs().find(a=>a.id===k));ACCF=k;renderMain()});
  if($('#accadd'))$('#accadd').onclick=()=>accEdit(null);
  document.querySelectorAll('[data-pay]').forEach(b=>b.onclick=()=>{const h=b.dataset.pay;S.dues.paid[ym]=S.dues.paid[ym]||{};const on=!S.dues.paid[ym][h];S.dues.paid[ym][h]=on;
    const desc=`${t.getMonth()+1}월 회비 (${HOUSES[h]})`;
    if(on)S.dues.tx.push({id:uid(),date:ymd(t),desc,amt:houseDue(h),acc:(accs()[0]||{}).id});else{const i=S.dues.tx.findIndex(x=>x.desc===desc);if(i>=0)S.dues.tx.splice(i,1)}save();renderMain()});
  if($('#addtx'))$('#addtx').onclick=()=>txForm({});
  if($('#accm'))$('#accm').onclick=accountsSheet;
  if($('#dset'))$('#dset').onclick=accountsSheet;
  if($('#addst'))$('#addst').onclick=()=>{
    let RC=[];
    sheet(`<div class="stack"><h2>모임 비용 정산</h2>
      <div class="rcbox"><div class="row" style="gap:6px"><button class="btn" id="rccam" style="flex:1">영수증 찍기</button><button class="btn ghost" id="rcpick" style="flex:1">사진에서 고르기</button></div>
        <input type="file" id="rcf1" accept="image/*" capture="environment" hidden><input type="file" id="rcf2" accept="image/*" multiple hidden>
        <div class="small muted">영수증을 찍으면 상호·날짜·금액·분류를 읽어 아래를 채웁니다. 여러 장이면 합계로 계산합니다.</div>
        <div id="rclist" class="stack" style="gap:6px"></div><button class="link small" id="rcadd" style="align-self:flex-start">+ 영수증 없이 직접 추가</button></div>
      <div class="field"><label for="st">모임 이름</label><input id="st" placeholder="예: 12월 가족 외식"></div>
      <div class="field"><label for="sa">총 금액(원)</label><input id="sa" inputmode="numeric" placeholder="380000"></div>
      <div class="field"><label>나눌 가구</label><div class="row">${['h1','h2','h3'].map(h=>`<label class="chip"><input type="checkbox" data-h="${h}" checked> ${HOUSES[h]}</label>`).join('')}</div></div>
      <div class="field"><label for="sacc">회비에서 먼저 쓰기</label><select id="sacc"><option value="">회비 사용 안 함</option>${accs().map(a=>`<option value="${a.id}">${esc(a.name)} (잔액 ${won(balance(a.id))})</option>`).join('')}</select></div>
      <div class="card small" id="prev">금액을 넣으면 가구당 금액이 계산됩니다</div>
      <button class="btn block" id="sv">저장</button></div>`);
    const calc=()=>{const a=parseInt($('#sa').value.replace(/\D/g,''),10)||0;const hs=[...document.querySelectorAll('[data-h]:checked')].map(x=>x.dataset.h);const ac=$('#sacc').value;
      const fd=ac?Math.min(a,Math.max(0,balance(ac))):0;const rest=a-fd;const per=hs.length?Math.ceil(rest/hs.length/10)*10:0;
      $('#prev').innerHTML=a?`회비 사용 <b class="num">${won(fd)}</b> · 남은 <b class="num">${won(rest)}</b> → ${hs.length}가구 각 <b class="num">${won(per)}</b>`:'금액을 넣으면 가구당 금액이 계산됩니다';return {a,hs,fd,ac}};
    document.querySelectorAll('.sheet input:not([type=file]),.sheet select').forEach(i=>i.oninput=i.onchange=calc);
    // 영수증: 읽은 결과 목록 → 총 금액·이름·날짜 자동 채움 (직접 고쳐도 됨)
    const catSel=(r,i)=>{const own=r.cat&&!RCATS.includes(r.cat);return `<select class="rccat ${r.cat&&r.cat!=='기타'?'':'need'}" data-rcc="${i}" aria-label="분류">${r.cat?'':'<option value="" selected>분류 선택</option>'}${RCATS.map(c=>`<option ${c===r.cat?'selected':''}>${c}</option>`).join('')}${own?`<option selected>${esc(r.cat)}</option>`:''}<option value="__own">직접 입력…</option></select>`};
    const rcDraw=()=>{$('#rclist').innerHTML=RC.map((r,i)=>r.busy?`<div class="rcrow muted small">영수증 읽는 중…</div>`:r.manual?
        `<div class="rcrow">${catSel(r,i)}<input class="rcin" data-rcn="${i}" value="${esc(r.store)}" placeholder="내용 (예: 주차비)"><input class="rcin num" data-rca="${i}" value="${r.total||''}" inputmode="numeric" placeholder="금액" style="width:6.5em"><button class="chip" data-rcx="${i}" aria-label="빼기">✕</button></div>`:
        `<div class="rcrow">${catSel(r,i)}<span class="rcname">${esc(r.store||'영수증')}<br><span class="small muted">${esc(r.date||'')}${(r.items||[]).length?' · '+esc(r.items.slice(0,3).map(x=>x.name).join(', ')):''}</span></span><b class="num">${won(r.total)}</b><button class="chip" data-rcx="${i}" aria-label="빼기">✕</button></div>`).join('')+
        (RC.some(r=>!r.busy&&(!r.cat||r.cat==='기타'))?'<div class="small" style="color:var(--sun)">분류를 못 정한 항목은 직접 골라 주세요. 목록에 없으면 "직접 입력"을 고르세요.</div>':'');
      document.querySelectorAll('[data-rcx]').forEach(b=>b.onclick=()=>{RC.splice(+b.dataset.rcx,1);rcFill();rcDraw()});
      document.querySelectorAll('[data-rcc]').forEach(s=>s.onchange=()=>{const r=RC[+s.dataset.rcc];if(s.value==='__own'){prompt2(s);return}r.cat=s.value;rcFill();rcDraw()});
      document.querySelectorAll('[data-rcn]').forEach(x=>x.oninput=()=>{RC[+x.dataset.rcn].store=x.value.trim()});
      document.querySelectorAll('[data-rca]').forEach(x=>x.oninput=()=>{RC[+x.dataset.rca].total=parseInt(x.value.replace(/\D/g,''),10)||0;rcFill()})};
    // 직접 입력: 고른 칸 자리에 글 칸을 띄움
    const prompt2=s=>{const i=+s.dataset.rcc,inp=document.createElement('input');inp.className='rcin';inp.placeholder='분류 (예: 주차비)';inp.style.width='7em';s.replaceWith(inp);inp.focus();
      const done=()=>{const v=inp.value.trim();if(v)RC[i].cat=v.slice(0,12);rcFill();rcDraw()};inp.onblur=done;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();inp.blur()}}};
    $('#rcadd').onclick=()=>{RC.push({manual:true,store:'',total:0,cat:'',date:ymd(t)});rcDraw();const ins=document.querySelectorAll('[data-rcn]');if(ins.length)ins[ins.length-1].focus()};
    const rcFill=()=>{const ok=RC.filter(r=>!r.busy&&r.total);if(!ok.length)return;ok.forEach(r=>{if(!r.cat)r.cat=''});$('#sa').value=ok.reduce((s,r)=>s+r.total,0);
      if(!$('#st').dataset.touched){const d0=ok.map(r=>r.date).filter(Boolean).sort()[0],cats=[...new Set(ok.map(r=>r.cat))];
        $('#st').value=`${d0?(+d0.slice(5,7))+'/'+(+d0.slice(8,10))+' ':''}${ok.length===1&&ok[0].store?ok[0].store:cats.join('·')}`}calc()};
    $('#st').addEventListener('input',()=>{$('#st').dataset.touched=1});
    const rcRead=async f=>{const r={busy:true};RC.push(r);rcDraw();
      try{const img=(await readFile(f)).data,small=await shrink(img,1600);
        const sys=`너는 영수증 판독기다. JSON만 출력한다. 영수증이 아니면 {"total":0}.
형식: {"store":"상호","date":"YYYY-MM-DD(없으면 빈 문자열)","total":합계 정수(원, 할인 반영 최종 결제 금액),"cat":"${RCATS.join('|')} 중 하나 (확실하지 않으면 기타)","items":[{"name":"품목","amount":정수}] (최대 8개)}`;
        const raw=await trAI(sys,[{role:'user',text:'이 영수증을 읽어 줘'}],small);const j=JSON.parse((raw.match(/\{[\s\S]*\}/)||['{}'])[0]);
        if(!(+j.total>0))throw new Error('영수증을 읽지 못했어요. 글자가 잘 보이게 다시 찍어 주세요');
        Object.assign(r,{busy:false,store:String(j.store||'').slice(0,40),date:/^\d{4}-\d{2}-\d{2}$/.test(j.date||'')?j.date:'',total:Math.round(+j.total),cat:RCATS.includes(j.cat)?j.cat:'기타',items:(j.items||[]).slice(0,8)});
        if(MEDIA_ON())upMedia(await shrink(img,1280),'receipt.jpg').then(u=>{r.img=u}).catch(()=>{})}
      catch(e){RC.splice(RC.indexOf(r),1);toast(aiErr(e).split('.')[0])}rcFill();rcDraw()};
    const pick=e=>{[...e.target.files].slice(0,10).forEach(rcRead);e.target.value=''};
    $('#rccam').onclick=()=>$('#rcf1').click();$('#rcpick').onclick=()=>$('#rcf2').click();$('#rcf1').onchange=pick;$('#rcf2').onchange=pick;
    $('#sv').onclick=()=>{const {a,hs,fd,ac}=calc();if(!a||!hs.length||!$('#st').value.trim())return;if(RC.some(r=>r.busy)){toast('영수증을 읽는 중이에요. 잠시만요');return}
      const rcs=RC.filter(r=>r.total).map(r=>({store:r.store,date:r.date,total:r.total,cat:r.cat||'기타',items:r.items||[],img:r.img||''}));
      S.settles.push({id:uid(),date:(rcs.map(r=>r.date).filter(Boolean).sort()[0])||ymd(t),title:$('#st').value.trim(),total:a,fromDues:fd,houses:hs,...(rcs.length?{receipts:rcs}:{})});
      if(fd)S.dues.tx.push({id:uid(),date:ymd(t),desc:$('#st').value.trim()+' (정산)',amt:-fd,acc:ac});save();close();renderMain()}};
}
function txForm(p,after,back){
  p=p||{};const t=today0();let kind=p.amount>0?'in':'out';
  sheet(`<div class="stack"><h2>회비 내역 추가</h2><div class="seg" id="io">${[['out','지출'],['in','입금'],['move','계좌 간 이동']].map(([k,n])=>`<button data-v="${k}" class="${kind===k?'on':''}">${n}</button>`).join('')}</div>
    <div class="field" id="tdw"><label for="td">내용</label><input id="td" value="${esc(p.desc||'')}" placeholder="예: 어머니 생신 케이크"></div>
    <div class="field"><label for="ta">금액(원)</label><input id="ta" inputmode="numeric" value="${p.amount?Math.abs(p.amount):''}" placeholder="50000"></div>
    <div class="row" style="flex-wrap:nowrap"><div class="field" style="flex:1"><label for="tacc" id="taccl">계좌</label><select id="tacc">${accs().map(a=>`<option value="${a.id}" ${p.acc===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</select></div>
      <div class="field" style="flex:1" id="tto"><label for="tacc2">받는 계좌</label><select id="tacc2">${accs().map((a,i)=>`<option value="${a.id}" ${i===1?'selected':''}>${esc(a.name)}</option>`).join('')}</select></div></div>
    <div class="field"><label for="tdt">날짜</label><input type="date" id="tdt" value="${p.date||ymd(t)}"></div>
    <button class="btn block" id="sv">저장</button></div>`,false,back||after||null);
  const sync=()=>{$('#tto').hidden=kind!=='move';$('#tdw').hidden=kind==='move';$('#taccl').textContent=kind==='move'?'보내는 계좌':'계좌'};
  segBind('#io',v=>{kind=v;sync()});sync();
  $('#sv').onclick=()=>{const a=parseInt($('#ta').value.replace(/\D/g,''),10);if(!a){toast('금액을 입력해 주세요');return}const dt=$('#tdt').value;
    if(kind==='move'){const f=$('#tacc').value,to=$('#tacc2').value;if(f===to){toast('같은 계좌입니다');return}
      S.dues.tx.push({id:uid(),date:dt,desc:`${accName(to)}(으)로 이동`,amt:-a,acc:f},{id:uid(),date:dt,desc:`${accName(f)}에서 이동`,amt:a,acc:to})}
    else{if(!$('#td').value.trim()){toast('내용을 입력해 주세요');return}S.dues.tx.push({id:uid(),date:dt,desc:$('#td').value.trim(),amt:(kind==='in'?1:-1)*a,acc:$('#tacc').value})}
    save();toast('기록했어요');if(p._onSaved)p._onSaved();if(after)after();else{close();render()}};
}
function accEdit(a,back){const d=S.dues;d.accounts=d.accounts||[];const isNew=!a;a=a||{id:'a'+uid(),kind:'bank'};
  sheet(`<div class="stack"><h2>${isNew?'계좌 추가':'계좌 수정'}</h2>
    <div class="field"><label>종류</label><div class="seg" id="ak">${[['bank','은행 계좌'],['cash','현금'],['etc','기타']].map(([k,n])=>`<button data-v="${k}" class="${a.kind===k?'on':''}">${n}</button>`).join('')}</div></div>
    <div class="field"><label for="an">이름</label><input id="an" value="${esc(a.name||'')}" placeholder="예: 경조사 통장"></div>
    <div id="bankw" class="stack" style="gap:8px"><div class="field"><label for="ab">은행</label><input id="ab" value="${esc(a.bank||'')}" placeholder="예: 카카오뱅크"></div>
      <div class="field"><label for="anum">계좌번호</label><input id="anum" inputmode="numeric" value="${esc(a.num||'')}"></div>
      <div class="field"><label for="ah">예금주</label><input id="ah" value="${esc(a.holder||'')}"></div></div>
    <div class="actions">${!isNew&&!d.tx.some(x=>x.acc===a.id)?'<button class="btn ghost" id="adel">삭제</button>':''}<button class="btn" id="asv">저장</button></div></div>`,false,back||null);
  let k=a.kind;const s2=()=>$('#bankw').hidden=k!=='bank';segBind('#ak',v=>{k=v;s2()});s2();
  if($('#adel'))$('#adel').onclick=()=>{d.accounts=d.accounts.filter(x=>x.id!==a.id);if(ACCF===a.id)ACCF='';save();close();renderMain()};
  $('#asv').onclick=()=>{const n=$('#an').value.trim();if(!n){toast('이름을 입력해 주세요');return}
    Object.assign(a,{name:n,kind:k,bank:$('#ab').value.trim(),num:$('#anum').value.trim(),holder:$('#ah').value.trim()});
    if(isNew){d.accounts.push(a);ACCF=a.id}save();toast('저장했어요');if(back)back();else{close();renderMain()}};
}
function accountsSheet(){
  const d=S.dues,boss=isDuesBoss();
  sheet(`<div class="stack"><h2>${boss?'회비 정하기 · 계좌':'계좌 관리'}</h2>
    <div class="stack" style="gap:12px" ${boss?'':'hidden'}>
    <div class="field"><label for="tre">총무</label><select id="tre"><option value="">미정 (큰딸이 관리)</option>${['h1','h2','h3'].map(h=>`<option value="${h}" ${d.treasurer===h?'selected':''}>${HOUSES[h]}</option>`).join('')}</select></div>
    <div class="field"><label>걷는 방식</label><div class="seg" id="mode">${MODES.map(([k,n])=>`<button data-v="${k}" class="${d.mode===k?'on':''}">${n}</button>`).join('')}</div></div>
    <div class="field" id="mw"><label for="mm">가구당 월 회비(원)</label><input id="mm" inputmode="numeric" value="${d.monthly||''}" placeholder="예: 50000"></div>
    <div id="tw" class="stack" style="gap:8px">${['h1','h2','h3'].map(h=>`<div class="field"><label for="ph-${h}">${HOUSES[h]} 월 회비(원)</label><input id="ph-${h}" inputmode="numeric" value="${(d.perHouse||{})[h]||''}" placeholder="예: 50000"></div>`).join('')}</div></div>
    <h2 style="margin-top:6px">계좌</h2>
    ${accs().map(a=>`<div class="card"><div class="row between"><b>${esc(a.name)}</b><span class="row" style="gap:4px"><button class="chip" data-ae="${a.id}">수정</button>${S.dues.tx.some(x=>x.acc===a.id)?'':`<button class="chip" data-ad="${a.id}">삭제</button>`}</span></div>
      <div class="small muted">${a.kind==='bank'?`${esc(a.bank||'')} ${esc(a.num||'')} · 예금주 ${esc(a.holder||'-')}`:a.kind==='cash'?'현금 보관':'기타 (상품권·포인트 등)'} · 잔액 ${won(balance(a.id))}</div></div>`).join('')}
    <button class="btn ghost block" id="aadd">계좌·보관처 추가</button>
    <button class="btn block" id="sv">저장</button></div>`,false,()=>{close();renderMain()});
  let mode=d.mode||'';const sync=()=>{$('#mw').hidden=mode!=='monthly';$('#tw').hidden=mode!=='tiered'};segBind('#mode',v=>{mode=v;sync()});sync();
  const saveMode=()=>{if(!boss)return;d.treasurer=$('#tre').value;d.mode=mode;d.monthly=parseInt($('#mm').value.replace(/\D/g,''),10)||0;d.perHouse={};['h1','h2','h3'].forEach(h=>d.perHouse[h]=parseInt($('#ph-'+h).value.replace(/\D/g,''),10)||0);save()};
  $('#sv').onclick=()=>{if(boss&&mode==='monthly'&&!(parseInt($('#mm').value.replace(/\D/g,''),10)>0)){toast('월 회비 금액을 입력해 주세요');$('#mm').focus();return}saveMode();toast('저장했어요');close();renderMain()};
  document.querySelectorAll('[data-ad]').forEach(b=>b.onclick=()=>{saveMode();d.accounts=accs().filter(a=>a.id!==b.dataset.ad);save();accountsSheet()});
  const edit=a=>{saveMode();const isNew=!a;a=a||{id:'a'+uid(),kind:'bank'};
    sheet(`<div class="stack"><h2>${isNew?'계좌 추가':'계좌 수정'}</h2>
      <div class="field"><label>종류</label><div class="seg" id="ak">${[['bank','은행 계좌'],['cash','현금'],['etc','기타']].map(([k,n])=>`<button data-v="${k}" class="${a.kind===k?'on':''}">${n}</button>`).join('')}</div></div>
      <div class="field"><label for="an">이름</label><input id="an" value="${esc(a.name||'')}" placeholder="예: 가족 모임통장"></div>
      <div id="bankw" class="stack" style="gap:8px"><div class="field"><label for="ab">은행</label><input id="ab" value="${esc(a.bank||'')}" placeholder="예: 카카오뱅크"></div>
        <div class="field"><label for="anum">계좌번호</label><input id="anum" inputmode="numeric" value="${esc(a.num||'')}"></div>
        <div class="field"><label for="ah">예금주</label><input id="ah" value="${esc(a.holder||'')}"></div></div>
      <button class="btn block" id="asv">저장</button></div>`,false,accountsSheet);
    let k=a.kind;const s2=()=>$('#bankw').hidden=k!=='bank';segBind('#ak',v=>{k=v;s2()});s2();
    $('#asv').onclick=()=>{const n=$('#an').value.trim();if(!n){toast('이름을 입력해 주세요');return}
      Object.assign(a,{name:n,kind:k,bank:$('#ab').value.trim(),num:$('#anum').value.trim(),holder:$('#ah').value.trim()});
      if(isNew)d.accounts.push(a);save();accountsSheet()}};
  document.querySelectorAll('[data-ae]').forEach(b=>b.onclick=()=>edit(accs().find(a=>a.id===b.dataset.ae)));
  $('#aadd').onclick=()=>edit(null);
}

// 정산 영수증: 분류별 합계 칩 + 영수증 사진 보기
function rcSummary(s){const r=s.receipts||[];if(!r.length)return '';const by={};r.forEach(x=>by[x.cat]=(by[x.cat]||0)+x.total);
  return `<div class="rcsum">${Object.entries(by).map(([c,v])=>`<span class="chip">${esc(c)} ${won(v)}</span>`).join('')}${r.some(x=>x.img)?`<button class="link small" data-rcv="${s.id}">영수증 ${r.length}장 보기</button>`:''}</div>`}
document.addEventListener('click',e=>{const b=e.target.closest('[data-rcv]');if(!b)return;const s=S.settles.find(x=>x.id===b.dataset.rcv);if(!s)return;
  sheet(`<div class="stack"><h2>${esc(s.title)} 영수증</h2>${s.receipts.map(x=>`<div class="card stack" style="gap:4px"><div class="row between"><b>${esc(x.store||'영수증')}</b><b class="num">${won(x.total)}</b></div>
    <div class="small muted">${esc(x.cat)}${x.date?' · '+esc(x.date):''}</div>${(x.items||[]).length?`<div class="small">${x.items.map(i=>`${esc(i.name)} ${won(i.amount||0)}`).join('<br>')}</div>`:''}
    ${x.img?`<img src="${esc(x.img)}" alt="영수증" style="width:100%;border-radius:10px">`:''}</div>`).join('')}</div>`)});

const RCATS=['식비','교통비','숙박비','장보기','선물','병원·약','놀이·관람','기타'];
