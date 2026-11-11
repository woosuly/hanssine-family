
/* features/translate */
const LANGS=[['en','영어','en-US'],['ja','일본어','ja-JP'],['zh','중국어','zh-CN'],['vi','베트남어','vi-VN'],['th','태국어','th-TH'],['es','스페인어','es-ES'],['fr','프랑스어','fr-FR'],['de','독일어','de-DE'],['it','이탈리아어','it-IT'],['ru','러시아어','ru-RU']];
const lg=c=>LANGS.find(x=>x[0]===c)||LANGS[0];
const PHRASES={
  '공항':[['체크인은 어디에서 하나요?','Where is the check-in counter?','웨어 이즈 더 체크인 카운터?','チェックインはどこですか？','첵쿠인와 도코데스카?'],
    ['창가 좌석으로 주세요.','A window seat, please.','어 윈도우 싯, 플리즈.','窓側の席をお願いします。','마도가와노 세키오 오네가이시마스.'],
    ['짐은 어디에서 찾나요?','Where is the baggage claim?','웨어 이즈 더 배기지 클레임?','荷物はどこで受け取れますか？','니모츠와 도코데 우케토레마스카?'],
    ['이 비행기 탑승구가 어디예요?','Where is the gate for this flight?','웨어 이즈 더 게이트 포 디스 플라이트?','この便の搭乗口はどこですか？','코노 빈노 토-죠-구치와 도코데스카?'],
    ['환전소가 어디에 있나요?','Where can I exchange money?','웨어 캔 아이 익스체인지 머니?','両替所はどこですか？','료-가에죠와 도코데스카?']],
  '호텔':[['체크인하려고 합니다. 예약했어요.',"I'd like to check in. I have a reservation.",'아이드 라이크 투 체크인. 아이 해브 어 레저베이션.','チェックインをお願いします。予約しています。','첵쿠인오 오네가이시마스. 요야쿠시테 이마스.'],
    ['와이파이 비밀번호가 뭐예요?','What is the Wi-Fi password?','왓 이즈 더 와이파이 패스워드?','Wi-Fiのパスワードは何ですか？','와이파이노 파스와-도와 난데스카?'],
    ['수건 좀 더 주세요.','Could I have more towels, please?','쿠드 아이 해브 모어 타월스, 플리즈?','タオルをもう少しください。','타오루오 모- 스코시 쿠다사이.'],
    ['체크아웃은 몇 시예요?','What time is check-out?','왓 타임 이즈 체크아웃?','チェックアウトは何時ですか？','첵쿠아우토와 난지데스카?'],
    ['짐을 맡길 수 있나요?','Can I leave my luggage here?','캔 아이 리브 마이 러기지 히어?','荷物を預けられますか？','니모츠오 아즈케라레마스카?']],
  '식당':[['두 사람 자리 있나요?','Do you have a table for two?','두 유 해브 어 테이블 포 투?','二人ですが、席はありますか？','후타리데스가, 세키와 아리마스카?'],
    ['메뉴판 주세요.','Can I see the menu, please?','캔 아이 씨 더 메뉴, 플리즈?','メニューをください。','메뉴-오 쿠다사이.'],
    ['이걸로 주세요.',"I'll have this one, please.",'아일 해브 디스 원, 플리즈.','これをください。','코레오 쿠다사이.'],
    ['맵지 않게 해 주세요.','Not spicy, please.','낫 스파이시, 플리즈.','辛くしないでください。','카라쿠 시나이데 쿠다사이.'],
    ['계산서 주세요.','Check, please.','체크, 플리즈.','お会計をお願いします。','오카이케-오 오네가이시마스.']],
  '쇼핑':[['이거 얼마예요?','How much is this?','하우 머치 이즈 디스?','これはいくらですか？','코레와 이쿠라데스카?'],
    ['좀 깎아 주실 수 있어요?','Can you give me a discount?','캔 유 기브 미 어 디스카운트?','少し安くなりませんか？','스코시 야스쿠 나리마셍카?'],
    ['다른 사이즈 있어요?','Do you have this in another size?','두 유 해브 디스 인 어나더 사이즈?','他のサイズはありますか？','호카노 사이즈와 아리마스카?'],
    ['카드 돼요?','Can I pay by card?','캔 아이 페이 바이 카드?','カードは使えますか？','카-도와 츠카에마스카?'],
    ['그냥 둘러보는 중이에요.',"I'm just looking.",'아임 저스트 루킹.','見ているだけです。','미테이루 다케데스.']],
  '교통':[['이 주소로 가 주세요.','Please take me to this address.','플리즈 테이크 미 투 디스 어드레스.','この住所までお願いします。','코노 쥬-쇼 마데 오네가이시마스.'],
    ['지하철역이 어디예요?','Where is the subway station?','웨어 이즈 더 서브웨이 스테이션?','駅はどこですか？','에키와 도코데스카?'],
    ['여기서 얼마나 걸려요?','How long does it take from here?','하우 롱 더즈 잇 테이크 프롬 히어?','ここからどのくらいかかりますか？','코코카라 도노쿠라이 카카리마스카?'],
    ['여기서 내려 주세요.','Please stop here.','플리즈 스탑 히어.','ここで降ろしてください。','코코데 오로시테 쿠다사이.'],
    ['표 두 장 주세요.','Two tickets, please.','투 티켓츠, 플리즈.','切符を二枚ください。','킵푸오 니마이 쿠다사이.']],
  '병원·긴급':[['도와주세요!','Help me, please!','헬프 미, 플리즈!','助けてください！','타스케테 쿠다사이!'],
    ['병원에 가야 해요.','I need to go to the hospital.','아이 니드 투 고 투 더 하스피털.','病院に行きたいです。','뵤-인니 이키타이데스.'],
    ['약국이 어디예요?','Where is the pharmacy?','웨어 이즈 더 파머시?','薬局はどこですか？','약쿄쿠와 도코데스카?'],
    ['배가 아파요.','I have a stomachache.','아이 해브 어 스터먹에이크.','お腹が痛いです。','오나카가 이타이데스.'],
    ['경찰을 불러 주세요.','Please call the police.','플리즈 콜 더 폴리스.','警察を呼んでください。','케-사츠오 욘데 쿠다사이.']]};
function phrList(){return [...PHRASES[TR.cat].map(p=>({ko:p[0],b:p})),...((S.myPhr||{})[TR.cat]||[]).map(c=>({ko:c.ko,c}))]}
function phrT(it){if(it.b)return phraseT(it.b,TR.to);const c=it.c;return (c.tr||{})[TR.to]||((S.trPacks||{})[TR.to]||{})[c.ko]||[null,null]}
function phraseT(p,c){if(c==='en')return [p[1],p[2]];if(c==='ja')return [p[3],p[4]];const pk=(S.trPacks||{})[c];if(pk&&pk[p[0]])return pk[p[0]];const x=TR.cache['ko>'+c+':'+p[0]];return x?[x.t,x.p]:[null,null]}
async function downloadPack(c){const all=[...Object.values(PHRASES).flat().map(p=>p[0]),...Object.values(S.myPhr||{}).flat().map(x=>x.ko)];
  const sys=`너는 여행 회화 번역가다. JSON 배열만 출력한다. 주어진 한국어 문장들을 ${lg(c)[1]}로 자연스럽게 번역하고, 번역문을 한국 사람이 읽을 수 있는 한글 발음 표기를 붙인다. 형식: [{"k":"원문","t":"번역","p":"한글 발음"}]`;
  const raw=await callAI(sys,[{role:'user',text:JSON.stringify(all)}]);const arr=JSON.parse((raw.match(/\[[\s\S]*\]/)||['[]'])[0]);
  const pk={_at:Date.now()};arr.forEach(x=>{if(x.k&&x.t)pk[x.k]=[x.t,x.p||'']});if(Object.keys(pk).length<5)throw new Error('번역 결과가 비어 있습니다');S.trPacks=S.trPacks||{};S.trPacks[c]=pk;save()}
let TR={mode:'text',to:'en',cat:'공항',last:null,face:{ko:'',ot:'',koT:'',otT:''},cache:{}};
async function translate(text,from,to,img){
  const key=from+'>'+to+':'+text;if(!img&&TR.cache[key])return TR.cache[key];
  if(!img&&from==='ko'){for(const c in PHRASES)for(const p of PHRASES[c])if(p[0]===text.trim()){const [t,pr]=phraseT(p,to);if(t)return {t,p:pr}}}
  if(!navigator.onLine)throw new Error('인터넷 연결이 없습니다. 미리 받은 상황별 표현만 쓸 수 있어요');
  const fromN=from==='ko'?'한국어':from==='auto'?'원문(언어 자동 감지)':lg(from)[1],toN=to==='ko'?'한국어':lg(to)[1];
  const sys=`너는 여행용 통역사다. JSON만 출력한다. ${img?`이미지 속 글자(메뉴판, 표지판, 안내문 등)를 읽어 ${toN}로 번역한다. 메뉴판이면 항목별로 줄바꿈하고 가격을 함께 쓴다.`:`${fromN} 문장을 ${toN}로 자연스럽게 번역한다.`}
형식: {"t":"번역문","p":"${to==='ko'?'':'번역문을 한국 사람이 소리 내어 읽을 수 있는 한글 발음 표기'}","o":"${img?'이미지에서 읽은 원문':''}"}`;
  const raw=await callAI(sys,[{role:'user',text:text||'이 이미지를 번역해 줘'}],undefined,img?await shrink(img,1600):null);
  let j=null;try{j=JSON.parse((raw.match(/\{[\s\S]*\}/)||[''])[0])}catch(e){}
  const r=j||{t:raw,p:''};if(!img)TR.cache[key]=r;return r}
function transSheet(){
  const L=lg(TR.to);
  const langSel=`<select id="tlang" class="chip" aria-label="상대 언어">${LANGS.map(([c,n])=>`<option value="${c}" ${c===TR.to?'selected':''}>${n}</option>`).join('')}</select>`;
  const tabs=`<div class="seg" id="tmode">${[['text','번역'],['face','마주보고 통역'],['phrase','상황별 표현']].map(([k,n])=>`<button data-v="${k}" class="${TR.mode===k?'on':''}">${n}</button>`).join('')}</div>`;
  let body='';
  if(TR.mode==='text'){const r=TR.last;
    body=`<div class="tr-in"><div class="row between"><b>한국어</b><span class="row" style="gap:4px">${ib('tswap','swap','방향 바꾸기')}${langSel}</span></div>
      <textarea id="tsrc" rows="3" placeholder="${TR.rev?L[1]+'로 입력하거나 음성으로':'번역할 말을 쓰거나 음성으로'}">${esc(TR.src||'')}</textarea>
      <div class="row between"><span class="row" style="gap:4px">${ib('tmic','mic','음성 입력')}${ib('timgb','img','사진 번역')}${ib('tcamb','cam','카메라로 번역')}</span><button class="btn" id="tgo">번역</button></div></div>
      ${r?`<div class="tr-out"><div class="small muted">${r.dir}</div>${r.o?`<div class="small muted" style="white-space:pre-wrap">${esc(r.o)}</div>`:''}<div class="tr-t">${esc(r.t)}</div>${r.p?`<div class="tr-p">발음 · ${esc(r.p)}</div>`:''}
        <div class="row" style="gap:6px">${ib('tspk','spk','읽어 주기')}${ib('tcopy','copy','복사')}</div></div>`:''}
      ${fileInputs('t')}`;
    if(TR.rev)body=body.replace('<b>한국어</b>',`<b>${L[1]} → 한국어</b>`);}
  else if(TR.mode==='face'){const F=TR.face;
    body=`<div class="face"><div class="fside flip"><div class="fhead">${esc(L[1])}</div><div class="ftxt">${esc(F.otT||F.ot||'Tap the button and speak')}</div>${F.ot&&F.otT?`<div class="small muted">${esc(F.ot)}</div>`:''}<button class="fmic" id="fot">${IC.mic}<span>${L[0]==='en'?'Speak':L[0]==='ja'?'話す':L[0]==='zh'?'说话':'Speak'}</span></button></div>
      <div class="fside"><div class="fhead">한국어 ${langSel}</div><div class="ftxt">${esc(F.koT||F.ko||'버튼을 누르고 말하세요')}</div>${F.koT&&F.ko?`<div class="small muted">${esc(F.ko)}</div>`:''}${F.p?`<div class="tr-p">발음 · ${esc(F.p)}</div>`:''}<button class="fmic ko" id="fko">${IC.mic}<span>말하기</span></button></div></div>`}
  else{const cats=Object.keys(PHRASES);const has=TR.to==='en'||TR.to==='ja';const pk=(S.trPacks||{})[TR.to];
    const got=Object.keys(S.trPacks||{});const list=phrList();
    body=`<div class="hscroll">${cats.map(c=>`<button class="chip ${TR.cat===c?'on':''}" data-cat="${c}">${c}</button>`).join('')}</div>
      <div class="dlbar"><span class="row" style="gap:6px;flex-wrap:nowrap">${langSel}<span class="small ${has||pk?'':'muted'}" ${has||pk?'style="color:var(--pine)"':''}>${has?'기본 포함':pk?'미리 받음':'미리 받지 않음'}</span></span>
        <button class="chip" id="dlp">${pk?'다시 받기':'미리 받기'}</button></div>
      ${got.length?`<div class="small muted">받아 둔 언어: ${got.map(c=>lg(c)[1]).join(', ')} · 인터넷 없이 사용</div>`:''}
      <div class="addphr"><input id="nphr" placeholder="필요한 문장을 한국어로 입력" autocomplete="off"><button class="btn" id="addphr">추가</button></div>
      <div class="phr">${list.map((it,i)=>{const [t,pr]=phrT(it);
        return `<div class="card pc"><div class="row between" style="flex-wrap:nowrap"><span class="small muted">${esc(it.ko)}</span>${it.c?`<span class="row" style="gap:4px;flex-wrap:nowrap"><span class="tag">${esc((mem(it.c.by)||{name:''}).name)}</span>${it.c.by===ME?`<button class="chip" data-pdel="${i}">삭제</button>`:''}</span>`:''}</div>${t?`<div class="pt">${esc(t)}</div><div class="tr-p">${esc(pr||'')}</div>
          <div class="row" style="gap:6px"><button class="btn" data-ps="${i}">${IC.spk}<span>들려주기</span></button><button class="btn ghost" data-pbig="${i}">크게 보여주기</button></div>`:`<button class="btn ghost" data-pai="${i}">${L[1]}로 번역</button>`}</div>`}).join('')}</div>`}
  const html=`<div class="trans">${tabs}${!navigator.onLine?'<div class="small" style="color:var(--red)">인터넷 연결 없음 · 미리 받은 상황별 표현만 사용 가능</div>':''}${body}</div>`;
  const root=$('#transroot');if(root&&TAB==='trans'&&!isSenior())root.innerHTML=html;else sheet(html,true);
  segBind('#tmode',v=>{stopListen();TR.mode=v;transSheet()});
  if($('#tlang'))$('#tlang').onchange=e=>{TR.to=e.target.value;TR.last=null;TR.face={};transSheet()};
  const err=e=>toast(aiErr(e).split('.')[0]);
  if(TR.mode==='text'){
    const from=()=>TR.rev?TR.to:'ko',to=()=>TR.rev?'ko':TR.to;
    const go=async img=>{const s=$('#tsrc').value.trim();TR.src=s;if(!s&&!img)return;$('#tgo').textContent='번역 중…';
      try{const r=await translate(s,from(),to(),img);TR.last={...r,dir:`${from()==='ko'?'한국어':lg(from())[1]} → ${to()==='ko'?'한국어':lg(to())[1]}`,lang:to()};transSheet()}catch(e){$('#tgo').textContent='번역';err(e)}};
    $('#tgo').onclick=()=>go();
    $('#tswap').onclick=()=>{TR.rev=!TR.rev;TR.last=null;transSheet()};
    $('#tmic').onclick=()=>{const b=$('#tmic');if(REC){stopListen();return}listen((t,fin)=>{$('#tsrc').value=t;if(fin)go()},(st,e2)=>{b.classList.toggle('rec',st==='listening');if(st!=='listening'&&st!=='end')toast(micMsg(st,e2))},TR.rev?L[2]:'ko-KR')};
    $('#timgb').onclick=()=>$('#timg').click();$('#tcamb').onclick=()=>$('#tcam').click();
    bindFiles('t',f=>{if(isImg(f)){TR.rev=false;go(f.data)}});
    if($('#tspk'))$('#tspk').onclick=()=>speakIn(TR.last.t,TR.last.lang==='ko'?'ko-KR':lg(TR.last.lang)[2]);
    if($('#tcopy'))$('#tcopy').onclick=()=>{try{navigator.clipboard.writeText(TR.last.t).then(()=>toast('복사했어요'),()=>toast('복사할 수 없습니다'))}catch(e){}}}
  if(TR.mode==='face'){
    const run=async(side)=>{const isKo=side==='ko',b=$(isKo?'#fko':'#fot');if(REC){stopListen();return}
      listen(async(t,fin)=>{if(isKo)TR.face.ko=t;else TR.face.ot=t;if(!fin)return;
        try{const r=await translate(t,isKo?'ko':TR.to,isKo?TR.to:'ko');if(isKo){TR.face.otT=r.t;TR.face.ot='';TR.face.p=r.p;TR.face.koT='';speakIn(r.t,L[2])}else{TR.face.koT=r.t;TR.face.ko='';TR.face.p='';speakIn(r.t,'ko-KR')}
          if(isKo)TR.face.koOrig=t;transSheet()}catch(e){err(e)}},
        (st,e2)=>{b.classList.toggle('rec',st==='listening');if(st!=='listening'&&st!=='end')toast(micMsg(st,e2))},isKo?'ko-KR':L[2])};
    $('#fko').onclick=()=>run('ko');$('#fot').onclick=()=>run('ot')}
  if(TR.mode==='phrase'){
    document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{TR.cat=b.dataset.cat;transSheet()});
    const list=phrList();const T=i=>phrT(list[i]);
    $('#dlp').onclick=async()=>{const b=$('#dlp');b.textContent='받는 중…';b.disabled=true;try{await downloadPack(TR.to);toast(L[1]+' 표현을 받아 두었어요');transSheet()}catch(e){b.disabled=false;b.textContent='미리 받기';toast(aiErr(e).split('.')[0])}};
    document.querySelectorAll('[data-ps]').forEach(b=>b.onclick=()=>speakIn(T(+b.dataset.ps)[0],L[2]));
    document.querySelectorAll('[data-pbig]').forEach(b=>b.onclick=()=>{const i=+b.dataset.pbig;
      sheet(`<div class="bigshow"><div class="small muted">${esc(list[i].ko)}</div><div class="bigt">${esc(T(i)[0])}</div><div class="tr-p">${esc(T(i)[1]||'')}</div><button class="btn" id="bs">${IC.spk}<span>들려주기</span></button></div>`,true,()=>{close();transSheet()});
      $('#bs').onclick=()=>speakIn(T(i)[0],L[2])});
    const trOne=async it=>{const r=await translate(it.ko,'ko',TR.to);if(it.c){it.c.tr=it.c.tr||{};it.c.tr[TR.to]=[r.t,r.p||''];save()}};
    document.querySelectorAll('[data-pai]').forEach(b=>b.onclick=async()=>{b.textContent='번역 중…';try{await trOne(list[+b.dataset.pai]);transSheet()}catch(e){b.textContent=L[1]+'로 번역';err(e)}});
    document.querySelectorAll('[data-pdel]').forEach(b=>b.onclick=()=>{const c=list[+b.dataset.pdel].c;S.myPhr[TR.cat]=(S.myPhr[TR.cat]||[]).filter(x=>x!==c);save();transSheet()});
    const add=async()=>{const v=$('#nphr').value.trim();if(!v)return;S.myPhr=S.myPhr||{};const c={ko:v,by:ME,tr:{}};(S.myPhr[TR.cat]=S.myPhr[TR.cat]||[]).push(c);save();
      $('#addphr').textContent='번역 중…';try{await trOne({ko:v,c});toast('추가했어요')}catch(e){toast('추가했어요 · 번역은 인터넷·AI 연결 후 됩니다')}transSheet()};
    $('#addphr').onclick=add;$('#nphr').onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();add()}}}

}
