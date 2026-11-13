
/* features/bot */
let BOT=[],BOTIMG=null,BOTWHO=null;
// AI 비서 대화는 이 폰에만 기억 (사진은 빼고 최근 30개). '새 대화'로 지움
function botLoad(){if(BOTWHO===ME)return;BOTWHO=ME;try{BOT=JSON.parse(localStorage.getItem('hanssine-bot-'+ME))||[]}catch(e){BOT=[]}}
function botSave(){try{localStorage.setItem('hanssine-bot-'+ME,JSON.stringify(BOT.filter(m=>!(m.role==='ai'&&m.text==='확인하고 있어요…')).slice(-30).map(m=>({...m,img:null}))))}catch(e){}}
function botSys(){return `너는 '${S.family}' 가족 앱의 AI 비서다. 사용자의 말이나 첨부 이미지(사진, 영수증, 병원 예약 문자 캡처, 초대장 등)를 보고 앱에 반영할 작업을 찾는다.
반드시 JSON 하나만 출력한다: {"reply":"한국어 답","actions":[...]} (작업을 반영하는 경우 reply는 한 줄로 짧게, 질문·상의에 답하는 경우 reply는 아래 답하는 방식을 따른다. reply 안 줄바꿈은 \\n)
actions 항목:
- 일정 {"type":"event","date":"YYYY-MM-DD","end":"여행처럼 여러 날이면 YYYY-MM-DD","title":"","kind":"family|trip|hospital|jesa|anniv|custom","time":"HH:MM","place":"","repeat":"none|solar|lunar"}
- 회비 내역 {"type":"tx","date":"YYYY-MM-DD","desc":"","amount":정수(지출 음수, 입금 양수),"acc":"계좌 id"}
- 공지 {"type":"notice","text":""}
- 앨범 사진 {"type":"photo","caption":"","tag":"손주|풍경|모임"} (첨부가 일반 사진일 때)
- 투표 {"type":"poll","q":"","opts":["",""]}
- 모임 정산 {"type":"settle","title":"","total":정수}
일정·회비는 이미 정해진 약속이나 이미 쓰거나 받은 돈을 기록해 달라는 말일 때만 만든다. 알아봐 달라·추천·비교·어때·좋을지·계획 중 같은 질문이나 상의는 금액이나 날짜가 들어 있어도 actions를 []로 두고 reply에 답을 충분히 쓴다(여러 줄 가능).
반영할 작업이 없으면 actions는 []로 두고 reply로 답한다.
${ANSWER_RULE} 영수증은 합계 금액과 상호를 읽어 tx로 만든다. 날짜는 오늘 기준으로 계산한다.
계좌 id: ${accs().map(a=>a.id+'='+a.name).join(', ')}
${aiContext()}`}
function parseDateKo(t){const now=today0();let m;const fix=(mo,d)=>{let x=new Date(now.getFullYear(),mo-1,d);if(x<addDays(now,-60))x=new Date(now.getFullYear()+1,mo-1,d);return x};
  if(m=t.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/))return fix(+m[1],+m[2]);
  if(m=t.match(/(\d{1,2})\/(\d{1,2})/))return fix(+m[1],+m[2]);
  if(/모레/.test(t))return addDays(now,2);if(/내일/.test(t))return addDays(now,1);if(/오늘/.test(t))return now;
  if(m=t.match(/(다음\s*주|이번\s*주|담주)?\s*([월화수목금토일])요일/)){const w='일월화수목금토'.indexOf(m[2]);
    if(m[1]&&/다음|담/.test(m[1])){const mon=addDays(now,(8-now.getDay())%7||7);return addDays(mon,(w+6)%7)}
    let d=addDays(now,(w-now.getDay()+7)%7);return d}
  if(m=t.match(/(\d{1,2})\s*일/))return fix(now.getMonth()+1,+m[1]);return null}
function parseAmt(t){let m;if(m=t.match(/(\d+)\s*만\s*(?:(\d+)\s*천)?/))return +m[1]*10000+(m[2]?+m[2]*1000:0);
  if(m=t.match(/(\d+)\s*천\s*원/))return +m[1]*1000;if(m=t.match(/(\d[\d,]{2,})\s*원?/))return +m[1].replace(/,/g,'');return 0}
// 묻거나 상의하는 말: 금액·날짜가 있어도 기록 카드로 만들지 않음
const askLike=t=>/(\?|알아봐|알아 봐|추천|좋을지|좋을까|어때|어떨까|비교|하려는데|하려고 하는데|계획|숙소|맛집|가볼|가 볼|코스|뭐가 좋)/.test(t)||t.length>=40;
function localIntent(t,img){const acts=[];t=t||'';
  if(t&&!img&&askLike(t)&&!/(잡아|등록|추가|올려|기록|썼|냈|결제)/.test(t)){const found=localSearch(t);
    return {reply:found.length?'앱에서 찾은 내용입니다. 추천이나 알아보는 질문은 AI가 연결되면 답할 수 있어요.':'추천이나 알아보는 질문은 AI가 연결되면 답할 수 있어요. 설정 > AI 연결에서 키를 등록해 주세요.',actions:[],found}}
  if(/(운동|걷기|산책|스트레칭|체조)/.test(t)&&/(분석|얼마|비교|통계|어땠|정리|했어|했나|많이)/.test(t))return {reply:exAnalysis(t),actions:[]};
  if(t&&/(\?|언제|어디|뭐였|뭐야|찾아|검색|였지|알려)/.test(t)&&!/(잡아|등록|추가|만들|올려|기록|썼|냈)/.test(t)){const found=localSearch(t);
    return {reply:found.length?'앱에서 찾은 내용입니다.':'앱에서 찾지 못했어요. AI가 연결되면 더 자세히 답할 수 있어요.',actions:[],found}}
  const date=parseDateKo(t),amt=parseAmt(t);
  const clean=s=>s.replace(/\d{1,2}\s*월\s*\d{1,2}\s*일|\d{1,2}\/\d{1,2}|(다음\s*주|이번\s*주|담주)?\s*[월화수목금토일]요일|모레|내일|오늘|\d+\s*만\s*(\d+\s*천)?\s*원?|\d[\d,]{2,}\s*원|(일정|등록|잡아\s*줘|추가|해\s*줘|해줘|좀|부탁|으로|에서|회비|지출|썼어|썼다|결제)/g,' ').replace(/\s+/g,' ').trim();
  if(amt&&/(회비|지출|썼|결제|샀|구매|영수증|입금|냈|납부|들어)/.test(t))acts.push({type:'tx',date:ymd(date||today0()),desc:clean(t)||'회비 사용',amount:/(입금|냈|납부|들어)/.test(t)?amt:-amt,acc:(accs()[0]||{}).id});
  else if(/투표/.test(t)){const body=t.replace(/투표.*$/,'');const opts=body.split(/,|，|아니면|또는|중에|중/).map(x=>x.trim()).filter(x=>x&&x.length<=12);
    acts.push({type:'poll',q:clean(body.split(/,|아니면|또는/)[0])||'언제가 좋을까요?',opts:opts.length>=2?opts.slice(-4):['좋아요','다음에']})}
  else if(/(공지|알려|전달)/.test(t)&&!date)acts.push({type:'notice',text:t.replace(/(공지|올려\s*줘|해\s*줘|알려\s*줘|전달해\s*줘)/g,'').trim()});
  else if(date){let end=null;const m=t.match(/(?:~|부터)\s*(?:(\d{1,2})\s*월\s*)?(\d{1,2})\s*일/);if(m)end=new Date(date.getFullYear(),(m[1]?+m[1]:date.getMonth()+1)-1,+m[2]);
    const kind=/(병원|검진|진료|치과)/.test(t)?'hospital':/(여행|캠핑|휴가)/.test(t)?'trip':/(제사|기일|성묘)/.test(t)?'jesa':/(모임|식사|김장|생신|외식|모여)/.test(t)?'family':'custom';
    const tm=t.match(/(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분|\s*반)?/);let time='';if(tm){let h=+tm[2];if(tm[1]==='오후'&&h<12)h+=12;time=pad(h)+':'+(tm[3]?pad(+tm[3]):/반/.test(tm[0])?'30':'00')}
    acts.push({type:'event',date:ymd(date),end:end&&end>date?ymd(end):'',title:clean(t.replace(/(오전|오후)?\s*\d{1,2}\s*시(\s*\d{1,2}\s*분|\s*반)?|(~|부터)\s*(\d{1,2}\s*월\s*)?\d{1,2}\s*일(까지)?/g,''))||TYPES[kind][0],kind,time})}
  if(img&&(/(사진|앨범|올려)/.test(t)||(!acts.length)))acts.push({type:'photo',caption:clean(t.replace(/(사진|앨범|올려\s*줘)/g,''))||'새 사진',tag:'모임'});
  const found=acts.length?[]:localSearch(t);
  return {reply:acts.length?'아래 내용으로 반영할까요?':found.length?'앱에서 찾은 내용입니다.':'일정, 회비 사용, 공지, 투표, 사진 등록 문장을 이해할 수 있어요. 예: "12월 5일 김장 일정 잡아줘"',actions:acts,found}}
function actText(a){
  if(a.type==='event'){const d=parse(a.date);return ['일정',`${shortD(d)}${a.end?' ~ '+shortD(parse(a.end)):''}${a.time?' '+a.time:''} · ${a.title}`,TYPES[a.kind]?TYPES[a.kind][0]:'']}
  if(a.type==='tx')return ['회비',`${a.amount<0?'지출':'입금'} ${won(Math.abs(a.amount))} · ${a.desc}`,accName(a.acc)];
  if(a.type==='notice')return ['공지',a.text,''];
  if(a.type==='photo')return ['앨범',a.caption,a.tag];
  if(a.type==='poll')return ['투표',a.q,(a.opts||[]).join(' / ')];
  if(a.type==='settle')return ['정산',`${a.title} · 총 ${won(a.total)}`,'세 가구 나누기'];
  return ['기타',JSON.stringify(a),'']}
function applyAct(a,img){const r=me().role,isT=isTreas();
  if((a.type==='tx'||a.type==='settle')&&!isDaughter())return '회비는 딸들만 반영할 수 있어요';
  if(a.type==='event'){const kind=TYPES[a.kind]&&EVKINDS.includes(a.kind)?a.kind:'custom';const e={id:uid(),date:a.date,title:a.title||TYPES[kind][0],type:kind,scope:kind==='hospital'?'adults':'all',time:a.time||'',place:a.place||'',escort:'',remind:['d1'],repeat:a.repeat||(kind==='jesa'?'lunar':'none')};
    if(a.end&&a.end>a.date)e.end=a.end;if(e.repeat==='lunar'){const l=S2L(parse(e.date));if(l){e.lm=l.m;e.ld=l.d}else e.repeat='none'}if(kind==='family'||kind==='trip')e.rsvp={};S.events.push(e);return '일정에 등록했어요'}
  if(a.type==='tx'){if(!isT){S.chat=S.chat||[];S.chat.push({id:uid(),by:ME,ts:Date.now(),text:`[회비 기록 요청] ${a.date} ${a.desc} ${won(a.amount)} — 총무님 확인 부탁드려요`});return `총무(${S.dues.treasurer?HOUSES[S.dues.treasurer]:'미정'})에게 기록 요청을 보냈어요`}
    S.dues.tx.push({id:uid(),date:a.date,desc:a.desc,amt:a.amount,acc:accs().some(x=>x.id===a.acc)?a.acc:(accs()[0]||{}).id});return '회비 내역에 기록했어요'}
  if(a.type==='notice'){S.notices.push({id:uid(),by:ME,text:a.text,date:ymd(today0()),scope:'all',sms:false});return '공지로 올렸어요'}
  if(a.type==='photo'){if(!img)return '사진이 없어요';const fd=(S.folders.find(f=>f.name===a.tag)||{}).id||'';const p={id:uid(),by:ME,folder:fd,tag:fname(fd),caption:a.caption||'새 사진',date:ymd(today0()),scope:'all',img,reacts:{}};
    upMedia(img,'photo.jpg').then(u=>{p.img=u;S.photos.push(p);save();toast('앨범에 올렸어요');if(TAB==='album')renderMain()}).catch(upFail);return '앨범에 올리는 중이에요'}
  if(a.type==='poll'){S.poll={id:uid(),q:a.q,open:true,opts:(a.opts||[]).slice(0,4).map(t=>({t,v:[]}))};return '투표를 만들었어요'}
  if(a.type==='settle'){S.settles.push({id:uid(),date:ymd(today0()),title:a.title,total:a.total,fromDues:0,houses:['h1','h2','h3']});return '정산에 추가했어요'}
  return '반영할 수 없는 항목이에요'}
function localSearch(q){
  const toks=q.split(/\s+/).map(x=>x.replace(/[?.,!]|언제|어디|뭐|있어|알려줘|알려|찾아줘|찾아|검색|해줘|이야|였지|였어|는|은|이|가|을|를|에/g,'')).filter(x=>x.length>=2);if(!toks.length)return [];
  const hit=s=>toks.some(t=>(s||'').includes(t));const out=[];
  S.events.filter(canSee).forEach(e=>{if(hit(e.title+' '+(e.place||'')+' '+TYPES[e.type][0]))out.push(`일정 · ${e.date}${e.end?'~'+e.end:''} ${e.title}`)});
  S.members.forEach(x=>{if(hit(x.name+' 생일 생신')){const nb=nextBd(x);if(nb)out.push(`생일 · ${x.name} ${bdText(x)} → ${ymd(nb)}`)}});
  S.notices.filter(canSee).forEach(n=>{if(hit(n.text))out.push(`공지 · ${n.date} ${n.text}`)});
  S.photos.filter(canSee).forEach(p=>{if(hit(p.caption+' '+p.tag+' '+mem(p.by).name))out.push(`사진 · ${p.date} ${p.caption}`)});
  (S.chat||[]).forEach(m=>{if(m.text&&hit(m.text))out.push(`대화 · ${whoOf(m.by).name}: ${m.text.slice(0,40)}`)});
  if(isDaughter()){S.dues.tx.forEach(x=>{if(hit(x.desc+' 회비'))out.push(`회비 · ${x.date} ${x.desc} ${won(x.amt)}`)});S.settles.forEach(x=>{if(hit(x.title+' 정산'))out.push(`정산 · ${x.date} ${x.title} ${won(x.total)}`)})}
  if(S.poll&&hit(S.poll.q+' 투표'))out.push(`투표 · ${S.poll.q} (${S.poll.opts.map(o=>o.t+' '+o.v.length).join(', ')})`);
  return out.slice(0,8);
}
let BOTFILE=null;
function botLog(){return BOT.map((m,mi)=>m.role==='user'?`<div class="cm mine"><div class="cmb">${m.img?`<img class="bimg" src="${m.img}" alt="">`:''}${m.fname?`<div class="attfile"><span class="fic">${IC.clip}</span><b>${esc(m.fname)}</b></div>`:''}${m.text?`<div class="bub mine">${esc(m.text)}</div>`:''}</div></div>`
  :`<div class="cm"><span class="av aiav" style="background:${AIS[aiCfg().def][1]}">AI</span><div class="cmb"><div class="bub aib">${esc(m.text)}${m.found&&m.found.length?`<ul class="found">${m.found.map(f=>`<li>${esc(f)}</li>`).join('')}</ul>`:''}${m.note?`<span class="small muted" style="display:block;margin-top:4px">${esc(m.note)}</span>`:''}</div>
    ${m.text&&m.text!=='확인하고 있어요…'&&!(m.actions||[]).length?`<div class="bact"><button data-bcp="${mi}">${IC.copy}<span>복사</span></button><button data-bsh="${mi}">${MI.share}<span>공유</span></button><button data-bfw="${mi}">${MI.fwd}<span>대화방에 보내기</span></button></div>`:''}
    ${(m.actions||[]).map((a,ai)=>{const [k,main,sub]=actText(a);return `<div class="actc ${a._st||''}"><span class="tag">${k}</span><b>${esc(main)}</b>${sub?`<span class="small muted">${esc(sub)}</span>`:''}
      ${a._st==='done'?`<span class="small" style="color:var(--pine)">${esc(a._msg||'반영 완료')}</span>`:a._st==='skip'?'<span class="small muted">반영 안 함</span>':
      `<span class="row" style="gap:6px"><button class="btn" data-ap="${mi}:${ai}">반영</button>${a.type==='event'||a.type==='tx'?`<button class="btn ghost" data-ae2="${mi}:${ai}">고쳐서 반영</button>`:''}<button class="chip" data-as="${mi}:${ai}">빼기</button></span>`}</div>`}).join('')}</div></div>`).join('')
  ||(isDaughter()?`<div class="msg ai" style="max-width:100%">말·글·사진·파일로 알려 주시면 일정·회비·공지·앨범·투표에 반영하고, 앱에 있는 내용도 찾아 드립니다.<br><br>예) "다음 주 토요일 6시 가족 외식 잡아줘"<br>예) "김장 언제였지?"<br>예) 영수증 사진 + "어머니 생신 케이크"</div>`
    :`<div class="msg ai" style="max-width:100%">말·글·사진으로 알려 주시면 일정·공지·앨범·투표에 반영하고, 앱에 있는 내용도 찾아 드립니다.<br><br>예) "다음 주 토요일 6시 가족 외식 잡아줘"<br>예) "김장 언제였지?"<br>예) 사진 + "할머니 생신 사진 앨범에 올려줘"</div>`)}
function botSheet(auto){botLoad();botSave();
  const sugg=['김장 언제야?','12월 5일 김장 일정 잡아줘',...(me().role==='child'?['케이크 3만5천원 회비에서 썼어']:[]),'토요일, 일요일 중 외식 투표 만들어줘','다음 주 화요일 오전 10시 아버지 병원'];
  sheet(`<div class="bot"><div class="row between"><h2>AI 비서</h2><span class="row" style="gap:6px"><span class="small muted">${AIS[aiCfg().def][0]}</span>${BOT.length?'<button class="chip" id="bnew">새 대화</button>':''}</span></div>
    <div class="blog" id="blog">${botLog()}</div>
    <div class="sugg">${sugg.map(s=>`<button class="chip" data-s="${esc(s)}">${esc(s)}</button>`).join('')}</div>
    ${BOTFILE?`<div class="row" style="flex-wrap:nowrap">${isImg(BOTFILE)?`<img src="${BOTFILE.data}" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:8px">`:`<span class="fic">${IC.clip}</span>`}<span class="small" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(BOTFILE.name)} · ${fsize(BOTFILE.size)}</span><button class="chip" id="bimgx">빼기</button></div>`:''}
    ${composer('b',{ph:'말·글로 알려 주세요'})}</div>`,true);
  const box=$('#blog');box.scrollTop=box.scrollHeight;
  const cmp=bindComposer('b',{allowEmpty:true,onSend:t=>send(t),onFile:f=>{BOTFILE=f;botSheet()}});const q=cmp.q;
  const send=async txt=>{const t=(txt??q.value).trim();const f=BOTFILE;if(!t&&!f)return;q.value='';BOTFILE=null;
    const img=f&&isImg(f)?f.data:null;
    BOT.push({role:'user',text:t,img,fname:f&&!img?f.name:''});const m={role:'ai',text:'확인하고 있어요…',actions:[]};BOT.push(m);botSheet();
    const hist=[...BOT.filter(x=>x.role==='user'||(x.role==='ai'&&x!==m)).slice(-6).map(x=>({role:x.role==='user'?'user':'ai',text:(x.text||'')+(x.fname?` (첨부 파일: ${x.fname})`:'')||(x.img?'(사진 첨부)':'')}))];
    try{const raw=await callAI(botSys(),hist,undefined,img?await shrink(img,1600):null);let j=null;try{j=JSON.parse((raw.match(/\{[\s\S]*\}/)||[''])[0])}catch(e){}
      if(j){m.text=j.reply||'확인했어요';m.actions=Array.isArray(j.actions)?j.actions:[]}else m.text=raw}
    catch(e){const r=localIntent(t,img);m.text=r.reply;m.actions=r.actions;m.found=r.found;m.note='AI 연결 전이라 기본 해석으로 처리했어요'}
    m.img=img;botSheet()};
  document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>send(b.dataset.s));
  // AI 답변 복사·공유·대화방에 보내기
  document.querySelectorAll('[data-bcp]').forEach(b=>b.onclick=()=>copyText(BOT[+b.dataset.bcp].text));
  document.querySelectorAll('[data-bsh]').forEach(b=>b.onclick=()=>shareText(BOT[+b.dataset.bsh].text));
  document.querySelectorAll('[data-bfw]').forEach(b=>b.onclick=()=>{const t=BOT[+b.dataset.bfw].text;forwardSheet({text:t},botSheet)});
  if($('#bnew'))$('#bnew').onclick=()=>{BOT=[];BOTFILE=null;botSave();botSheet()};
  if($('#bimgx'))$('#bimgx').onclick=()=>{BOTFILE=null;botSheet()};
  const at=s=>{const [mi,ai]=s.split(':').map(Number);return [BOT[mi],BOT[mi].actions[ai]]};
  document.querySelectorAll('[data-ap]').forEach(b=>b.onclick=()=>{const [m,a]=at(b.dataset.ap);a._msg=applyAct(a,m.img);a._st='done';save();botSheet()});
  document.querySelectorAll('[data-as]').forEach(b=>b.onclick=()=>{const [,a]=at(b.dataset.as);a._st='skip';botSheet()});
  document.querySelectorAll('[data-ae2]').forEach(b=>b.onclick=()=>{const [,a]=at(b.dataset.ae2);
    const done=()=>{a._st='done';a._msg='고쳐서 반영했어요';botSheet()};
    if(a.type==='event')eventForm({date:a.date,end:a.end,title:a.title,type:a.kind,time:a.time,place:a.place,repeat:a.repeat},done,botSheet);
    else txForm({date:a.date,desc:a.desc,amount:a.amount,acc:a.acc},done,botSheet)});
  if(typeof auto==='string')send(auto);
}
